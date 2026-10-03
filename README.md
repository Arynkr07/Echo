# Echo — Real-Time Meeting Intelligence Platform

> Transform your meetings with **ECHO**: a lightweight, privacy-focused workspace intelligence tool that captures live Google Meet discussions to deliver speaker-attributed real-time transcripts and structured AI takeaways.

---

## 🚀 Recent Architectural & UI Updates

In our latest development sprint, Echo transitioned from a local single-user utility into a **multi-tenant cloud-ready SaaS platform** with streamlined UX:

### 1. UI & Navigation Cleanup
- **Focused Product Experience**: Stripped all GitHub repository links, star buttons, and external redirects from the landing page (`frontend/app/page.tsx`) and dashboard header/sidebar to keep the UI clean, distraction-free, and enterprise-ready.
- **Developer Guide Overhaul**: Completely redesigned `frontend/app/developer/page.tsx` into a guided 5-step visual walkthrough for loading the unpacked Chrome extension, checking environment dependencies, and understanding the audio streaming pipeline.

### 2. Dashboard Enhancements
- **Live Meeting State Integrity**: Dashboard polling now strictly verifies `status === "active"` before mounting live transcript feeds, preventing past or ended meetings from lingering as "Live".
- **Inline Profile Customization**: Added interactive inline editing to the dashboard greeting (`Good morning, <User> 👋`), persisting custom display names to local storage across sessions.
- **Meeting History Route (`/dashboard/history`)**: Built a dedicated history interface accessible via the sidebar clock icon (🕒). Users can browse previous meetings and inspect AI summaries, key decisions, and action items in a master-detail split view.

### 3. "Zero-Config" Multi-Tenant SaaS Architecture
- **Silent Dashboard Sync (`dashboard-sync.js`)**: Automatically syncs the authenticated Firebase UID from the Next.js web application to the Chrome Extension via content script messaging. Users never need to generate API tokens or log in twice.
- **Extension Background Relay (`background.js`)**: Stores the synced user ID and dispatches it in the `meeting_start` WebSocket handshake payload to the backend.
- **Tenant Isolation (`backend/services/meeting_service.py` & `backend/routes/meeting.py`)**: All database operations, transcripts, summaries, and metrics are isolated by user ID via `x-user-id` headers and session state, ensuring full data privacy across multi-user environments.

---

## 🏗️ System Architecture

Echo operates across three tightly integrated layers:

```
┌──────────────────────────────────────┐          WebSocket (Port 3001)         ┌──────────────────────────────────────┐
│       Chrome Extension (MV3)         │  ───────────────────────────────────►  │        extension_ws.py (WS)          │
│ - Tab Audio Capture via Offscreen    │  Payload: { meetingId, userId, ... }   │ - Session Management & Isolation     │
│ - DOM Speaker Detection              │                                        │ - Groq Whisper Large-v3 STT          │
│ - Floating Overlay Subtitles         │  ◄───────────────────────────────────  │ - Real-Time Transcript Broadcast     │
│ - Silent User ID Sync Script         │        Live Subtitles / Status         └──────────────────┬───────────────────┘
└──────────────────────────────────────┘                                                           │
                                                                                                   │ Meeting Data & Transcripts
                                                                                                   ▼
┌──────────────────────────────────────┐           REST API (Port 8000)         ┌──────────────────────────────────────┐
│       Next.js 16 Dashboard           │  ───────────────────────────────────►  │         FastAPI (main.py)            │
│ - Firebase Authentication            │       Headers: { x-user-id: uid }      │ - User-Isolated Meeting CRUD         │
│ - Real-Time Transcript Monitor       │  ◄───────────────────────────────────  │ - Gemini 2.5 Flash Intelligence      │
│ - Meeting History (/dashboard/history)│       Transcripts / Summaries / Tasks  │ - In-Meeting Q&A Engine & Metrics    │
└──────────────────────────────────────┘                                        └──────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Firebase Auth |
| **Chrome Extension** | Manifest V3, Web Audio API, TabCapture API, Offscreen Documents, WebSockets |
| **Backend Services** | FastAPI, Python 3.10+, Uvicorn, WebSockets |
| **AI / ML Pipeline** | Groq Cloud API (`whisper-large-v3`), Google Gemini (`gemini-2.5-flash`), PyAnnote Diarization (Roadmap) |

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
Create `backend/.env` using `backend/.env.example`:
```bash
# Google AI Studio API Key (Summary, Key Decisions, Action Items, Q&A)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq API Key (Ultra-fast Whisper Large-v3 Speech-to-Text)
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend (`frontend/.env.local`)
Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

---

## 🚦 Getting Started

### 1. Start the WebSocket Server (Ingestion & STT)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python extension_ws.py
```
*Listens on `ws://localhost:3001`.*

### 2. Start the FastAPI REST Server
In a new terminal:
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --port 8000 --reload
```
*API available at `http://localhost:8000` (docs at `http://localhost:8000/docs`).*

### 3. Start the Next.js Frontend
In a new terminal:
```powershell
cd frontend
npm install
npm run dev
```
*Dashboard available at `http://localhost:3000`.*

### 4. Install the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** (top right corner).
3. Click **Load unpacked** and select the `Echo/extension` folder.
4. Log into `http://localhost:3000` — your user ID is automatically synced to the extension.
5. Join any Google Meet session (`https://meet.google.com/...`) and click the Echo extension icon to begin recording!

---

## 📡 API & Protocol Reference

### WebSocket Protocol (`ws://localhost:3001`)

- **Start Session** (`Extension -> Backend`):
  ```json
  {
    "type": "meeting_start",
    "meetingId": "echo-1727123456789-a3f2",
    "tabUrl": "https://meet.google.com/abc-defg-hij",
    "userId": "firebase_uid_or_anonymous"
  }
  ```
- **Stream Audio Chunk** (`Extension -> Backend`, every 5s):
  ```json
  {
    "type": "audio_chunk",
    "meetingId": "echo-1727123456789-a3f2",
    "timestamp": "2026-10-01T18:00:00.000Z",
    "audio": "<base64_encoded_webm>",
    "mimeType": "audio/webm;codecs=opus"
  }
  ```
- **End Session** (`Extension -> Backend`):
  ```json
  {
    "type": "meeting_end",
    "meetingId": "echo-1727123456789-a3f2"
  }
  ```

### REST Endpoints (`http://localhost:8000`)

All REST endpoints accept the `x-user-id` header for tenant isolation:

- `GET /api/meeting`: Returns all meetings belonging to the authenticated user.
- `GET /api/meeting/{id}`: Returns meeting details, status, and summary.
- `GET /api/meeting/{id}/transcript`: Returns speaker-labeled transcript segments.
- `GET /api/meeting/{id}/summary`: Returns structured AI summary, decisions, and action items.
- `POST /api/meeting/{id}/question`: Ask contextual questions regarding the meeting transcript.
- `GET /api/metrics`: Aggregated workspace statistics (hours saved, completed tasks, sentiment).

---

## 🛡️ License & Privacy
Echo is designed with privacy at its core:
- Audio is captured client-side using native Chrome APIs without external third-party bot accounts joining calls.
- Transcripts and summaries are strictly scoped to the authenticated user ID.
