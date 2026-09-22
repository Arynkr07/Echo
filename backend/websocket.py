"""
websocket.py
────────────
WebSocket endpoint: /ws/meeting/{meeting_id}

Flow:
  1. Extension connects
  2. Text frames → metadata (speaker, timestamps, JSON)
  3. Binary frames → audio bytes, accumulated in memory then flushed to disk
  4. On disconnect → auto-transcribe the collected audio
"""

import json
import asyncio
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import TEMP_AUDIO_DIR
import services.meeting_service as meeting_service
from services.transcription import TranscriptionService

router = APIRouter()

# ─── Shared Whisper instance (loaded once) ────────────────────────────────────
_transcription_service: TranscriptionService | None = None

def get_transcription_service() -> TranscriptionService:
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = TranscriptionService()
    return _transcription_service


# ─────────────────────────────────────────────────────────────────────────────

@router.websocket("/ws/meeting/{meeting_id}")
async def meeting_websocket(websocket: WebSocket, meeting_id: str):

    await websocket.accept()
    print(f"[WebSocket] Connected: {meeting_id}")

    # Track the current speaker from metadata messages
    current_speaker = "unknown"

    # Accumulate audio bytes in memory, write to disk on disconnect
    audio_chunks: list[bytes] = []
    audio_file_path = TEMP_AUDIO_DIR / f"{meeting_id}.webm"

    try:
        while True:
            data = await websocket.receive()

            # ─── TEXT / METADATA ──────────────────────────────────────────
            if data.get("text") is not None:
                text = data["text"]
                print(f"[WebSocket] Text from {meeting_id}: {text[:120]}")

                try:
                    message = json.loads(text)
                    # Extension can send speaker updates like:
                    # { "type": "speaker", "speaker": "Aryan" }
                    if message.get("type") == "speaker":
                        current_speaker = message.get("speaker", "unknown")
                        print(f"[WebSocket] Speaker -> {current_speaker}")

                except json.JSONDecodeError:
                    pass

                await websocket.send_json({
                    "type":       "ack",
                    "message":    "Message received",
                    "meeting_id": meeting_id
                })

            # ─── BINARY / AUDIO ───────────────────────────────────────────
            elif data.get("bytes") is not None:
                chunk = data["bytes"]
                audio_chunks.append(chunk)

                print(f"[WebSocket] Audio chunk: {len(chunk)} bytes -> {meeting_id}")

                await websocket.send_json({
                    "type":           "audio_ack",
                    "meeting_id":     meeting_id,
                    "bytes_received": len(chunk)
                })

    except WebSocketDisconnect:
        print(f"[WebSocket] Disconnected: {meeting_id}")

    except Exception as e:
        print(f"[WebSocket] Error ({meeting_id}): {type(e).__name__}: {e}")

    finally:
        # ─── FLUSH AUDIO TO DISK ──────────────────────────────────────────
        if audio_chunks:
            total_bytes = sum(len(c) for c in audio_chunks)
            print(f"[WebSocket] Flushing {total_bytes} bytes to {audio_file_path.name}")
            with open(audio_file_path, "wb") as f:
                for chunk in audio_chunks:
                    f.write(chunk)

        # ─── AUTO-TRANSCRIBE on disconnect ────────────────────────────────
        await _transcribe_after_disconnect(meeting_id, audio_file_path, current_speaker)


async def _transcribe_after_disconnect(
    meeting_id: str,
    audio_path: Path,
    speaker: str
):
    """
    Run transcription in a thread-pool so we don't block the event loop.
    Saves segments to the meeting store.
    """
    if not audio_path.exists() or audio_path.stat().st_size == 0:
        print(f"[WebSocket] No audio data for {meeting_id} - skipping transcription.")
        return

    print(f"[WebSocket] Starting transcription for {meeting_id}...")

    loop = asyncio.get_event_loop()

    try:
        svc = get_transcription_service()

        # Run blocking Whisper in thread pool
        result = await loop.run_in_executor(
            None,
            svc.transcribe_webm,
            str(audio_path)
        )

        # Store in meeting
        meeting_service.add_transcript(meeting_id, result, speaker=speaker)

        print(
            f"[WebSocket] Transcription complete for {meeting_id}: "
            f"{len(result['segments'])} segments, "
            f"language={result['language']} ({result['language_probability']:.0%})"
        )

    except Exception as e:
        print(f"[WebSocket] Transcription failed for {meeting_id}: {type(e).__name__}: {e}")

    finally:
        # Clean up audio file
        if audio_path.exists():
            audio_path.unlink()
            print(f"[WebSocket] Cleaned up audio file: {audio_path.name}")