import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
TEMP_AUDIO_DIR = BASE_DIR / "temp_audio"
TEMP_AUDIO_DIR.mkdir(exist_ok=True)

# ─── Whisper ──────────────────────────────────────────────────────────────────
WHISPER_MODEL_SIZE = "small"   # tiny / base / small / medium / large
WHISPER_DEVICE     = "cpu"
WHISPER_COMPUTE    = "int8"

# ─── Gemini ───────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = "gemini-2.5-flash"   # Fast, highly accurate Google model
