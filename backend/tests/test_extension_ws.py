"""
test_extension_ws.py
─────────────────────
Simulates exactly what Aryan's Chrome Extension sends over WebSocket.
Tests the full extension protocol without needing a real browser.

Run:
  1. Start extension_ws.py:   python extension_ws.py
  2. Run this test:           python test_extension_ws.py
"""

import asyncio
import base64
import json
import time
from pathlib import Path

import websockets

BACKEND_WS_URL = "ws://localhost:3001"
MEETING_ID     = f"echo-{int(time.time() * 1000)}-a3f2"
WAV_FILE       = Path(__file__).parent.parent / "processing" / "meeting.wav"


async def test():
    print(f"\n{'='*60}")
    print("  ECHO EXTENSION PROTOCOL TEST")
    print(f"{'='*60}")
    print(f"  Meeting ID: {MEETING_ID}")
    print(f"  Audio file: {WAV_FILE.name} ({WAV_FILE.stat().st_size // 1024} KB)")

    async with websockets.connect(BACKEND_WS_URL) as ws:
        print("\n[1] Connected to backend on port 3001")

        async def recv_all():
            """Print any messages from the backend."""
            try:
                while True:
                    msg = await asyncio.wait_for(ws.recv(), timeout=0.2)
                    data = json.loads(msg)
                    t = data.get("type", "?")
                    if t == "transcript_update":
                        print(f"  [Backend] transcript: [{data.get('timestamp')}] "
                              f"{data.get('speaker')}: {data.get('text')}")
                    elif t == "ai_update":
                        print(f"  [Backend] AI summary: {data.get('summary', '')[:100]}")
                        print(f"  [Backend] Decisions: {data.get('decisions', [])}")
                        print(f"  [Backend] Actions:   {data.get('action_items', [])}")
                    else:
                        print(f"  [Backend] {t}: {data.get('message', '')}")
            except asyncio.TimeoutError:
                pass

        # ── Step 1: meeting_start ─────────────────────────────────────────────
        print("\n[2] Sending meeting_start...")
        await ws.send(json.dumps({
            "type":      "meeting_start",
            "meetingId": MEETING_ID,
            "tabUrl":    "https://meet.google.com/abc-defg-hij"
        }))
        await asyncio.sleep(0.5)
        await recv_all()

        # ── Step 2: speaker_update ────────────────────────────────────────────
        print("\n[3] Sending speaker_update (Rahul)...")
        await ws.send(json.dumps({
            "type":      "speaker_update",
            "meetingId": MEETING_ID,
            "speaker":   "Rahul",
            "timestamp": "2024-09-21T16:45:19.000Z"
        }))
        await asyncio.sleep(0.3)
        await recv_all()

        # ── Step 3: audio_chunk (from real WAV file, base64 encoded) ─────────
        print("\n[4] Sending audio_chunk (base64 WAV)...")

        audio_bytes = WAV_FILE.read_bytes()
        # Send in 2 chunks like the extension does every 5 seconds
        half = len(audio_bytes) // 2

        for i, chunk_bytes in enumerate([audio_bytes[:half], audio_bytes[half:]], 1):
            b64 = base64.b64encode(chunk_bytes).decode("utf-8")
            await ws.send(json.dumps({
                "type":      "audio_chunk",
                "meetingId": MEETING_ID,
                "timestamp": "2024-09-21T16:45:23.000Z",
                "audio":     b64,
                "mimeType":  "audio/webm;codecs=opus"
            }))
            print(f"  Chunk {i}/2 sent ({len(chunk_bytes) // 1024} KB as base64)")
            await asyncio.sleep(0.3)
            await recv_all()

        # ── Step 4: speaker changes ───────────────────────────────────────────
        print("\n[5] Sending speaker_update (Aryan)...")
        await ws.send(json.dumps({
            "type":      "speaker_update",
            "meetingId": MEETING_ID,
            "speaker":   "Aryan",
            "timestamp": "2024-09-21T16:45:40.000Z"
        }))
        await asyncio.sleep(0.3)
        await recv_all()

        # ── Step 5: meeting_end ───────────────────────────────────────────────
        print("\n[6] Sending meeting_end...")
        await ws.send(json.dumps({
            "type":      "meeting_end",
            "meetingId": MEETING_ID
        }))

        # Wait for Whisper + AI to finish (up to 60s)
        print("\n[7] Waiting for Whisper + Gemini (up to 60s)...")
        deadline = asyncio.get_event_loop().time() + 60
        while asyncio.get_event_loop().time() < deadline:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
                data = json.loads(msg)
                t = data.get("type", "?")
                if t == "transcript_update":
                    print(f"  [Backend] transcript: [{data.get('timestamp')}] "
                          f"{data.get('speaker')}: {data.get('text')[:80]}")
                elif t == "ai_update":
                    print(f"\n  [Backend] AI Summary:   {data.get('summary', '')[:120]}")
                    print(f"  [Backend] Decisions:    {data.get('decisions', [])}")
                    print(f"  [Backend] Action Items: {data.get('action_items', [])}")
                    break
                elif t == "status":
                    print(f"  [Backend] status: {data.get('message')}")
                    if "Done!" in data.get("message", ""):
                        break
            except asyncio.TimeoutError:
                continue
            except websockets.exceptions.ConnectionClosed:
                break

    print(f"\n{'='*60}")
    print(f"  Extension protocol test complete!")
    print(f"  Check REST API: GET http://localhost:8002/meeting/{MEETING_ID}/transcript")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(test())
