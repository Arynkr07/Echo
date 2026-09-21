# Echo Extension — Integration Guide for Backend & Frontend

> **For Person 2 (Backend) and Person 3 (Frontend)**  
> This document explains exactly what the extension sends and expects, so you can wire up your code correctly.

---

## 1. WebSocket Connection

The extension connects to:

```
ws://localhost:3001
```

Your backend **must run a WebSocket server on port 3001**.

> If you want to change the port, tell Person 1. The URL is in one place:  
> `extension/background/background.js` → `const BACKEND_WS_URL = 'ws://localhost:3001'`

---

## 2. Messages the Extension SENDS to the Backend

All messages are **JSON strings** sent over WebSocket.

### 2.1 `meeting_start`
Sent when the user clicks "Start Recording".

```json
{
  "type": "meeting_start",
  "meetingId": "echo-1727123456789-a3f2",
  "tabUrl": "https://meet.google.com/abc-defg-hij"
}
```

**What backend should do:**
- Create a new meeting record in the database
- Store `meetingId` — all future messages from this session use this ID
- Respond with a `status` message (optional but nice)

---

### 2.2 `audio_chunk`
Sent every **5 seconds** while recording.

```json
{
  "type": "audio_chunk",
  "meetingId": "echo-1727123456789-a3f2",
  "timestamp": "2024-09-21T16:45:23.000Z",
  "audio": "<base64-encoded audio data>",
  "mimeType": "audio/webm;codecs=opus"
}
```

**What backend should do:**
1. Decode `audio` from base64 → binary buffer
2. Write to a temp file (e.g. `chunk_<timestamp>.webm`)
3. Send to Whisper for transcription
4. Save transcript to database
5. Send `transcript_update` back to extension (optional, for overlay)

**How to decode in Node.js:**
```js
const audioBuffer = Buffer.from(message.audio, 'base64');
// write to file or pipe directly to whisper
```

---

### 2.3 `speaker_update`
Sent whenever the active speaker on Google Meet changes.

```json
{
  "type": "speaker_update",
  "meetingId": "echo-1727123456789-a3f2",
  "speaker": "Aryan Kumar",
  "timestamp": "2024-09-21T16:45:19.000Z"
}
```

**What backend should do:**
- Store the current speaker
- Tag the next transcript chunk with this speaker name
- This is how you know WHO said what

---

### 2.4 `meeting_end`
Sent when the user clicks "Stop Recording".

```json
{
  "type": "meeting_end",
  "meetingId": "echo-1727123456789-a3f2"
}
```

**What backend should do:**
- Mark meeting as ended in database
- Trigger final LLM analysis (summary, decisions, action items)
- Clean up temp audio files

---

## 3. Messages the Extension EXPECTS from the Backend

The extension listens for these messages from the backend. They are **optional** — the extension works without them, but they power the live overlay on Google Meet.

### 3.1 `transcript_update`
Show a new transcript line in the Meet overlay.

```json
{
  "type": "transcript_update",
  "meetingId": "echo-1727123456789-a3f2",
  "speaker": "Aryan Kumar",
  "text": "Let's set the deadline for October 15.",
  "timestamp": "00:34:21"
}
```

### 3.2 `status`
Show a status message in the Meet overlay.

```json
{
  "type": "status",
  "message": "Transcribing..."
}
```

---

## 4. Minimal Backend WebSocket Server (Node.js starter)

Here's the minimum code to connect and receive messages from the extension:

```js
// backend/src/websocket/wsServer.js

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  console.log('[WS] Extension connected');

  ws.on('message', (raw) => {
    const message = JSON.parse(raw);
    console.log('[WS] Received:', message.type);

    switch (message.type) {

      case 'meeting_start':
        // TODO: create meeting in DB
        // meetingId = message.meetingId
        console.log('Meeting started:', message.meetingId);
        break;

      case 'audio_chunk':
        // TODO: decode base64, send to Whisper
        const audio = Buffer.from(message.audio, 'base64');
        console.log('Audio chunk:', audio.length, 'bytes for meeting', message.meetingId);
        break;

      case 'speaker_update':
        // TODO: store current speaker
        console.log('Speaker:', message.speaker, 'at', message.timestamp);
        break;

      case 'meeting_end':
        // TODO: finalize meeting, run LLM
        console.log('Meeting ended:', message.meetingId);
        break;
    }
  });

  ws.on('close', () => {
    console.log('[WS] Extension disconnected');
  });
});

console.log('[WS] WebSocket server running on ws://localhost:3001');
```

---

## 5. REST API — What the Extension Does NOT Use

The extension only uses WebSocket.

Your REST APIs (`GET /meeting/:id`, `POST /meeting/:id/question`, etc.) are used by the **frontend only**.

---

## 6. Meeting ID

The extension generates the `meetingId`:

```
echo-<unix-timestamp-ms>-<4-hex-chars>
Example: echo-1727123456789-a3f2
```

The backend receives this and should use it as the **primary key** for the meeting. Do not generate a new ID on the backend side — use what the extension sends.

---

## 7. Audio Format

| Property | Value |
|---|---|
| Format | WebM (Opus codec) — best for speech |
| Chunk size | ~5 seconds per chunk |
| Encoding | Base64 string in JSON |
| MIME type | Included in each chunk message |

Whisper accepts WebM/Opus natively. For `faster-whisper`, write the base64 to a `.webm` file and pass the path.

---

## 8. CORS / Security Note

During development, the WebSocket is open to any connection from the extension. For production, validate the `Origin` header.

---

## 9. Testing Without the Extension

You can test your WebSocket server using this simple HTML file (save locally and open in browser):

```html
<!-- test_ws.html -->
<script>
  const ws = new WebSocket('ws://localhost:3001');
  ws.onopen = () => {
    console.log('Connected!');
    ws.send(JSON.stringify({
      type: 'meeting_start',
      meetingId: 'test-meeting-001',
      tabUrl: 'https://meet.google.com/test'
    }));
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'speaker_update',
        meetingId: 'test-meeting-001',
        speaker: 'Rahul',
        timestamp: new Date().toISOString()
      }));
    }, 1000);
  };
  ws.onmessage = (e) => console.log('Backend says:', e.data);
  ws.onerror   = (e) => console.error('Error:', e);
</script>
```

---

## 10. Summary Checklist for Backend (Person 2)

- [ ] Run WebSocket server on port `3001`
- [ ] Handle `meeting_start` → create DB record with `meetingId`
- [ ] Handle `audio_chunk` → decode base64 → Whisper → save transcript
- [ ] Handle `speaker_update` → store current speaker, tag transcripts
- [ ] Handle `meeting_end` → run LLM analysis
- [ ] (Optional) Send `transcript_update` messages back to extension

## Checklist for Frontend (Person 3)

- [ ] Call `GET /meeting/:id` to load meeting data
- [ ] Call `GET /meeting/:id/transcript` for transcript display
- [ ] Call `GET /meeting/:id/summary` for AI notes
- [ ] Call `POST /meeting/:id/question` for "Ask Your Meeting"
- [ ] Poll or use SSE/WebSocket from backend for live updates
- [ ] Display `meetingId` in the UI (user can see which meeting)
