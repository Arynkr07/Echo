"use client";

import React, { useState } from "react";

export default function MeetingAssistantMVP() {
  const [selectedTab, setSelectedTab] = useState<"summary" | "decisions" | "tasks">("summary");

  const transcript = [
    { speaker: "Rahul", time: "00:10", text: "Let's review the launch schedule for October." },
    { speaker: "Aryan", time: "00:34", text: "Backend API and database schemas will be ready by Oct 5." },
    { speaker: "Rahul", time: "01:15", text: "Great. I will handle the presentation slides by Oct 8." }
  ];

  const tasks = [
    { task: "Complete backend API", owner: "Aryan", deadline: "Oct 5" },
    { task: "Prepare presentation slides", owner: "Rahul", deadline: "Oct 8" },
    { task: "Target release verification", owner: "Team", deadline: "Oct 15" }
  ];

  const decisions = [
    "Final target launch date locked for October 15.",
    "Use Node.js, Express, and Whisper pipeline for backend transcription."
  ];

  return (
    <div className="min-h-screen bg-[#072419] text-[#e3f4e9] p-6 lg:p-12 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          meet <span className="text-[#facc15]">ECHO</span>
        </h1>
        <p className="text-[#96c2a8] text-sm mt-1">your intelligent meeting companion</p>
      </header>

      {/* Upload Zone */}
      <section className="max-w-3xl mx-auto mb-8 bg-[#0b3324] border-2 border-dashed border-[#1e5841] rounded-2xl p-6 text-center shadow-lg">
        <p className="text-[#facc15] font-semibold mb-2">Input Source & Meeting Capture</p>
        <p className="text-xs text-[#8abfa4] mb-4">Upload a meeting audio/video file to trigger transcription</p>
        <button className="bg-[#facc15] text-[#072419] font-bold px-6 py-2 rounded-full text-sm hover:bg-[#ebd052] transition">
          Upload File
        </button>
      </section>

      {/* Main Grid View */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Transcript View */}
        <section className="md:col-span-6 bg-[#0b3324] border border-[#164b36] rounded-2xl p-5 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#facc15] mb-4">
            Live Transcript with Timestamps
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {transcript.map((item, index) => (
              <div key={index} className="border-l-2 border-[#2b7255] pl-3 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-xs text-[#facc15]">{item.speaker}</span>
                  <span className="text-[10px] bg-[#072419] text-[#71ab8f] px-1.5 py-0.5 rounded">
                    {item.time}
                  </span>
                </div>
                <p className="text-sm text-[#d7eee1]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Notes & Action Items */}
        <section className="md:col-span-6 bg-[#0b3324] border border-[#164b36] rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex border-b border-[#1b503a] mb-4">
            <button
              onClick={() => setSelectedTab("summary")}
              className={`pb-2 px-3 text-xs font-semibold ${
                selectedTab === "summary" ? "text-[#facc15] border-b-2 border-[#facc15]" : "text-[#71ab8f]"
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setSelectedTab("decisions")}
              className={`pb-2 px-3 text-xs font-semibold ${
                selectedTab === "decisions" ? "text-[#facc15] border-b-2 border-[#facc15]" : "text-[#71ab8f]"
              }`}
            >
              Decisions
            </button>
            <button
              onClick={() => setSelectedTab("tasks")}
              className={`pb-2 px-3 text-xs font-semibold ${
                selectedTab === "tasks" ? "text-[#facc15] border-b-2 border-[#facc15]" : "text-[#71ab8f]"
              }`}
            >
              Action Items
            </button>
          </div>

          <div className="flex-1">
            {selectedTab === "summary" && (
              <p className="text-sm leading-relaxed text-[#cbe7d7]">
                The team finalized key deliverables for the October roadmap. Discussion focused on aligning API service deadlines with presentation materials to ensure full pipeline integration before release.
              </p>
            )}

            {selectedTab === "decisions" && (
              <ul className="space-y-2 text-sm text-[#cbe7d7]">
                {decisions.map((dec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#facc15] mt-1">•</span>
                    <span>{dec}</span>
                  </li>
                ))}
              </ul>
            )}

            {selectedTab === "tasks" && (
              <div className="space-y-3">
                {tasks.map((task, i) => (
                  <div key={i} className="bg-[#08281c] p-3 rounded-lg border border-[#174e38]">
                    <p className="text-sm font-medium text-white">{task.task}</p>
                    <div className="flex justify-between text-xs text-[#71ab8f] mt-2">
                      <span>Owner: <strong className="text-[#facc15]">{task.owner}</strong></span>
                      <span>Due: <strong className="text-[#facc15]">{task.deadline}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
