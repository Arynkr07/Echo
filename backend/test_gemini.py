"""Quick Gemini API verification test."""
import google.genai as genai
from dotenv import load_dotenv
import os, json

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
print("API Key loaded:", key[:15] + "..." if key else "NOT FOUND")

client = genai.Client(api_key=key)

# ── Test 1: Basic ping ────────────────────────────────────────────────────────
print("\n[Test 1] Basic Gemini call...")
r = client.models.generate_content(model="gemini-3.6-flash", contents="Say exactly: GEMINI_WORKS")
print("Response:", r.text.strip())

# ── Test 2: Meeting analysis ──────────────────────────────────────────────────
import time
print("\n[Test 2] Meeting analysis (short prompt)...")
time.sleep(2)

prompt = (
    "Extract summary, decisions and action_items from this meeting as JSON. "
    "Meeting: Rahul proposed Oct 15 launch. Aryan agreed, will send API docs by Oct 5. "
    "Return ONLY JSON, no markdown."
)

r2 = client.models.generate_content(model="gemini-3.6-flash", contents=prompt)
raw = r2.text.strip()
if raw.startswith("```"):
    raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

import json
parsed = json.loads(raw)
print("Summary:      ", parsed.get("summary", "")[:120])
print("Decisions:    ", parsed.get("decisions", []))
print("Action Items: ", parsed.get("action_items", []))

# ── Test 3: Q&A ───────────────────────────────────────────────────────────────
print("\n[Test 3] Q&A...")
time.sleep(2)

qa_prompt = (
    "Meeting transcript: Rahul [00:00] proposed launch on Oct 15, Aryan agreed. "
    "Question: What was the launch date decision? "
    'Return ONLY JSON: {"answer": "...", "source": {"speaker": "...", "timestamp": "00:00"}}'
)
r3 = client.models.generate_content(model="gemini-3.6-flash", contents=qa_prompt)
raw3 = r3.text.strip()
if raw3.startswith("```"):
    raw3 = raw3.split("\n", 1)[1].rsplit("```", 1)[0].strip()
parsed3 = json.loads(raw3)
print("Answer:", parsed3.get("answer"))
print("Source:", parsed3.get("source"))

print("\nAll Gemini tests PASSED!")
