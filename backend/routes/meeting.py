"""
routes/meeting.py
──────────────────
REST API for meeting management.

Endpoints:
  POST /api/meeting/start                    → create a new meeting
  POST /api/meeting/end/{meeting_id}         → end a meeting
  GET  /api/meeting                          → list all meetings
  GET  /api/meeting/{meeting_id}             → get meeting info
  GET  /api/meeting/{meeting_id}/transcript  → get transcript segments
  GET  /api/meeting/{meeting_id}/summary     → get AI summary
  GET  /api/metrics                          → dashboard aggregate stats
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
import services.meeting_service as meeting_service
import services.llm_service as llm_service

router = APIRouter(tags=["meeting"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _format_time(seconds: float) -> str:
    """Convert float seconds to a relative 'MM:SS' string."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"


# ─── Start / End ──────────────────────────────────────────────────────────────

@router.post("/api/meeting/start")
async def start_meeting():
    """Create a new meeting and return its ID."""
    meeting = meeting_service.create_meeting()
    return {
        "meeting_id": meeting["id"],
        "status":     meeting["status"],
        "started_at": meeting["started_at"]
    }


@router.post("/api/meeting/end/{meeting_id}")
async def end_meeting(meeting_id: str, background_tasks: BackgroundTasks):
    """End a meeting. Triggers AI analysis in the background."""
    meeting = meeting_service.end_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    transcript = meeting_service.get_transcript(meeting_id)
    if transcript:
        background_tasks.add_task(_run_ai_analysis, meeting_id, transcript)

    return {
        "meeting_id": meeting_id,
        "status":     "ended",
        "ended_at":   meeting["ended_at"],
        "message":    "Meeting ended. AI analysis is running in the background."
    }


# ─── List / Get ───────────────────────────────────────────────────────────────

@router.get("/api/meeting")
async def list_meetings():
    """List all meetings (lightweight — includes content flags for smart selection)."""
    meetings = meeting_service.list_meetings()
    return meetings


@router.get("/api/meeting/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get full meeting info including AI results (if ready)."""
    meeting = meeting_service.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {
        "id":                  meeting["id"],
        "status":              meeting["status"],
        "started_at":          meeting["started_at"],
        "ended_at":            meeting["ended_at"],
        "summary":             meeting["summary"],
        "decisions":           meeting["decisions"],
        "action_items":        meeting["action_items"],
        "transcript_segments": len(meeting["transcript"])
    }


@router.get("/api/meeting/{meeting_id}/transcript")
async def get_transcript(meeting_id: str):
    """Return all transcript segments with formatted timestamps."""
    transcript = meeting_service.get_transcript(meeting_id)
    if transcript is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting = meeting_service.get_meeting(meeting_id)
    first = meeting.get("transcript", [{}])[0] if meeting.get("transcript") else {}

    # Map backend segment shape → frontend TranscriptItem shape
    segments = [
        {
            "speaker":              seg.get("speaker", "unknown"),
            "time":                 _format_time(seg.get("start", 0)),
            "text":                 seg.get("text", ""),
            # keep raw fields for developer use
            "start":                seg.get("start"),
            "end":                  seg.get("end"),
            "language":             seg.get("language"),
            "language_probability": seg.get("language_probability"),
        }
        for seg in transcript
    ]

    return {
        "meeting_id":           meeting_id,
        "detected_language":    first.get("language"),
        "language_probability": first.get("language_probability"),
        "segment_count":        len(transcript),
        "segments":             segments,
    }


@router.get("/api/meeting/{meeting_id}/summary")
async def get_summary(meeting_id: str):
    """Return AI-generated summary, decisions, and action items."""
    meeting = meeting_service.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Return cached result if available
    if meeting.get("summary"):
        action_items = meeting["action_items"] or []
        return {
            "meeting_id": meeting_id,
            "summary":    meeting["summary"],
            "decisions":  meeting["decisions"],
            # frontend calls this key "actions"
            "actions":    [
                {
                    "id":    idx + 1,
                    "title": item.get("task", ""),
                    "owner": item.get("owner", ""),
                    "due":   item.get("deadline") or "TBD",
                    "done":  False,
                }
                for idx, item in enumerate(action_items)
            ],
        }

    # Run analysis now (synchronously — user is waiting)
    transcript = meeting_service.get_transcript(meeting_id)
    if not transcript:
        raise HTTPException(
            status_code=400,
            detail="No transcript available yet. Wait for audio to be transcribed."
        )

    result = llm_service.analyse_meeting(transcript)
    meeting_service.save_ai_results(
        meeting_id,
        result["summary"],
        result["decisions"],
        result["action_items"],
        result.get("sentiment_score", 50)
    )

    return {
        "meeting_id": meeting_id,
        "summary":    result["summary"],
        "decisions":  result["decisions"],
        "actions":    [
            {
                "id":    idx + 1,
                "title": item.get("task", ""),
                "owner": item.get("owner", ""),
                "due":   item.get("deadline") or "TBD",
                "done":  False,
            }
            for idx, item in enumerate(result["action_items"])
        ],
    }


# ─── Metrics ──────────────────────────────────────────────────────────────────

@router.get("/api/metrics")
async def get_metrics():
    """Compute real aggregate stats from the meetings database for the dashboard."""
    all_meetings = meeting_service.list_meetings()
    all_full     = [meeting_service.get_meeting(m["id"]) for m in all_meetings]

    total_meetings = len(all_full)

    # Count meetings that have at least one transcript segment
    transcribed = sum(1 for m in all_full if m and m.get("transcript"))
    transcribed_pct = round((transcribed / total_meetings * 100) if total_meetings else 0)

    # Flatten all action items
    all_actions = [
        item
        for m in all_full if m
        for item in (m.get("action_items") or [])
    ]
    total_actions = len(all_actions)

    # Average meeting length in minutes (from started_at → ended_at)
    durations = []
    for m in all_full:
        if m and m.get("started_at") and m.get("ended_at"):
            try:
                start = datetime.fromisoformat(m["started_at"])
                end   = datetime.fromisoformat(m["ended_at"])
                durations.append((end - start).total_seconds() / 60)
            except Exception:
                pass
    avg_length_min = round(sum(durations) / len(durations)) if durations else 0

    # Hours saved: assume ~30 min saved per transcribed meeting (no manual note-taking)
    hours_saved = round(transcribed * 0.5, 1)

    # Average Sentiment Score
    sentiments = [m.get("sentiment_score") for m in all_full if m and m.get("sentiment_score") is not None]
    avg_sentiment = round(sum(sentiments) / len(sentiments)) if sentiments else 50

    return {
        "totalMeetings":          total_meetings,
        "transcribedPercent":     transcribed_pct,
        "totalActions":           total_actions,
        "completedPercent":       0,      # requires task persistence — placeholder
        "avgLengthMin":           avg_length_min,
        "hoursSaved":             hours_saved,
        "sentimentPercent":       avg_sentiment,
        "teamEngagementPercent":  84,     # placeholder until diarization is added
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
            result["action_items"],
            result.get("sentiment_score", 50)
        )
        print(f"[Meeting] AI analysis done for {meeting_id}")
    except Exception as e:
        print(f"[Meeting] AI analysis failed for {meeting_id}: {e}")