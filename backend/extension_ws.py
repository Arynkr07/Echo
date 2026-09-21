"""
extension_ws.py
────────────────
WebSocket server on port 3001 that speaks Aryan's extension protocol.

Aryan's extension connects here and sends:
  { "type": "meeting_start",  "meetingId": "echo-xxx", "tabUrl": "..." }
  { "type": "audio_chunk",    "meetingId": "...", "audio": "<base64>", "mimeType": "audio/webm" }
  { "type": "speaker_update", "meetingId": "...", "speaker": "Aryan", "timestamp": "..." }
  { "type": "meeting_end",    "meetingId": "..." }

Backend sends back:
  { "type": "status",            "message": "Transcribing..." }
  { "type": "transcript_update", "speaker": "...", "text": "...", "timestamp": "00:34:21" }

Run this alongside main.py:
  python extension_ws.py
"""

import asyncio
import base64
import json
import tempfile
import os
from pathlib import Path
from datetime import datetime

import websockets

import services.meeting_service as meeting_service
from services.transcription import TranscriptionService
from services.llm_service import analyse_meeting

# ── Config ────────────────────────────────────────────────────────────────────
PORT = 3001
TEMP_DIR = Path(__file__).parent / "temp_audio"
TEMP_DIR.mkdir(exist_ok=True)

# ── Shared Whisper instance ───────────────────────────────────────────────────
_transcription_service = None

def get_whisper():
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = TranscriptionService()
    return _transcription_service


# ── Per-connection state ──────────────────────────────────────────────────────
class Session:
    def __init__(self, ws):
        self.ws             = ws
        self.meeting_id     = None
        self.current_speaker = "unknown"
        self.audio_chunks   = []      # list of bytes — accumulated webm chunks

    async def send(self, data: dict):
        try:
            await self.ws.send(json.dumps(data))
        except Exception:
            pass


# ── Main handler ──────────────────────────────────────────────────────────────
async def handle_connection(ws):
    session = Session(ws)
    print(f"[Ext-WS] Extension connected from {ws.remote_address}")

    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                print("[Ext-WS] Non-JSON message, ignoring.")
                continue

            msg_type = msg.get("type")
            print(f"[Ext-WS] Received: {msg_type}")

            # ── meeting_start ─────────────────────────────────────────────────
            if msg_type == "meeting_start":
                meeting_id = msg.get("meetingId")
                tab_url    = msg.get("tabUrl", "")

                session.meeting_id = meeting_id

                # Use the extension's meeting_id directly (don't generate a new one)
                meeting_service._meetings[meeting_id] = {
                    "id":           meeting_id,
                    "status":       "active",
                    "started_at":   datetime.now().isoformat(),
                    "ended_at":     None,
                    "tab_url":      tab_url,
                    "transcript":   [],
                    "summary":      None,
                    "decisions":    [],
                    "action_items": []
                }

                print(f"[Ext-WS] Meeting started: {meeting_id} | {tab_url}")

                await session.send({
                    "type":    "status",
                    "message": f"Echo connected. Meeting ID: {meeting_id}"
                })

            # ── speaker_update ────────────────────────────────────────────────
            elif msg_type == "speaker_update":
                speaker   = msg.get("speaker", "unknown")
                timestamp = msg.get("timestamp", "")
                session.current_speaker = speaker
                print(f"[Ext-WS] Speaker -> {speaker} @ {timestamp}")

            # ── audio_chunk ───────────────────────────────────────────────────
            elif msg_type == "audio_chunk":
                b64_audio = msg.get("audio", "")
                mime_type = msg.get("mimeType", "audio/webm")

                if not b64_audio:
                    continue

                # Decode base64 → bytes and accumulate
                try:
                    audio_bytes = base64.b64decode(b64_audio)
                    session.audio_chunks.append(audio_bytes)
                    total_kb = sum(len(c) for c in session.audio_chunks) / 1024
                    print(f"[Ext-WS] Audio chunk: {len(audio_bytes)} bytes "
                          f"(total: {total_kb:.1f} KB) for {session.meeting_id}")
                except Exception as e:
                    print(f"[Ext-WS] Base64 decode error: {e}")
                    continue

                await session.send({
                    "type":    "status",
                    "message": f"Received {total_kb:.0f}KB audio..."
                })

            # ── meeting_end ───────────────────────────────────────────────────
            elif msg_type == "meeting_end":
                meeting_id = msg.get("meetingId") or session.meeting_id
                print(f"[Ext-WS] Meeting ended: {meeting_id}")

                # End the meeting in store
                meeting_service.end_meeting(meeting_id)

                await session.send({"type": "status", "message": "Processing audio..."})

                # Transcribe all accumulated chunks
                await _transcribe_and_analyse(session)

    except websockets.exceptions.ConnectionClosed:
        print(f"[Ext-WS] Extension disconnected")
    except Exception as e:
        print(f"[Ext-WS] Error: {type(e).__name__}: {e}")
    finally:
        # If disconnected mid-recording without meeting_end, still transcribe
        if session.audio_chunks and session.meeting_id:
            print(f"[Ext-WS] Connection dropped mid-session — transcribing remaining audio...")
            await _transcribe_and_analyse(session)


