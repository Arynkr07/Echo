"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#072419] text-[#e3f4e9] font-sans">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#134431]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#facc15] flex items-center justify-center font-black text-[#072419] text-lg">
            E
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ECHO</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/features" className="hover:text-[#facc15] transition">Features</Link>
          <Link href="/login" className="bg-[#facc15] text-[#072419] font-bold px-5 py-2 rounded-full hover:bg-[#ebd052] transition">
            Sign In
          </Link>
        </div>
      </nav>

      <header className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight">
          Turn live meetings into <span className="text-[#facc15]">actionable intelligence</span>.
        </h1>
        <p className="mt-6 text-lg text-[#9ec7af] leading-relaxed">
          ECHO runs alongside your Google Meet calls to transcribe, tag speakers, and distill conversations into tasks.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link href="/login" className="bg-[#facc15] text-[#072419] font-bold px-8 py-3.5 rounded-full text-sm hover:bg-[#ebd052] transition shadow-lg shadow-[#facc15]/10">
            Get Started
          </Link>
          <Link href="/features" className="bg-[#0b3324] border border-[#1e5841] text-white font-medium px-8 py-3.5 rounded-full text-sm hover:bg-[#124230] transition">
            Explore Features
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pb-20">
        <div className="rounded-3xl overflow-hidden border border-[#1c573f] bg-[#041a12] shadow-2xl">
          <video src="/assets/echo-bg.mp4" autoPlay loop muted playsInline className="w-full h-auto object-cover opacity-90" />
        </div>
      </div>
    </div>
  );
}
