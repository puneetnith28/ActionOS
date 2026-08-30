#!/usr/bin/env python3
"""Generate one replacement narration line with the final DueBack voice."""

import argparse
from pathlib import Path
import wave

from google import genai
from google.genai import types


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    direction = """Read the text below exactly as written. You are a warm, trustworthy technical
founder in your thirties giving a live software demonstration to expert hackathon judges. Use
neutral American English, restrained confidence, natural sentence-level variation, and a calm
conversational delivery. Never sound theatrical, promotional, breathless, or like a commercial.
Speak at approximately 135 words per minute. Pronounce DueBack as 'Due Back', Gemini as
'Gem-in-eye', and Genkit as 'Gen-kit'. Do not add, omit, repeat, or paraphrase words.

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
        contents=direction + args.text,
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
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(args.output), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24_000)
        audio.writeframes(part.inline_data.data)
    print(args.output)


if __name__ == "__main__":
    main()
