"""
extract_audio.py
────────────────
Extracts audio from a video file (MP4/MKV/etc.) and converts it to a
16 kHz mono WAV file that Whisper can process.

Usage:
    python extract_audio.py input.mp4
    python extract_audio.py input.mp4 --output custom_name.wav

Requires FFmpeg to be installed and on PATH.
"""

import subprocess
import argparse
from pathlib import Path


def extract_audio(input_path: str, output_path: str = None) -> str:
    """
    Convert any video/audio file to a 16kHz mono WAV using FFmpeg.

    Args:
        input_path:  Path to the source video/audio file.
        output_path: (Optional) destination WAV path.
                     Defaults to the same folder as input, with .wav extension.

    Returns:
        The path to the created WAV file.
    """
    input_path  = Path(input_path)
    output_path = Path(output_path) if output_path else input_path.with_suffix(".wav")

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    cmd = [
        "ffmpeg",
        "-y",                        # overwrite output without asking
        "-i", str(input_path),       # input file
        "-ar", "16000",              # 16 kHz sample rate (Whisper requirement)
        "-ac", "1",                  # mono channel
        "-f", "wav",                 # output format
        str(output_path)
    ]

    print(f"[extract_audio] Converting: {input_path.name} → {output_path.name}")

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    if result.returncode != 0:
        error = result.stderr.decode("utf-8", errors="replace")
        raise RuntimeError(f"FFmpeg failed:\n{error}")

    print(f"[extract_audio] Done → {output_path}")
    return str(output_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract and convert audio to WAV.")
    parser.add_argument("input",  help="Input video/audio file")
    parser.add_argument("--output", help="Output WAV path (optional)")
    args = parser.parse_args()

    wav_path = extract_audio(args.input, args.output)
    print(f"[extract_audio] WAV saved to: {wav_path}")
