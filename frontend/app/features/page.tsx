"use client";

import Link from "next/link";

export default function FeaturesPage() {
  const features = [
    {
      title: "Audio Stream Isolation",
      desc: "Captures tab audio without requiring an intrusive bot to join the Google Meet call.",
      badge: "Chrome Extension",
      icon: "🎙"
    },
    {
      title: "Whisper STT Pipeline",
      desc: "Local, low-latency speech transcription generating millisecond timestamps and speaker tags.",
      badge: "Speech Model",
      icon: "⚡"
    },
    {
      title: "Structured Action Extractor",
      desc: "Automatically extracts commitments, deadlines, and task assignees into prioritized checklists.",
      badge: "LLM Pipeline",
      icon: "📋"
    },
    {
      title: "Executive Workload Metrics",
      desc: "Visualizes meeting distribution, team sentiment, and hours saved by automated notes.",
      badge: "Analytics",
      icon: "📊"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#1b2b23] font-sans antialiased flex flex-col justify-between">
      <nav className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-[#e2eae5] bg-white">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1e6144] flex items-center justify-center text-white font-black text-lg shadow-sm">
            E
          </div>
          <span className="text-xl font-bold tracking-tight text-[#163a2b]">ECHO</span>
        </Link>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Arynkr07/Echo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#466556] hover:text-[#1e6144] transition flex items-center gap-1.5"
          >
            <span>GitHub</span>
            <span className="text-[10px]">↗</span>
          </a>
          <Link
            href="/login"
            className="bg-[#1e6144] hover:bg-[#164d36] text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e6144] bg-[#e2f1e8] px-3.5 py-1.5 rounded-full border border-[#c4e3d1]">
            System Architecture
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#163a2b] mt-4">
            How ECHO Turns Conversations into Action
          </h1>
          <p className="text-sm text-[#6e8a7d] mt-2 max-w-xl mx-auto">
            A privacy-first pipeline that isolates tab audio, performs low-latency local transcription, and produces real-time summaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((item, idx) => (
            <div key={idx} className="bg-white border border-[#e2eae5] p-6 rounded-3xl shadow-sm hover:border-[#1e6144] transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] uppercase font-bold text-[#1e6144] bg-[#e8f3ed] px-2.5 py-1 rounded-full border border-[#cde4d7]">
                  {item.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#163a2b] mb-2">{item.title}</h3>
              <p className="text-xs text-[#6e8a7d] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-center gap-4">
          <Link
            href="/login"
            className="bg-[#1e6144] hover:bg-[#164d36] text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-md shadow-[#1e6144]/15"
          >
            Launch Companion Portal →
          </Link>
          <a
            href="https://github.com/Arynkr07/Echo"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-[#dce6e1] text-[#163a2b] font-semibold px-8 py-3.5 rounded-2xl text-sm hover:border-[#1e6144] transition shadow-xs"
          >
            View Codebase on GitHub
          </a>
        </div>
      </main>

      <footer className="py-6 text-center text-[11px] text-[#718b7f] border-t border-[#e2eae5]">
        © 2026 ECHO Workspace Intelligence. Powered by Whisper STT & Local LLMs.
      </footer>
    </div>
  );
}