# ── Transcription + LLM ───────────────────────────────────────────────────────
async def _transcribe_and_analyse(session: Session):
    if not session.audio_chunks or not session.meeting_id:
        return

    meeting_id = session.meeting_id
    total_bytes = sum(len(c) for c in session.audio_chunks)
    print(f"[Ext-WS] Transcribing {total_bytes / 1024:.1f} KB for {meeting_id}...")

    # Write accumulated webm chunks to a temp file
    webm_path = TEMP_DIR / f"{meeting_id}.webm"
    with open(webm_path, "wb") as f:
        for chunk in session.audio_chunks:
            f.write(chunk)

    await session.send({"type": "status", "message": "Transcribing with Whisper..."})

    loop = asyncio.get_event_loop()
    try:
        whisper = get_whisper()
        result = await loop.run_in_executor(
            None,
            whisper.transcribe_webm,
            str(webm_path)
        )

        meeting_service.add_transcript(meeting_id, result, speaker=session.current_speaker)

        segments = result.get("segments", [])
        language = result.get("language", "?")
        prob     = result.get("language_probability", 0)

        print(f"[Ext-WS] Transcription done: {len(segments)} segments, "
              f"lang={language} ({prob:.0%})")

        # Send each transcript segment back to the extension overlay
        for seg in segments:
            mins = int(seg["start"] // 60)
            secs = int(seg["start"] % 60)
            await session.send({
                "type":      "transcript_update",
                "meetingId": meeting_id,
                "speaker":   session.current_speaker,
                "text":      seg["text"],
                "timestamp": f"{mins:02d}:{secs:02d}",
                "language":  seg.get("language", language)
            })

        await session.send({"type": "status", "message": "Running AI analysis..."})

        # Run Gemini analysis in background
        transcript = meeting_service.get_transcript(meeting_id)
        if transcript:
            ai_result = await loop.run_in_executor(
                None,
                analyse_meeting,
                transcript
            )
            meeting_service.save_ai_results(
                meeting_id,
                ai_result["summary"],
                ai_result["decisions"],
                ai_result["action_items"]
            )

            await session.send({
                "type":         "ai_update",
                "meetingId":    meeting_id,
                "summary":      ai_result["summary"],
                "decisions":    ai_result["decisions"],
                "action_items": ai_result["action_items"]
            })

            print(f"[Ext-WS] AI analysis done for {meeting_id}")

        await session.send({
            "type":    "status",
            "message": f"Done! {len(segments)} segments transcribed."
        })

    except Exception as e:
        print(f"[Ext-WS] Transcription/AI error: {type(e).__name__}: {e}")
        await session.send({"type": "status", "message": f"Error: {e}"})

    finally:
        if webm_path.exists():
            webm_path.unlink()
        session.audio_chunks = []


# ── Entry point ───────────────────────────────────────────────────────────────
async def main():
    print(f"[Ext-WS] Starting extension WebSocket server on ws://localhost:{PORT}")
    print(f"[Ext-WS] Aryan's extension connects here.")

    async with websockets.serve(handle_connection, "localhost", PORT):
        await asyncio.Future()   # run forever


if __name__ == "__main__":
    asyncio.run(main())
