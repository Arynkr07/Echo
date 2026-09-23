"""
Injects a fake transcript into a meeting to test the Gemini summary + Q&A endpoints
without needing real audio.
"""
import sys
import requests

MEETING_ID = sys.argv[1] if len(sys.argv) > 1 else "test-id"
BASE = "http://127.0.0.1:8002"

# Simulated transcript — realistic meeting conversation
fake_segments = [
    {"speaker": "Rahul",  "start": 0.0,   "end": 8.0,   "text": "Okay everyone, let's start. Today we need to finalize the launch date for Echo.", "language": "en", "language_probability": 0.98},
    {"speaker": "Aryan",  "start": 8.5,   "end": 18.0,  "text": "I think October 15th works. The backend API should be ready by then.", "language": "en", "language_probability": 0.97},
    {"speaker": "Riddhima","start": 18.5,  "end": 28.0,  "text": "Frontend will be ready too. I need the API docs from Aryan by October 5th though.", "language": "en", "language_probability": 0.96},
    {"speaker": "Aryan",  "start": 28.5,  "end": 36.0,  "text": "Sure, I'll send the API documentation by October 5th. Also the WebSocket spec.", "language": "en", "language_probability": 0.97},
    {"speaker": "Rahul",  "start": 36.5,  "end": 46.0,  "text": "Good. So we've decided: launch date is October 15th. Aryan sends API docs by October 5th.", "language": "en", "language_probability": 0.98},
    {"speaker": "Riddhima","start": 46.5,  "end": 55.0,  "text": "I'll have the dashboard and transcript UI done by October 10th.", "language": "en", "language_probability": 0.96},
    {"speaker": "Rahul",  "start": 55.5,  "end": 62.0,  "text": "Perfect. Let's also use Supabase for the database as we discussed last time.", "language": "en", "language_probability": 0.98},
    {"speaker": "Aryan",  "start": 62.5,  "end": 70.0,  "text": "Agreed. I'll set up the Supabase schema after the API is done.", "language": "en", "language_probability": 0.97},
]

# Directly call the service via a test endpoint — inject into meeting store
# We do this by calling a helper script that imports meeting_service directly
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import services.meeting_service as ms

# Add segments to the meeting
result = {
    "language": "en",
    "language_probability": 0.97,
    "segments": fake_segments
}
ms.add_transcript(MEETING_ID, result, speaker="multiple")

# Verify
t = ms.get_transcript(MEETING_ID)
print(f"Injected {len(t)} segments into meeting {MEETING_ID}")
print("Done — now test /summary and /question endpoints")
