# Echo — Integration & Architecture Guide

> **Architecture Documentation for Frontend, Backend & Extension**  
> Complete reference for endpoints, WebSocket communication, AI pipelines, and setup.

---

## 1. System Overview

Echo runs as three synchronized services:

```
┌──────────────────────────┐          WebSocket (Port 3001)         ┌──────────────────────────┐
│  Chrome Extension (MV3)  │  ───────────────────────────────────►  │  extension_ws.py (WS)   │
│  - Tab Audio Capture     │                                        │  - Groq Whisper STT      │
│  - Floating UI Overlay   │  ◄───────────────────────────────────  │  - Gemini Intelligence  │
└──────────────────────────┘        Live Subtitles / Status         └────────────┬─────────────┘
                                                                                 │
                                                                                 │ File DB
                                                                                 ▼
┌──────────────────────────┐           REST API (Port 8000)         ┌──────────────────────────┐
│  Next.js 16 Dashboard    │  ───────────────────────────────────►  │  FastAPI (main.py)      │
│  - Live Transcripts      │  ◄───────────────────────────────────  │  - Meeting Analytics     │
│  - Summaries & Tasks     │         JSON / Metrics / Q&A           │  - Question Answering    │
└──────────────────────────┘                                        └──────────────────────────┘
```

---

## 2. Environment Variables

### Backend (`backend/.env`)
```bash
# Google AI Studio API Key (Get at https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq Cloud API Key for ultra-fast Whisper Large-v3 STT (Get at https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_app.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

---

## 3. WebSocket Protocol (`ws://localhost:3001`)

The Chrome Extension communicates with `extension_ws.py` over WebSocket on port 3001.

### 3.1 Messages Sent by Extension ➔ Backend

#### `meeting_start`
Fires when user starts recording on Google Meet:
```json
{
  "type": "meeting_start",
  "meetingId": "echo-1727123456789-a3f2",
  "tabUrl": "https://meet.google.com/abc-defg-hij"
}
```

#### `audio_chunk`
Sent every 5 seconds with chunked audio:
```json
{
  "type": "audio_chunk",
  "meetingId": "echo-1727123456789-a3f2",
  "timestamp": "2026-09-23T22:00:00.000Z",
  "audio": "<base64-encoded webm audio>",
  "mimeType": "audio/webm;codecs=opus"
}
```

#### `speaker_update`
Sent when the DOM observer detects active speaker change:
```json
{
  "type": "speaker_update",
  "meetingId": "echo-1727123456789-a3f2",
  "speaker": "Aryan Kumar",
  "timestamp": "2026-09-23T22:00:05.000Z"
}
```

#### `meeting_end`
Fires when user stops recording:
```json
{
  "type": "meeting_end",
  "meetingId": "echo-1727123456789-a3f2"
}
```

### 3.2 Messages Sent by Backend ➔ Extension

#### `status`
Updates extension pill status:
```json
{ "type": "status", "message": "Transcribing with Groq Whisper..." }
```

#### `transcript_update`
Sends transcribed segments back to the extension floating overlay:
```json
{
  "type": "transcript_update",
  "meetingId": "echo-1727123456789-a3f2",
  "speaker": "Aryan",
  "text": "Let us finalize the backend by tomorrow.",
  "timestamp": "00:04",
  "language": "en"
}
```

---

## 4. REST API Endpoints (`http://localhost:8000`)

### `GET /api/meeting`
Returns lightweight list of all recorded meetings (sorted newest first):
```json
[
  {
    "id": "echo-1790184824416-a52b",
    "status": "ended",
    "started_at": "2026-09-23T23:03:44.426635",
    "ended_at": "2026-09-23T23:03:59.730768",
    "has_transcript": true,
    "has_summary": true
  }
]
```

### `GET /api/meeting/{meeting_id}/transcript`
Returns full transcript segments with formatted relative time:
```json
{
  "meeting_id": "echo-1790184824416-a52b",
  "detected_language": "en",
  "segment_count": 3,
  "segments": [
    {
      "speaker": "Aryan",
      "time": "00:03",
      "text": "2303 hello hello",
      "start": 3.0,
      "end": 5.2,
      "language": "en"
    }
  ]
}
```

### `GET /api/meeting/{meeting_id}/summary`
Returns AI summary, key decisions, and action items:
```json
{
  "meeting_id": "echo-1790184824416-a52b",
  "summary": "The team aligned on finishing the backend deliverables by tomorrow.",
  "decisions": ["Backend freeze set for Oct 5"],
  "actions": [
    {
      "id": 1,
      "title": "Finish the backend API",
      "owner": "Aryan",
      "due": "tomorrow",
      "done": false
    }
  ]
}
```

### `GET /api/metrics`
Computes live aggregate metrics for the dashboard:
```json
{
  "totalMeetings": 14,
  "transcribedPercent": 85,
  "totalActions": 4,
  "completedPercent": 0,
  "avgLengthMin": 2,
  "hoursSaved": 3.5,
  "sentimentPercent": 80,
  "teamEngagementPercent": 84
}
```

### `POST /api/meeting/{meeting_id}/question`
Ask questions about a meeting:
```json
// Request
{ "question": "What is the deadline for the backend?" }

// Response
{
  "answer": "The deadline for the backend is tomorrow as agreed by Aryan.",
  "source": { "speaker": "Aryan", "timestamp": "00:03" }
}
```

---

## 5. Setup & Running Instructions

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in GEMINI_API_KEY and GROQ_API_KEY in .env
```

### 2. Run Servers
**Terminal 1 (WebSocket Audio Ingestion):**
```powershell
venv\Scripts\python.exe extension_ws.py
```

**Terminal 2 (FastAPI REST Backend):**
```powershell
venv\Scripts\uvicorn.exe main:app --port 8000 --reload
```

**Terminal 3 (Next.js Dashboard):**
```powershell
cd frontend
npm install
npm run dev
```

---

## 6. Advanced Roadmap

1. **Speaker Diarization (`pyannote.audio`):** Replace `unknown` speaker with voice biometric clustering so individual voices are distinguished automatically.
2. **Multimodal Vision (Screenshots):** Capture periodic tab screenshots (`chrome.tabs.captureVisibleTab`) and forward to Gemini Vision along with audio transcript for slide/code context.
