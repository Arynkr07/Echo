"use client";

import React from "react";
import Link from "next/link";

export default function ExtensionInstallPage() {
  const steps = [
    {
      num: "01",
      icon: "📦",
      title: "Download the Extension Package",
      desc: (
        <>
          Download the <strong>Echo extension folder</strong> from the release
          package provided. It will be a folder named{" "}
          <code className="bg-[#f0f4f2] px-1 py-0.5 rounded text-[#163a2b] font-mono">
            extension/
          </code>{" "}
          containing{" "}
          <code className="bg-[#f0f4f2] px-1 py-0.5 rounded text-[#163a2b] font-mono">
            manifest.json
          </code>
          , background scripts, popup, offscreen and content scripts.
        </>
      ),
    },
    {
      num: "02",
      icon: "🔧",
      title: "Open Chrome Extensions",
      desc: (
        <>
          Open your Chromium browser (Chrome, Edge, or Brave) and navigate to{" "}
          <code className="bg-[#f0f4f2] px-1 py-0.5 rounded text-[#163a2b] font-mono">
            chrome://extensions
          </code>{" "}
          in the address bar. Toggle on{" "}
          <strong>&quot;Developer Mode&quot;</strong> using the switch in the
          top-right corner of the page.
        </>
      ),
    },
    {
      num: "03",
      icon: "📂",
      title: "Load the Unpacked Extension",
      desc: (
        <>
          Click{" "}
          <strong>&quot;Load unpacked&quot;</strong> and select the{" "}
          <code className="bg-[#f0f4f2] px-1 py-0.5 rounded text-[#163a2b] font-mono">
            extension/
          </code>{" "}
          folder you downloaded. The Echo icon will appear in your Chrome
          toolbar immediately.
        </>
      ),
    },
    {
      num: "04",
      icon: "⚙️",
      title: "Start the Local Backend",
      desc: (
        <>
          Before recording, ensure both backend servers are running locally.
          Open two terminals in the{" "}
          <code className="bg-[#f0f4f2] px-1 py-0.5 rounded text-[#163a2b] font-mono">
            backend/
          </code>{" "}
          folder and run the commands shown below.
        </>
      ),
    },
    {
      num: "05",
      icon: "🎙",
      title: "Record Your Meeting",
      desc: (
        <>
          Join any <strong>Google Meet</strong> call (
          <code className="bg-[#f0f4f2] px-1 py-0.5 rounded text-[#163a2b] font-mono">
            meet.google.com
          </code>
          ), then click the Echo icon in your toolbar and press{" "}
          <strong>&quot;Start Recording&quot;</strong>. A floating status pill
          will appear on the page confirming live transcription has begun.
        </>
      ),
    },
  ];

  const backendCommands = [
    {
      label: "Terminal 1 — WebSocket Audio Ingestion",
      code: `cd backend\npython -m venv venv\nvenv\\Scripts\\activate\npip install -r requirements.txt\n# Copy .env.example to .env and fill in your API keys\nvenv\\Scripts\\python.exe extension_ws.py`,
    },
    {
      label: "Terminal 2 — FastAPI REST Backend",
      code: `cd backend\nvenv\\Scripts\\uvicorn.exe main:app --port 8000 --reload`,
    },
  ];

  const envVars = [
    { key: "GEMINI_API_KEY", hint: "Get at aistudio.google.com" },
    { key: "GROQ_API_KEY", hint: "Get at console.groq.com" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#1b2b23] font-sans antialiased flex flex-col justify-between">
      {/* Navbar */}
      <nav className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-[#e2eae5] bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1e6144] flex items-center justify-center text-white font-black text-lg shadow-sm">
            E
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#163a2b]">ECHO</span>
            <span className="ml-2 text-[10px] bg-[#e2f1e8] text-[#1e6144] px-2 py-0.5 rounded-full font-semibold border border-[#c4e3d1]">
              Extension Setup
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard"
          className="text-xs font-semibold text-[#466556] hover:text-[#1e6144] transition"
        >
          ← Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-4xl w-full mx-auto px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1e6144] to-[#12422e] rounded-3xl p-8 text-white shadow-md">
          <span className="text-xs font-bold uppercase text-[#a9d8c0]">
            Chrome Extension · Manifest V3
          </span>
          <h1 className="text-3xl font-bold mt-2 leading-snug">
            Install ECHO Tab Audio Companion
          </h1>
          <p className="text-sm text-[#c8e6d6] mt-3 leading-relaxed max-w-2xl">
            ECHO is a locally-loaded Chrome extension. No Chrome Web Store listing — you load it
            directly from the project folder. Follow the five steps below to get recording in under
            two minutes.
          </p>
        </div>

        {/* Step-by-step */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#163a2b]">Setup Guide</h2>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#e2eae5] rounded-3xl p-6 shadow-sm flex gap-5 items-start"
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-2xl">{step.icon}</span>
                <span className="text-[11px] font-black text-[#1e6144]/30">{step.num}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#163a2b] mb-1">{step.title}</h3>
                <p className="text-xs text-[#6e8a7d] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Backend Commands */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#163a2b]">Backend Commands</h2>
          {backendCommands.map((cmd, idx) => (
            <div key={idx} className="bg-white border border-[#e2eae5] rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-[#466556] mb-3">{cmd.label}</p>
              <div className="bg-[#1b2b23] text-[#a9d8c0] rounded-xl p-4 font-mono text-[12px] overflow-x-auto">
                <pre className="whitespace-pre-wrap">{cmd.code}</pre>
              </div>
            </div>
          ))}
        </div>

        {/* Environment Variables */}
        <div className="bg-white border border-[#e2eae5] rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#163a2b] mb-4">
            Required API Keys · <code className="font-mono text-xs text-[#1e6144]">backend/.env</code>
          </h2>
          <div className="space-y-3">
            {envVars.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-3 bg-[#f4f7f5] rounded-xl px-4 py-3">
                <code className="font-mono text-xs font-bold text-[#163a2b]">{v.key}=your_key_here</code>
                <span className="text-[10px] text-[#718b7f]">{v.hint}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#9ab5a8] mt-4">
            Copy <code className="font-mono">.env.example</code> to{" "}
            <code className="font-mono">.env</code> and fill in both keys before starting the servers.
          </p>
        </div>

        {/* What the extension does */}
        <div className="bg-white border border-[#e2eae5] rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#163a2b] mb-4">What Happens When You Record</h2>
          <ol className="space-y-2 text-xs text-[#6e8a7d] leading-relaxed list-none">
            {[
              "The extension captures tab audio via Chrome's tabCapture API into an offscreen document — no audio bot joins your call.",
              "Audio is chunked every 5 seconds as base64-encoded WebM/Opus and streamed via WebSocket to your local backend (port 3001).",
              "The backend runs Groq Whisper Large-v3 STT, returning speaker-attributed transcript segments in real-time back to the floating overlay on your Meet tab.",
              "When you stop recording, Gemini generates a structured summary, key decisions, and action items — all visible on this dashboard.",
            ].map((line, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-[#1e6144] font-bold shrink-0">{i + 1}.</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>

      <footer className="py-6 text-center text-[11px] text-[#718b7f] border-t border-[#e2eae5]">
        © 2026 ECHO Workspace Intelligence · Privacy-first, locally executed meeting AI.
      </footer>
    </div>
  );
}
