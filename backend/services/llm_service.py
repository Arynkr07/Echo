"""
services/llm_service.py
────────────────────────
Uses the Google Gemini API to analyse a meeting transcript and extract:
  • Summary
  • Decisions
  • Action items (task + owner + deadline)

Also powers the "Ask Your Meeting" feature.

Setup:
  1. Get a free key at https://ai.google.dev
  2. Add GEMINI_API_KEY=your_key to backend/.env
"""

import json
import google.genai as genai
from google.genai import types

from config import GEMINI_API_KEY, GEMINI_MODEL


# ─── Configure Gemini once ────────────────────────────────────────────────────
if GEMINI_API_KEY:
    _client = genai.Client(api_key=GEMINI_API_KEY)
else:
    _client = None
    print("[LLM] WARNING: GEMINI_API_KEY not set. LLM calls will return mock responses.")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _transcript_to_text(transcript: list) -> str:
    """Format transcript segments into readable text for the LLM prompt."""
    lines = []
    for seg in transcript:
        speaker   = seg.get("speaker", "Unknown")
        start     = seg.get("start", 0)
        text      = seg.get("text", "")
        timestamp = f"{int(start // 60):02d}:{int(start % 60):02d}"
        lines.append(f"{speaker} [{timestamp}]: {text}")
    return "\n".join(lines)


def _call_gemini(prompt: str, retries: int = 3) -> str:
    """Send a prompt to Gemini and return the text response.
    Retries up to `retries` times on 503 UNAVAILABLE (server overload)."""
    if _client is None:
        raise RuntimeError("Gemini not configured -- set GEMINI_API_KEY in .env")

    import time
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            response = _client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )
            return response.text
        except Exception as e:
            last_error = e
            # Retry only on 503 (server overload) or 429 (rate limit)
            if "503" in str(e) or "429" in str(e):
                wait = 2 ** attempt  # 2s, 4s, 8s
                print(f"[LLM] Gemini {e.__class__.__name__} on attempt {attempt}/{retries} -- retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise  # Don't retry on other errors (404, 400, etc.)

    raise last_error


def _mock_analysis() -> dict:
    """Returned when Gemini is not configured — clearly labelled as mock."""
    return {
        "summary":      "[MOCK] Gemini API key not set. Add GEMINI_API_KEY to backend/.env",
        "decisions":    ["[MOCK] Example decision 1", "[MOCK] Example decision 2"],
        "action_items": [
            {"task": "[MOCK] Complete backend API", "owner": "Aryan",  "deadline": "Oct 5"},
            {"task": "[MOCK] Prepare presentation",  "owner": "Rahul",  "deadline": "Oct 8"}
        ],
        "sentiment_score": 85
    }


# ─── Public API ───────────────────────────────────────────────────────────────

def analyse_meeting(transcript: list) -> dict:
    """
    Analyse the full transcript and return:
    {
        "summary":      "...",
        "decisions":    ["...", "..."],
        "action_items": [{"task": "...", "owner": "...", "deadline": "..."}, ...]
    }
    """
    if not transcript:
        return {"summary": "No transcript available.", "decisions": [], "action_items": []}

    if _client is None:
        return _mock_analysis()

    transcript_text = _transcript_to_text(transcript)

    prompt = f"""You are an expert meeting analyst. Analyse the following meeting transcript and extract structured information.

TRANSCRIPT:
{transcript_text}

Return ONLY a valid JSON object with exactly these keys:
{{
  "summary": "2-4 sentence overview of what the meeting covered",
  "decisions": ["decision 1", "decision 2", ...],
  "action_items": [
    {{"task": "what needs to be done", "owner": "person responsible", "deadline": "deadline if mentioned, else null"}},
    ...
  ],
  "sentiment_score": 85
}}

Rules:
- sentiment_score must be an integer from 0 to 100 based on the mood of the transcript (e.g. 90+ is very positive/productive, 50 is neutral, <40 is tense)

Rules:
- Be concise and factual
- Only include decisions that were explicitly made
- Only include action items that were explicitly assigned
- If something is not mentioned, use an empty array
- Return valid JSON only, no markdown fences"""

    try:
        raw = _call_gemini(prompt)
        # Strip markdown fences if Gemini adds them anyway
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(raw)
    except (json.JSONDecodeError, Exception) as e:
        print(f"[LLM] analyse_meeting error: {e}")
        return {
            "summary":      "Analysis failed — see server logs.",
            "decisions":    [],
            "action_items": [],
            "sentiment_score": 50
        }


def answer_question(transcript: list, question: str) -> dict:
    """
    Answer a user's question about the meeting.
    Returns:
    {
        "answer": "...",
        "source": { "speaker": "...", "timestamp": "MM:SS" }  | null
    }
    """
    if not transcript:
        return {"answer": "No transcript available for this meeting.", "source": None}

    if _client is None:
        return {
            "answer": "[MOCK] Gemini API key not set. Add GEMINI_API_KEY to backend/.env",
            "source": None
        }

    transcript_text = _transcript_to_text(transcript)

    prompt = f"""You are an expert meeting assistant. Answer the user's question using ONLY information from the meeting transcript below.

TRANSCRIPT:
{transcript_text}

QUESTION: {question}

Return ONLY a valid JSON object:
{{
  "answer": "your answer here",
  "source": {{
    "speaker": "name of the person who said this",
    "timestamp": "MM:SS"
  }}
}}

If the answer is not in the transcript, set answer to "This was not discussed in the meeting." and source to null.
Return valid JSON only, no markdown fences."""

    try:
        raw = _call_gemini(prompt)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        return json.loads(raw)
    except (json.JSONDecodeError, Exception) as e:
        print(f"[LLM] answer_question error: {e}")
        return {"answer": "Failed to generate answer — see server logs.", "source": None}
