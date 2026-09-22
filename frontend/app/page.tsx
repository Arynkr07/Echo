"use client";

import React, { useState } from "react";

export default function EchoLandingPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "decisions" | "tasks">("summary");

  const sampleTranscript = [
    { speaker: "Rahul", time: "10:32", text: "We should launch this feature next month." },
    { speaker: "Aryan", time: "10:35", text: "What about October 15?" },
    { speaker: "Rahul", time: "10:36", text: "That works. Let's lock in the backend API for Oct 5." },
  ];

  const sampleTasks = [
    { task: "Complete backend API & Whisper pipeline", owner: "Aryan", deadline: "Oct 5" },
    { task: "Prepare presentation slides", owner: "Rahul", deadline: "Oct 8" },
    { task: "Target launch validation", owner: "Core Team", deadline: "Oct 15" },
  ];

  return (
    <div className="min-h-screen bg-[#072419] text-[#e3f4e9] font-sans selection:bg-[#facc15] selection:text-[#072419]">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#134431]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#facc15] flex items-center justify-center font-black text-[#072419] text-lg shadow-md shadow-[#facc15]/20">
            E
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ECHO</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9fc7b1]">
          <a href="#features" className="hover:text-[#facc15] transition">Features</a>
          <a href="#demo" className="hover:text-[#facc15] transition">Live Demo</a>
        </div>
        <a
          href="https://github.com/Arynkr07/Echo"
          target="_blank"
          rel="noreferrer"
          className="bg-[#124230] hover:bg-[#1a5a42] text-[#facc15] font-semibold text-xs px-4 py-2 rounded-full border border-[#21674c] transition"
        >
          View on GitHub
        </a>
      </nav>

      <header className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d3827] border border-[#1b5e43] text-xs text-[#facc15] font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#facc15] animate-ping" />
          AI-Powered Google Meet Companion
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Turn live meetings into <span className="text-[#facc15]">searchable intelligence</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#9ec7af] max-w-2xl leading-relaxed">
          ECHO captures audio streams, transcribes dialogue with speaker timestamps,
          and distills key decisions and action items instantly.
        </p>

        <div className="mt-12 w-full max-w-2xl rounded-3xl overflow-hidden border border-[#1c573f] bg-[#041a12] shadow-2xl">
          <video
            src="/assets/echo-bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-cover opacity-90"
          />
        </div>
      </header>

      <section id="demo" className="max-w-7xl mx-auto px-6 py-16 border-t border-[#134431]">
        <div className="text-center mb-12">
          <h2 className="text-xs uppercase font-bold tracking-widest text-[#facc15] mb-2">Interface Preview</h2>
          <p className="text-3xl font-extrabold text-white">Live Meeting Companion</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#041a12] p-6 sm:p-8 rounded-3xl border border-[#1b5840] shadow-2xl">
          <div className="md:col-span-7 bg-[#0b3324] border border-[#164b36] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-[#164a35] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#facc15]">Live Transcript</span>
              <span className="text-[10px] bg-[#11402e] text-[#83bfa0] px-2 py-0.5 rounded-full font-mono">10:36 AM</span>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {sampleTranscript.map((t, idx) => (
                <div key={idx} className="border-l-2 border-[#2b7255] pl-3 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-[#facc15]">{t.speaker}</span>
                    <span className="text-[10px] bg-[#072419] text-[#71ab8f] px-1.5 py-0.5 rounded">{t.time}</span>
                  </div>
                  <p className="text-sm text-[#d7eee1]">{t.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 bg-[#0b3324] border border-[#164b36] rounded-2xl p-6 flex flex-col">
            <div className="flex border-b border-[#1b503a] mb-4 gap-2">
              {(["summary", "decisions", "tasks"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-3 text-xs font-semibold uppercase tracking-wider transition ${
                    activeTab === tab
                      ? "text-[#facc15] border-b-2 border-[#facc15]"
                      : "text-[#71ab8f] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1">
              {activeTab === "summary" && (
                <p className="text-sm leading-relaxed text-[#cbe7d7]">
                  The engineering team agreed on the Q4 release targets. The core priority remains completing the Node.js backend WebSocket endpoints and Whisper STT pipeline before final integration.
                </p>
              )}

              {activeTab === "decisions" && (
                <ul className="space-y-2 text-sm text-[#cbe7d7]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#facc15]">•</span>
                    Launch timeline locked for October 15.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#facc15]">•</span>
                    Backend stack settled on Node.js, Express, and WebSocket architecture.
                  </li>
                </ul>
              )}

              {activeTab === "tasks" && (
                <div className="space-y-3">
                  {sampleTasks.map((t, idx) => (
                    <div key={idx} className="bg-[#08281c] p-3 rounded-xl border border-[#174e38]">
                      <p className="text-sm font-medium text-white">{t.task}</p>
                      <div className="flex justify-between text-xs text-[#71ab8f] mt-2">
                        <span>Owner: <strong className="text-[#facc15]">{t.owner}</strong></span>
                        <span>Due: <strong className="text-[#facc15]">{t.deadline}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
