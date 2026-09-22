"use client";

import Link from "next/link";

export default function FeaturesPage() {
  const featureList = [
    {
      title: "Audio Stream Isolation",
      desc: "Captures individual browser tab output without having an intrusive bot join the meeting room.",
      tag: "Chrome Extension"
    },
    {
      title: "Whisper STT Pipeline",
      desc: "Local, fast transcription engine generating word-level timestamps and speaker identification.",
      tag: "Machine Learning"
    },
    {
      title: "Action Item Classifier",
      desc: "Automatically identifies commitments, due dates, and owners directly into structured data.",
      tag: "LLM Extraction"
    },
    {
      title: "Real-time Dashboard",
      desc: "Side-by-side view pairing streaming conversation transcripts with live decision summaries.",
      tag: "Next.js UI"
    }
  ];

  return (
    <div className="min-h-screen bg-[#072419] text-[#e3f4e9]">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#134431]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#facc15] flex items-center justify-center font-black text-[#072419] text-lg">
            E
          </div>
          <span className="text-xl font-bold text-white">ECHO</span>
        </Link>
        <Link href="/login" className="bg-[#facc15] text-[#072419] font-bold px-5 py-2 rounded-full text-sm hover:bg-[#ebd052] transition">
          Sign In
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-white">Core Architecture & Features</h1>
          <p className="text-sm text-[#8abfa4] mt-2">How ECHO processes unstructured conversations into clear results</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureList.map((item, idx) => (
            <div key={idx} className="bg-[#0b3324] border border-[#164b36] p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#facc15] tracking-wider bg-[#072419] px-2 py-1 rounded border border-[#18533c]">
                  {item.tag}
                </span>
                <h3 className="text-lg font-bold text-white mt-4 mb-2">{item.title}</h3>
                <p className="text-sm text-[#9ec7af] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/login" className="bg-[#facc15] text-[#072419] font-bold px-8 py-3 rounded-full text-sm hover:bg-[#ebd052] transition">
            Launch ECHO Assistant
          </Link>
        </div>
      </main>
    </div>
  );
}
