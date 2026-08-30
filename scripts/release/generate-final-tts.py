#!/usr/bin/env python3
"""Generate the final ActionOS narration with Gemini TTS on Vertex AI."""

from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import wave

from google import genai
from google.genai import types


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs/submission/demo-narration-final.md"
OUTPUT = ROOT / "docs/submission/evidence/2026-08-22/v12-final/actionos-narration-v12.wav"
SEGMENTS = OUTPUT.parent / "narration-segments"


def narration_paragraphs() -> list[str]:
    document = SOURCE.read_text(encoding="utf-8")
    script = document.split("## Script", 1)[1].split("## Delivery notes", 1)[0].strip()
    return [" ".join(paragraph.splitlines()) for paragraph in script.split("\n\n") if paragraph.strip()]


def narration_segments(limit: int = 135) -> list[str]:
    segments: list[str] = []
    current: list[str] = []
    count = 0
    for paragraph in narration_paragraphs():
        words = len(paragraph.split())
        if current and count + words > limit:
            segments.append("\n\n".join(current))
            current = []
            count = 0
        current.append(paragraph)
        count += words
    if current:
        segments.append("\n\n".join(current))
    return segments


def generate_segment(index_and_text: tuple[int, str]) -> Path:
    index, text = index_and_text
    direction = """Read the text below exactly as written. You are a warm, trustworthy technical
founder in your thirties giving a live software demonstration to expert hackathon judges. Use
neutral American English, restrained confidence, natural sentence-level variation, and a calm
conversational delivery. Never sound theatrical, promotional, breathless, or like a commercial.
Speak at approximately 135 words per minute. Pronounce ActionOS as 'Due Back', Gemini as
'Gem-in-eye', and Genkit as 'Gen-kit'. Pause before and after 'Acknowledgement is not proof.' Pause
before 'A deterministic verifier—not the model—accepts that evidence.' Do not add, omit, repeat, or
paraphrase words.

TEXT TO READ:
"""
    client = genai.Client(
        vertexai=True,
        project="bulbasour-503317",
        location="global",
        http_options=types.HttpOptions(timeout=180_000),
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=direction + text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Charon")
                )
            ),
        ),
    )
    part = response.candidates[0].content.parts[0]
    if part.inline_data is None or part.inline_data.data is None:
        raise RuntimeError("Gemini returned no inline audio data")
    SEGMENTS.mkdir(parents=True, exist_ok=True)
    segment_path = SEGMENTS / f"segment-{index:02d}.wav"
    with wave.open(str(segment_path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(part.inline_data.data)
    print(segment_path)
    return segment_path


def main() -> None:
    segments = narration_segments()
    with ThreadPoolExecutor(max_workers=2) as pool:
        paths = list(pool.map(generate_segment, enumerate(segments, start=1)))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    silence = b"\x00\x00" * 6000
    with wave.open(str(OUTPUT), "wb") as combined:
        combined.setnchannels(1)
        combined.setsampwidth(2)
        combined.setframerate(24000)
        for index, path in enumerate(paths):
            with wave.open(str(path), "rb") as segment:
                combined.writeframes(segment.readframes(segment.getnframes()))
            if index < len(paths) - 1:
                combined.writeframes(silence)
    print(OUTPUT)


if __name__ == "__main__":
    main()
