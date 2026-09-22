"""
test_transcription.py
──────────────────────
Quick sanity check — loads Whisper and transcribes meeting.wav.

Run from the backend/ directory:
    python test_transcription.py

If meeting.wav doesn't exist yet:
    cd ../processing
    python generate_test_audio.py --speech
"""

import sys
from pathlib import Path

# Resolve audio path relative to this script — works regardless of CWD
SCRIPT_DIR  = Path(__file__).parent
AUDIO_FILE  = SCRIPT_DIR.parent / "processing" / "meeting.wav"

if not AUDIO_FILE.exists():
    print(f"[ERROR] Audio file not found: {AUDIO_FILE}")
    print()
    print("  Fix:  cd processing && python generate_test_audio.py --speech")
    sys.exit(1)

print(f"[test] Using audio file: {AUDIO_FILE}")
print()

from services.transcription import TranscriptionService

service = TranscriptionService()
result  = service.transcribe(str(AUDIO_FILE))

print(f"\n{'-'*60}")
print(f"  Language : {result['language']}  "
      f"(confidence: {result['language_probability']:.0%})")
print(f"{'-'*60}")

if not result["segments"]:
    print("  (no speech detected -- try --speech flag when generating test audio)")
else:
    for seg in result["segments"]:
        print(f"  [{seg['start']:6.2f}s -> {seg['end']:6.2f}s]  {seg['text']}")

print(f"{'-'*60}\n")
print("[test] Whisper transcription is working!")