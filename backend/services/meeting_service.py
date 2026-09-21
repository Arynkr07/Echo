"""
services/meeting_service.py
────────────────────────────
In-memory meeting store. No database needed yet — everything lives in a
Python dict. When Riddhima's team sets up Supabase/PostgreSQL we just
swap this module's implementation without touching the routes.

Each meeting entry:
{
    "id":           str,
    "status":       "active" | "ended",
    "started_at":   ISO-8601 string,
    "ended_at":     ISO-8601 string | None,
    "transcript":   [ { start, end, text, speaker, language, language_probability } ],
    "summary":      str | None,
    "decisions":    [ str ],
    "action_items": [ { task, owner, deadline } ]
}
"""

import uuid
from datetime import datetime

# In-memory store — keyed by meeting_id
_meetings: dict = {}


# ─────────────────────────────────────────────────────────────────────────────
# CRUD
# ─────────────────────────────────────────────────────────────────────────────

def create_meeting() -> dict:
    meeting_id = str(uuid.uuid4())
    _meetings[meeting_id] = {
        "id":           meeting_id,
        "status":       "active",
        "started_at":   datetime.now().isoformat(),
        "ended_at":     None,
        "transcript":   [],
        "summary":      None,
        "decisions":    [],
        "action_items": []
    }
    print(f"[MeetingService] Created meeting: {meeting_id}")
    return _meetings[meeting_id]


def get_meeting(meeting_id: str) -> dict | None:
    return _meetings.get(meeting_id)


def end_meeting(meeting_id: str) -> dict | None:
    meeting = _meetings.get(meeting_id)
    if not meeting:
        return None
    meeting["status"]   = "ended"
    meeting["ended_at"] = datetime.now().isoformat()
    print(f"[MeetingService] Ended meeting: {meeting_id}")
    return meeting


def list_meetings() -> list:
    """Return all meetings (summary view — no full transcript)."""
    return [
        {
            "id":         m["id"],
            "status":     m["status"],
            "started_at": m["started_at"],
            "ended_at":   m["ended_at"],
        }
        for m in _meetings.values()
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Transcript
# ─────────────────────────────────────────────────────────────────────────────

def add_transcript(meeting_id: str, transcript_result: dict, speaker: str = "unknown") -> bool:
    """
    Store transcription output from TranscriptionService.transcribe().
    Merges each segment with meeting_id and speaker info.
    """
    meeting = _meetings.get(meeting_id)
    if not meeting:
        return False

    for seg in transcript_result.get("segments", []):
        meeting["transcript"].append({
            "meeting_id":           meeting_id,
            "speaker":              speaker,
            "start":                seg["start"],
            "end":                  seg["end"],
            "text":                 seg["text"],
            "language":             seg.get("language",             transcript_result.get("language")),
            "language_probability": seg.get("language_probability", transcript_result.get("language_probability"))
        })

    print(f"[MeetingService] Added {len(transcript_result.get('segments', []))} segments to {meeting_id}")
    return True


def get_transcript(meeting_id: str) -> list | None:
    meeting = _meetings.get(meeting_id)
    if not meeting:
        return None
    return meeting["transcript"]


# ─────────────────────────────────────────────────────────────────────────────
# AI Results
# ─────────────────────────────────────────────────────────────────────────────

def save_ai_results(meeting_id: str, summary: str, decisions: list, action_items: list) -> bool:
    meeting = _meetings.get(meeting_id)
    if not meeting:
        return False
    meeting["summary"]      = summary
    meeting["decisions"]    = decisions
    meeting["action_items"] = action_items
    return True