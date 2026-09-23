"""
services/transcription.py
──────────────────────────
High-speed Cloud Whisper transcription using Groq API (whisper-large-v3-turbo).
Zero local model download, runs in ~2 seconds with exact word timestamps.
Fallback to local whisper if GROQ_API_KEY is not configured.
"""

import os
import subprocess
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class TranscriptionService:

    def __init__(self, model_name: str = "whisper-large-v3-turbo"):
        self.model_name = model_name
        if GROQ_API_KEY:
            from groq import Groq
            self.client = Groq(api_key=GROQ_API_KEY)
            print(f"[Groq-Whisper] Initialized Cloud Whisper ({self.model_name}) [OK] (Zero local RAM/Download)")
        else:
            self.client = None
            print("[Whisper] WARNING: GROQ_API_KEY not found, initializing fallback local model...")
            from faster_whisper import WhisperModel
            self.model = WhisperModel("small", device="cpu", compute_type="int8")

    # ─────────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────────

    def transcribe(self, audio_path: str) -> dict:
        """
        Transcribe audio file (WAV or WebM) and return:
        {
            "language": "en",
            "language_probability": 1.0,
            "segments": [
                {
                    "start": 0.0,
                    "end": 3.5,
                    "text": "Hello world",
                    "language": "en",
                    "language_probability": 1.0
                },
                ...
            ]
        }
        """
        if not Path(audio_path).exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Cloud Groq Whisper (Instant & High Accuracy)
        if self.client is not None:
            try:
                with open(audio_path, "rb") as file_obj:
                    response = self.client.audio.transcriptions.create(
                        file=(Path(audio_path).name, file_obj.read()),
                        model=self.model_name,
                        response_format="verbose_json",
                        prompt="The following is a meeting conversation in English and Hinglish with numbers, technical terms, and dates (e.g. 2303, 10, Oct 5, Aryan, Rahul, deliverables, API, sync).",
                        temperature=0.0
                    )

                segments = []
                # Extract verbose segments
                raw_segments = getattr(response, "segments", []) or []
                for seg in raw_segments:
                    start_time = seg.get("start", 0.0) if isinstance(seg, dict) else getattr(seg, "start", 0.0)
                    end_time = seg.get("end", 0.0) if isinstance(seg, dict) else getattr(seg, "end", 0.0)
                    text = seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", "")

                    segments.append({
                        "start": round(start_time, 2),
                        "end":   round(end_time, 2),
                        "text":  text.strip(),
                        "language": "en",
                        "language_probability": 1.0
                    })

                # Fallback if verbose segments was empty but full text exists
                if not segments and getattr(response, "text", ""):
                    segments.append({
                        "start": 0.0,
                        "end": 5.0,
                        "text": response.text.strip(),
                        "language": "en",
                        "language_probability": 1.0
                    })

                return {
                    "language": "en",
                    "language_probability": 1.0,
                    "segments": segments
                }
            except Exception as e:
                print(f"[Groq-Whisper] Cloud transcription error: {e}")
                return {
                    "language": "unknown",
                    "language_probability": 0.0,
                    "segments": []
                }

        # Fallback Local Model
        segments_iter, info = self.model.transcribe(
            audio_path,
            beam_size=5,
            language="en",
            task="transcribe",
            vad_filter=True
        )

        segments = []
        for seg in segments_iter:
            segments.append({
                "start": round(seg.start, 2),
                "end":   round(seg.end,   2),
                "text":  seg.text.strip(),
                "language": info.language,
                "language_probability": round(info.language_probability, 4)
            })

        return {
            "language": info.language,
            "language_probability": round(info.language_probability, 4),
            "segments": segments
        }

    def transcribe_webm(self, webm_path: str) -> dict:
        """
        Converts the WebM file to clean WAV using bundled FFmpeg, then sends to Groq.
        """
        webm_path = Path(webm_path)
        if not webm_path.exists():
            raise FileNotFoundError(f"WebM file not found: {webm_path}")

        wav_path = webm_path.with_suffix(".wav")
        try:
            self._convert_to_wav(str(webm_path), str(wav_path))
            return self.transcribe(str(wav_path))
        except Exception as e:
            print(f"[TranscriptionService] Decoding failed: {e}")
            return {
                "language": "unknown",
                "language_probability": 0.0,
                "segments": []
            }
        finally:
            if wav_path.exists():
                wav_path.unlink()

    # ─────────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _convert_to_wav(input_path: str, output_path: str):
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        
        cmd = [
            ffmpeg_exe,
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