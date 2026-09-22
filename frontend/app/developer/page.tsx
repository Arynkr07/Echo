"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DeveloperAndExtensionPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const endpoints = [
    {
      method: "GET",
      path: "/api/meetings/{id}/transcript",
      desc: "Returns ordered transcript segments with speaker tags and timestamps.",
      res: `[
  { "speaker": "Aryan", "time": "10:34 AM", "text": "Backend API endpoints operational." },
  { "speaker": "Rahul", "time": "10:36 AM", "text": "Presentation slides ready by Oct 8." }
]`,
    },
    {
      method: "GET",
      path: "/api/meetings/{id}/summary",
      desc: "Fetches structured summary, finalized decisions, and extracted task checklists.",
      res: `{
  "summary": "Milestones locked down for Whisper pipeline.",
  "decisions": ["Local execution only", "Launch on Oct 15"],
  "actions": [{ "id": 1, "title": "Deploy API", "owner": "Aryan", "due": "Oct 5", "done": true }]
}`,
    },
    {
      method: "GET",
      path: "/api/metrics",
      desc: "Supplies executive metrics (hours saved, meeting completion rate, sentiment).",
      res: `{
  "totalMeetings": 48,
  "transcribedPercent": 92,
  "totalActions": 134,
  "hoursSaved": 18.4,
  "sentimentPercent": 92
}`,
    },
    {
      method: "PATCH",
      path: "/api/tasks/{id}",
      desc: "Updates task completion state in real-time.",
      res: `{ "success": true, "taskId": 1, "done": true }`,
    },
    {
      method: "WS",
      path: "/ws/live-audio",
      desc: "WebSocket endpoint accepting 16kHz PCM audio buffers from the Chrome extension.",
      res: `Connected: ws://localhost:8000/ws/live-audio`,
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#1b2b23] font-sans antialiased flex flex-col justify-between">
      <nav className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-[#e2eae5] bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1e6144] flex items-center justify-center text-white font-black text-lg shadow-sm">
            E
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#163a2b]">ECHO</span>
            <span className="ml-2 text-[10px] bg-[#e2f1e8] text-[#1e6144] px-2 py-0.5 rounded-full font-semibold border border-[#c4e3d1]">
              Developer Hub
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs font-semibold text-[#466556] hover:text-[#1e6144] transition">
            Executive Dashboard
          </Link>
          <a
            href="https://github.com/Arynkr07/Echo"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1e6144] hover:bg-[#164d36] text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
          >
            GitHub Repo ↗
          </a>
        </div>
      </nav>

      <main className="max-w-5xl w-full mx-auto px-6 py-12 space-y-12">
        <div className="bg-white border border-[#e2eae5] rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#1e6144] bg-[#e8f3ed] px-3 py-1 rounded-full border border-[#cde4d7]">
              Chrome Extension Build
            </span>
            <h2 className="text-2xl font-bold text-[#163a2b] mt-3">ECHO Tab Audio Companion</h2>
            <p className="text-xs text-[#6e8a7d] mt-1 max-w-lg leading-relaxed">
              Packaged Chromium extension for capturing Google Meet tab audio. Unpack and load via <code className="bg-[#f0f4f2] px-1 py-0.5 rounded text-[#163a2b]">chrome://extensions</code> Developer Mode.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href="https://github.com/Arynkr07/Echo/tree/backend"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1e6144] hover:bg-[#164d36] text-white font-bold px-6 py-3 rounded-2xl text-xs transition shadow-sm text-center"
            >
              Download Extension Package (.zip)
            </a>
          </div>
        </div>

        <div>
          <div className="mb-6">
            <span className="text-[10px] uppercase font-bold text-[#1e6144] bg-[#e8f3ed] px-3 py-1 rounded-full border border-[#cde4d7]">
              FastAPI / BFF Contracts
            </span>
            <h2 className="text-2xl font-bold text-[#163a2b] mt-2">Aryan&apos;s Backend Integration Schema</h2>
            <p className="text-xs text-[#6e8a7d] mt-1">
              Base URL: <code className="bg-white px-2 py-0.5 rounded border border-[#e2eae5] font-mono text-[#1e6144]">http://localhost:8000</code>
            </p>
          </div>

          <div className="space-y-4">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="bg-white border border-[#e2eae5] rounded-2xl p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ep.method === "GET"
                          ? "bg-emerald-100 text-[#1e6144]"
                          : ep.method === "PATCH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#163a2b]">{ep.path}</span>
                  </div>

                  <button
                    onClick={() => handleCopy(ep.path, idx)}
                    className="text-[10px] text-[#718b7f] hover:text-[#1e6144] font-medium transition cursor-pointer"
                  >
                    {copiedIndex === idx ? "✓ Copied" : "Copy Path"}
                  </button>
                </div>

                <p className="text-xs text-[#6e8a7d] mb-3">{ep.desc}</p>

                <div className="bg-[#1b2b23] text-[#a9d8c0] rounded-xl p-3 font-mono text-[11px] overflow-x-auto">
                  <pre>{ep.res}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-[11px] text-[#718b7f] border-t border-[#e2eae5]">
        © 2026 ECHO Workspace Intelligence. Connected to Aryan&apos;s Backend Services.
      </footer>
    </div>
  );
}
