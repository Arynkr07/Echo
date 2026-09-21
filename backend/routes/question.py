"""
routes/question.py
───────────────────
"Ask Your Meeting" endpoint.

POST /meeting/{meeting_id}/question
Body:   { "question": "What was decided about the launch?" }
Response: {
    "answer": "The team decided on October 15.",
    "source": { "speaker": "Rahul", "timestamp": "34:21" }
}
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import services.meeting_service as meeting_service
import services.llm_service as llm_service

router = APIRouter(prefix="/meeting", tags=["question"])


class QuestionRequest(BaseModel):
    question: str


@router.post("/{meeting_id}/question")
async def ask_question(meeting_id: str, body: QuestionRequest):
    """
    Answer a user's natural-language question about the meeting.
    Uses Gemini to search the transcript and generate a sourced answer.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    transcript = meeting_service.get_transcript(meeting_id)
    if transcript is None:
        raise HTTPException(status_code=404, detail="Meeting not found.")
    if not transcript:
        raise HTTPException(status_code=400, detail="No transcript available yet for this meeting.")

    result = llm_service.answer_question(transcript, body.question)

    return {
        "meeting_id": meeting_id,
        "question":   body.question,
        "answer":     result.get("answer"),
        "source":     result.get("source")
    }