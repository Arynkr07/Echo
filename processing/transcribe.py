"""
transcribe.py
─────────────
Standalone transcription script — runs Whisper on a WAV file and prints
the full transcript with language detection metadata.

Usage:
    python transcribe.py meeting.wav
    python transcribe.py meeting.wav --model base
    python transcribe.py meeting.wav --output transcript.json
"""

import argparse
import json
import sys
from pathlib import Path

# Allow running from the processing/ directory directly
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from services.transcription import TranscriptionService


def main():
    parser = argparse.ArgumentParser(description="Transcribe a WAV file with Whisper.")
    parser.add_argument("audio",  help="Path to the WAV file")
    parser.add_argument("--model",  default="small", help="Whisper model size (default: small)")
    parser.add_argument("--output", help="Save JSON transcript to this file (optional)")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"[transcribe] ERROR: File not found: {audio_path}")
        print("  → Run: python generate_test_audio.py --speech   to create a test WAV")
        sys.exit(1)

    print(f"[transcribe] Loading Whisper ({args.model})...")
    service = TranscriptionService(model_size=args.model)

    print(f"[transcribe] Transcribing: {audio_path}")
    result = service.transcribe(str(audio_path))

    # ─── Print results ────────────────────────────────────────────────────────
    print(f"\n{'─'*60}")
    print(f"  Language : {result['language']}  "
          f"(confidence: {result['language_probability']:.0%})")
    print(f"{'─'*60}")

    if not result["segments"]:
        print("  (no speech detected)")
    else:
        for seg in result["segments"]:
            print(f"  [{seg['start']:6.2f}s → {seg['end']:6.2f}s]  {seg['text']}")

    print(f"{'─'*60}\n")

    # ─── Optional JSON output ─────────────────────────────────────────────────
    if args.output:
        out_path = Path(args.output)
        out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(f"[transcribe] JSON saved → {out_path}")


if __name__ == "__main__":
    main()
