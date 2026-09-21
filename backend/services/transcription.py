"""
services/transcription.py
──────────────────────────
Wraps faster-whisper. Handles:
  • Model loading (singleton — loaded once at startup)
  • WAV transcription with language detection
  • WebM → WAV conversion via FFmpeg before transcription
"""

import subprocess
import tempfile
import os
from pathlib import Path

from faster_whisper import WhisperModel


class TranscriptionService:

    def __init__(self, model_size: str = "small"):
        print(f"[Whisper] Loading model '{model_size}'...")
        self.model = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8"
        )
        print("[Whisper] Model loaded!")

    # ─────────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────────

    def transcribe(self, audio_path: str) -> dict:
        """
        Transcribe a WAV file and return:
        {
            "language": "en",
            "language_probability": 0.97,
            "segments": [
                {
                    "start": 0.0,
                    "end": 3.5,
                    "text": "Hello world",
                    "language": "en",
                    "language_probability": 0.97
                },
                ...
            ]
        }
        Every segment carries the language metadata so Riddhima's frontend
        can colour-code or filter by language per utterance.
        """
        if not Path(audio_path).exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        segments_iter, info = self.model.transcribe(
            audio_path,
            beam_size=5,
            language=None,          # auto-detect
            task="transcribe"
        )

        segments = []
        for seg in segments_iter:
            segments.append({
                "start": round(seg.start, 2),
                "end":   round(seg.end,   2),
                "text":  seg.text.strip(),
                # Carry language on each segment — useful when speaker changes
                # language mid-meeting (code-switching)
                "language":             info.language,
                "language_probability": round(info.language_probability, 4)
            })

        return {
            "language":             info.language,
            "language_probability": round(info.language_probability, 4),
            "segments":             segments
        }

    def transcribe_webm(self, webm_path: str) -> dict:
        """
        Converts a WebM file (from the browser's MediaRecorder) to a
        temporary WAV and then transcribes it.
        The temporary WAV is deleted after transcription.
        """
        webm_path = Path(webm_path)
        if not webm_path.exists():
            raise FileNotFoundError(f"WebM file not found: {webm_path}")

        # Write WAV to a temp file next to the webm
        wav_path = webm_path.with_suffix(".wav")

        try:
            self._convert_to_wav(str(webm_path), str(wav_path))
            result = self.transcribe(str(wav_path))
        finally:
            # Always clean up the temp WAV
            if wav_path.exists():
                wav_path.unlink()

        return result

    # ─────────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _convert_to_wav(input_path: str, output_path: str):
        """Use FFmpeg to convert any audio format → 16 kHz mono WAV."""
        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-ar", "16000",
            "-ac", "1",
            "-f", "wav",
            output_path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            err = result.stderr.decode("utf-8", errors="replace")
            raise RuntimeError(f"FFmpeg conversion failed:\n{err}")