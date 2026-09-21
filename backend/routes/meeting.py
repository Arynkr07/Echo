"""
routes/meeting.py
──────────────────
REST API for meeting management.

Endpoints:
  POST /meeting/start                    → create a new meeting, get meeting_id
  POST /meeting/end/{meeting_id}         → end a meeting
  GET  /meeting                          → list all meetings
  GET  /meeting/{meeting_id}             → get meeting info
  GET  /meeting/{meeting_id}/transcript  → get transcript segments (with language)
  GET  /meeting/{meeting_id}/summary     → get AI summary (triggers Gemini if needed)
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
import services.meeting_service as meeting_service
import services.llm_service as llm_service

router = APIRouter(prefix="/meeting", tags=["meeting"])


# ─── Start / End ──────────────────────────────────────────────────────────────

@router.post("/start")
async def start_meeting():
    """Create a new meeting and return its ID."""
    meeting = meeting_service.create_meeting()
    return {
        "meeting_id": meeting["id"],
        "status":     meeting["status"],
        "started_at": meeting["started_at"]
    }


@router.post("/end/{meeting_id}")
async def end_meeting(meeting_id: str, background_tasks: BackgroundTasks):
    """
    End a meeting.
    Triggers AI analysis in the background so the response is instant.
    """
    meeting = meeting_service.end_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # If there's a transcript, kick off AI analysis in background
    transcript = meeting_service.get_transcript(meeting_id)
    if transcript:
        background_tasks.add_task(_run_ai_analysis, meeting_id, transcript)

    return {
        "meeting_id": meeting_id,
        "status":     "ended",
        "ended_at":   meeting["ended_at"],
        "message":    "Meeting ended. AI analysis is running in the background."
    }


# ─── Get ──────────────────────────────────────────────────────────────────────

@router.get("")
async def list_meetings():
    """List all meetings (lightweight — no transcript data)."""
    return meeting_service.list_meetings()


@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get full meeting info including AI results (if ready)."""
    meeting = meeting_service.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    # Don't include raw transcript in this response — use /transcript endpoint
    return {
        "id":           meeting["id"],
        "status":       meeting["status"],
        "started_at":   meeting["started_at"],
        "ended_at":     meeting["ended_at"],
        "summary":      meeting["summary"],
        "decisions":    meeting["decisions"],
        "action_items": meeting["action_items"],
        "transcript_segments": len(meeting["transcript"])
    }


@router.get("/{meeting_id}/transcript")
async def get_transcript(meeting_id: str):
    """
    Return all transcript segments with full language metadata.
    Each segment:
    {
        "speaker": "Aryan",
        "start": 0.0,
        "end": 5.2,
        "text": "Let's finalize the launch date.",
        "language": "en",
        "language_probability": 0.97
    }
    """
    transcript = meeting_service.get_transcript(meeting_id)
    if transcript is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting = meeting_service.get_meeting(meeting_id)
    return {
        "meeting_id":           meeting_id,
        "detected_language":    meeting.get("transcript", [{}])[0].get("language")    if meeting.get("transcript") else None,
        "language_probability": meeting.get("transcript", [{}])[0].get("language_probability") if meeting.get("transcript") else None,
        "segment_count":        len(transcript),
        "segments":             transcript
    }


@router.get("/{meeting_id}/summary")
async def get_summary(meeting_id: str):
    """
    Return AI-generated summary, decisions, and action items.
    If analysis hasn't run yet (meeting still active), runs it now.
    """
    meeting = meeting_service.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Return cached result if available
    if meeting.get("summary"):
        return {
            "meeting_id":   meeting_id,
            "summary":      meeting["summary"],
            "decisions":    meeting["decisions"],
            "action_items": meeting["action_items"]
        }

    # Run analysis now (synchronously — user is waiting)
    transcript = meeting_service.get_transcript(meeting_id)
    if not transcript:
        raise HTTPException(status_code=400, detail="No transcript available yet. Wait for audio to be transcribed.")

    result = llm_service.analyse_meeting(transcript)
    meeting_service.save_ai_results(
        meeting_id,
        result["summary"],
        result["decisions"],
        result["action_items"]
    )

    return {
        "meeting_id":   meeting_id,
        "summary":      result["summary"],
        "decisions":    result["decisions"],
        "action_items": result["action_items"]
    }


# ─── Background helpers ───────────────────────────────────────────────────────

def _run_ai_analysis(meeting_id: str, transcript: list):
    """Background task — run Gemini analysis after meeting ends."""
    print(f"[Meeting] Running AI analysis for {meeting_id}...")
    try:
        result = llm_service.analyse_meeting(transcript)
        meeting_service.save_ai_results(
            meeting_id,
            result["summary"],
            result["decisions"],
            result["action_items"]
        )
        print(f"[Meeting] AI analysis done for {meeting_id}")
    except Exception as e:
        print(f"[Meeting] AI analysis failed for {meeting_id}: {e}")