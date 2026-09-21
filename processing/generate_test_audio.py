"""
generate_test_audio.py
──────────────────────
Generates processing/meeting.wav so you can test Whisper without a real
meeting recording.

Two modes:
  python generate_test_audio.py           → 440 Hz sine-wave tone (silent test)
  python generate_test_audio.py --speech  → TTS speech via pyttsx3 (if installed)

The WAV is always written next to this script as meeting.wav.
"""

import struct
import math
import wave
import argparse
from pathlib import Path

OUTPUT = Path(__file__).parent / "meeting.wav"
SAMPLE_RATE = 16_000   # 16 kHz — what Whisper prefers


# ─────────────────────────────────────────────────────────────────────────────
# Pure Python WAV generation — no scipy / numpy needed
# ─────────────────────────────────────────────────────────────────────────────

def generate_tone_wav(path: Path, duration_s: float = 5.0, frequency: float = 440.0):
    """Write a simple sine-wave WAV at 16 kHz mono."""
    n_samples = int(SAMPLE_RATE * duration_s)
    samples = [
        int(32767 * math.sin(2 * math.pi * frequency * i / SAMPLE_RATE))
        for i in range(n_samples)
    ]
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)   # 16-bit
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(struct.pack(f"<{n_samples}h", *samples))
    print(f"[generate_test_audio] Tone WAV written -> {path}")


def generate_speech_wav(path: Path):
    """Write a TTS WAV using pyttsx3 (English speech Whisper can transcribe)."""
    try:
        import pyttsx3
    except ImportError:
        print("[generate_test_audio] pyttsx3 not installed -- falling back to tone WAV.")
        generate_tone_wav(path)
        return

    try:
        import tempfile, shutil

        engine = pyttsx3.init()
        engine.setProperty("rate", 150)

        tmp = tempfile.mktemp(suffix=".wav")
        engine.save_to_file(
            "Hello, this is a test meeting. "
            "Today we decided to launch the product on October 15th. "
            "Aryan will complete the backend API by October 5th. "
            "Rahul will prepare the presentation by October 8th.",
            tmp
        )
        engine.runAndWait()
        shutil.move(tmp, str(path))
        print(f"[generate_test_audio] Speech WAV written -> {path}")
    except Exception as e:
        print(f"[generate_test_audio] TTS failed ({e}) — falling back to tone WAV.")
        generate_tone_wav(path)


# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a test WAV for Whisper.")
    parser.add_argument(
        "--speech",
        action="store_true",
        help="Use pyttsx3 TTS to generate real speech (better for Whisper testing)"
    )
    args = parser.parse_args()

    if args.speech:
        generate_speech_wav(OUTPUT)
    else:
        generate_tone_wav(OUTPUT)

    print(f"[generate_test_audio] File size: {OUTPUT.stat().st_size / 1024:.1f} KB")
