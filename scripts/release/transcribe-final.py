#!/usr/bin/env python3
"""Transcribe the final narration and create readable, evidence-safe SRT cues."""

from pathlib import Path
import json
import re

from faster_whisper import WhisperModel


ROOT = Path(__file__).resolve().parents[2]
AUDIO = ROOT / "docs/submission/evidence/2026-08-22/v12-final/actionos-narration-v12-final.wav"
OUT = ROOT / "docs/submission/evidence/2026-08-22/v12-final"


def timestamp(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    whole_seconds, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02d}:{minutes:02d}:{whole_seconds:02d},{milliseconds:03d}"


def corrected_words(words: list[dict]) -> list[dict]:
    replacements = {
        ("do", "-back"): "ActionOS",
        ("do", "-back's"): "ActionOS's",
        ("follow", "-up"): "follow-up",
        ("item", "-potent"): "idempotent",
    }
    corrected = []
    index = 0
    while index < len(words):
        if index + 1 < len(words):
            pair = (
                re.sub(r"[^a-z'-]", "", words[index]["text"].lower()),
                re.sub(r"[^a-z'-]", "", words[index + 1]["text"].lower()),
            )
            if pair in replacements:
                trailing = re.sub(r"[A-Za-z'-]", "", words[index + 1]["text"])
                corrected.append(
                    {
                        "text": f"{replacements[pair]}{trailing}",
                        "start": words[index]["start"],
                        "end": words[index + 1]["end"],
                    }
                )
                index += 2
                continue
        word = dict(words[index])
        if word["text"].lower().rstrip(".,") == "fireside":
            punctuation = word["text"][len(word["text"].rstrip(".,")) :]
            word["text"] = f"Firestore{punctuation}"
        corrected.append(word)
        index += 1
    return corrected


def main() -> None:
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    segments, info = model.transcribe(str(AUDIO), beam_size=5, word_timestamps=True, vad_filter=True)
    words = []
    for segment in segments:
        for word in segment.words or []:
            text = word.word.strip()
            if text:
                words.append({"text": text, "start": word.start, "end": word.end})

    words = corrected_words(words)
    cues = []
    current = []
    for word in words:
        proposed = " ".join(item["text"] for item in [*current, word])
        duration = word["end"] - (current[0]["start"] if current else word["start"])
        boundary = bool(re.search(r"[.!?]$", current[-1]["text"])) if current else False
        if current and (len(current) >= 9 or len(proposed) > 38 or duration > 3.5 or (boundary and duration >= 1.2)):
            cues.append(current)
            current = []
        current.append(word)
    if current:
        cues.append(current)

    srt = []
    for index, cue in enumerate(cues, start=1):
        start = cue[0]["start"]
        end = max(cue[-1]["end"], start + 1.2)
        text = " ".join(word["text"] for word in cue)
        srt.extend([str(index), f"{timestamp(start)} --> {timestamp(end)}", text, ""])

    (OUT / "actionos-narration-v12.words.json").write_text(
        json.dumps({"language": info.language, "probability": info.language_probability, "words": words}, indent=2),
        encoding="utf-8",
    )
    (OUT / "actionos-subtitles-v12.srt").write_text("\n".join(srt), encoding="utf-8")
    (OUT / "actionos-transcript-v12.txt").write_text(" ".join(word["text"] for word in words) + "\n", encoding="utf-8")
    print(f"{len(words)} words, {len(cues)} cues, language={info.language}")


if __name__ == "__main__":
    main()
