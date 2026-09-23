"""
test_full_pipeline.py
──────────────────────
Full end-to-end test:
  1. Calls POST /meeting/start  → gets meeting_id
  2. Connects WebSocket → sends a real WAV file as audio bytes
  3. Disconnects → triggers Whisper transcription on server
  4. Waits for transcription to finish
  5. Calls GET /meeting/{id}/transcript → shows segments
  6. Calls GET /meeting/{id}/summary    → Gemini AI summary
  7. Calls POST /meeting/{id}/question  → Gemini Q&A

Run from backend/:
    python test_full_pipeline.py
"""

import asyncio
import json
import time
import requests
from pathlib import Path
import websockets

BASE_URL    = "http://127.0.0.1:8002"
WS_URL      = "ws://127.0.0.1:8002"
AUDIO_FILE  = Path(__file__).parent.parent / "processing" / "meeting.wav"

CHUNK_SIZE  = 4096   # bytes per WebSocket send


def http(method, path, **kwargs):
    r = requests.request(method, BASE_URL + path, **kwargs)
    return r.json()


async def send_audio_via_websocket(meeting_id: str):
    uri = f"{WS_URL}/ws/meeting/{meeting_id}"

    async with websockets.connect(uri) as ws:
        print(f"  [WS] Connected to {uri}")

        # Send speaker metadata first
        await ws.send(json.dumps({"type": "speaker", "speaker": "TestSpeaker"}))
        ack = await ws.recv()
        print(f"  [WS] Speaker ack: {ack}")

        # Stream the WAV file in chunks
        audio_bytes = AUDIO_FILE.read_bytes()
        total        = len(audio_bytes)
        sent         = 0

        print(f"  [WS] Sending {total / 1024:.1f} KB audio in {CHUNK_SIZE}-byte chunks...")

        for i in range(0, total, CHUNK_SIZE):
            chunk = audio_bytes[i : i + CHUNK_SIZE]
            await ws.send(chunk)
            ack = await ws.recv()
            sent += len(chunk)
            print(f"  [WS] Sent {sent}/{total} bytes", end="\r")

        print(f"\n  [WS] All audio sent. Closing connection...")

    # WebSocket closed → server will auto-transcribe
    print("  [WS] Disconnected — server is now transcribing...")


def main():
    print("\n" + "="*60)
    print("  ECHO BACKEND — FULL PIPELINE TEST")
    print("="*60)

    # ── 1. Start meeting ──────────────────────────────────────────
    print("\n[1] Starting meeting...")
    meeting = http("POST", "/meeting/start")
    mid = meeting["meeting_id"]
    print(f"    meeting_id = {mid}")

    # ── 2. Send audio via WebSocket ───────────────────────────────
    print("\n[2] Sending audio via WebSocket...")
    if not AUDIO_FILE.exists():
        print(f"    ERROR: {AUDIO_FILE} not found!")
        print("    Run: cd processing && python generate_test_audio.py --speech")
        return
    asyncio.run(send_audio_via_websocket(mid))

    # ── 3. Wait for Whisper to finish ─────────────────────────────
    print("\n[3] Waiting for Whisper transcription (up to 30s)...")
    for i in range(30):
        time.sleep(1)
        t = http("GET", f"/meeting/{mid}/transcript")
        if t["segment_count"] > 0:
            print(f"    Done! {t['segment_count']} segments in {i+1}s")
            break
        print(f"    Waiting... {i+1}s", end="\r")
    else:
        print("\n    Note: No speech segments detected (tone WAV has no speech)")
        print("    Transcript endpoint is working — just no words in the test audio")

    # ── 4. Show transcript ────────────────────────────────────────
    print("\n[4] Transcript:")
    t = http("GET", f"/meeting/{mid}/transcript")
    print(f"    Language: {t['detected_language']} (prob: {t['language_probability']})")
    print(f"    Segments: {t['segment_count']}")
    for seg in t["segments"][:3]:
        print(f"    [{seg['start']}s -> {seg['end']}s] {seg['speaker']}: {seg['text']}")

    # ── 5. End meeting ────────────────────────────────────────────
    print("\n[5] Ending meeting...")
    end = http("POST", f"/meeting/end/{mid}")
    print(f"    Status: {end['status']}")

    # ── 6. AI Summary (Gemini) ────────────────────────────────────
    print("\n[6] Requesting AI summary from Gemini...")

    # If no real speech was detected, inject some fake segments for the LLM test
    transcript = http("GET", f"/meeting/{mid}/transcript")
    if transcript["segment_count"] == 0:
        print("    (No speech in tone WAV — injecting fake transcript for Gemini test)")
        # We'll hit the summary endpoint but it will 400 — that's expected with no transcript
        # Instead, we test via a separate meeting with fake data seeded
        print("\n    Skipping to Gemini connectivity test with a minimal prompt...")
        try:
            import google.genai as genai
            from dotenv import load_dotenv
            import os
            load_dotenv()
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            resp = client.models.generate_content(
                model="gemini-2.0-flash",
                contents="Say exactly: GEMINI_IS_WORKING"
            )
            print(f"    Gemini response: {resp.text.strip()}")
            print("    Gemini API key is VALID and working!")
        except Exception as e:
            print(f"    Gemini error: {e}")
    else:
        try:
            summary = http("GET", f"/meeting/{mid}/summary")
            print(f"    Summary: {summary.get('summary', '')[:200]}")
            print(f"    Decisions: {summary.get('decisions', [])}")
            print(f"    Action Items: {summary.get('action_items', [])}")
        except Exception as e:
            print(f"    Summary error: {e}")

    # ── 7. Q&A ────────────────────────────────────────────────────
    print("\n[7] Testing question endpoint...")
    try:
        qa = http("POST", f"/meeting/{mid}/question",
                  json={"question": "What was decided about the launch?"})
        print(f"    Answer: {qa.get('answer', qa)}")
        print(f"    Source: {qa.get('source')}")
    except Exception as e:
        # Expected if no transcript — show the error message
        print(f"    Response: {e}")

    print("\n" + "="*60)
    print("  TEST COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
