"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function EchoLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = [
    {
      num: "01",
      title: "Launch the Extension",
      desc: "Activate the lightweight ECHO Chrome extension on any Google Meet tab. No intrusive bot joins the call.",
      tag: "Client-Side Capture",
    },
    {
      num: "02",
      title: "Stream Audio Locally",
      desc: "Audio chunks are streamed to your local Whisper STT pipeline for instant sub-second diarization.",
      tag: "Whisper STT",
    },
    {
      num: "03",
      title: "Synthesize Decisions",
      desc: "Local LLM nodes extract assignees, action deadlines, and summaries directly onto your executive dashboard.",
      tag: "Zero-Leak Privacy",
    },
  ];

  const features = [
    {
      icon: "🎙",
      title: "Bot-Free Tab Audio Capture",
      desc: "Extracts crystal-clear system audio directly from the Chrome browser tab using standard WebRTC APIs.",
    },
    {
      icon: "⚡",
      title: "Sub-Second Diarization",
      desc: "Identifies who spoke and attaches millisecond-accurate timestamps without external latency.",
    },
    {
      icon: "📋",
      title: "Automated Action Extraction",
      desc: "Parses spoken commitments into categorized, checkable tasks with assignees and explicit due dates.",
    },
    {
      icon: "🔒",
      title: "100% On-Premises Privacy",
      desc: "Your confidential client and company audio never leaves your local infrastructure.",
    },
  ];

  const faqs = [
    {
      q: "Does an AI bot join the Google Meet call?",
      a: "No. ECHO runs as a local Chrome Extension that captures tab audio directly from your browser. Call attendees never see an external meeting bot.",
    },
    {
      q: "Can I connect my own backend pipeline?",
      a: "Yes. ECHO provides standard REST and WebSocket endpoints for streaming PCM audio into Faster-Whisper and Ollama/vLLM endpoints.",
    },
    {
      q: "What browsers are supported?",
      a: "Google Chrome, Brave, Microsoft Edge, and any Chromium browser supporting the Manifest V3 tabCapture API.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#1b2b23] font-sans antialiased flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-[#e2eae5] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1e6144] flex items-center justify-center text-white font-black text-lg shadow-sm">
            E
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#163a2b]">ECHO</span>
            <span className="ml-2 text-[10px] bg-[#e2f1e8] text-[#1e6144] px-2 py-0.5 rounded-full font-semibold border border-[#c4e3d1]">
              Companion
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/developer" className="text-xs font-semibold text-[#466556] hover:text-[#1e6144] transition">
            Endpoints & Extension ⚡
          </Link>
          <a
            href="https://github.com/Arynkr07/Echo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#466556] hover:text-[#1e6144] transition flex items-center gap-1"
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

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e6144] bg-[#e2f1e8] px-3.5 py-1.5 rounded-full border border-[#c4e3d1]">
          Privacy-First AI Meeting Companion
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#163a2b] tracking-tight mt-6 leading-tight">
          Turn live meetings into <br />
          <span className="text-[#1e6144]">structured execution</span>.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-[#6e8a7d] max-w-2xl mx-auto leading-relaxed">
          ECHO runs silently in your browser to transcribe discussions, identify speakers, and extract actionable checklists—without meeting bots.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="bg-[#1e6144] hover:bg-[#164d36] text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition shadow-md shadow-[#1e6144]/15"
          >
            Launch Companion →
          </Link>
          <Link
            href="/developer"
            className="bg-white border border-[#dce6e1] text-[#163a2b] font-semibold px-8 py-3.5 rounded-2xl text-sm hover:border-[#1e6144] transition shadow-xs flex items-center gap-2"
          >
            <span>🧩 Download Extension</span>
          </Link>
          <a
            href="https://github.com/Arynkr07/Echo"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-[#dce6e1] text-[#466556] font-semibold px-6 py-3.5 rounded-2xl text-sm hover:border-[#1e6144] transition shadow-xs"
          >
            ★ Star on GitHub
          </a>
        </div>

        {/* Video Preview */}
        <div className="mt-12 max-w-3xl mx-auto rounded-3xl overflow-hidden border border-[#dce6e1] bg-white shadow-xl">
          <video
            src="/assets/echo-bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-cover opacity-95"
          />
        </div>
      </header>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 w-full border-t border-[#e2eae5]">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e6144] bg-[#e2f1e8] px-3 py-1 rounded-full border border-[#c4e3d1]">
            Workflow
          </span>
          <h2 className="text-3xl font-extrabold text-[#163a2b] mt-3">How It Works in 3 Steps</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <div key={idx} className="bg-white border border-[#e2eae5] p-6 rounded-3xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-[#1e6144]/25">{s.num}</span>
                <h3 className="text-lg font-bold text-[#163a2b] mt-2 mb-2">{s.title}</h3>
                <p className="text-xs text-[#6e8a7d] leading-relaxed">{s.desc}</p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#edf2ef]">
                <span className="text-[10px] font-semibold text-[#1e6144] bg-[#e8f3ed] px-2.5 py-1 rounded-full border border-[#cde4d7]">
                  {s.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Extension Feature Callout */}
      <section className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="bg-gradient-to-br from-[#1e6144] to-[#12422e] rounded-3xl p-8 sm:p-12 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase text-[#a9d8c0]">Chrome Extension (Manifest V3)</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2 leading-snug">
              Silent, Tab-Isolated Audio Recording
            </h2>
            <p className="text-xs sm:text-sm text-[#c8e6d6] mt-3 leading-relaxed">
              No need to convince call organizers to admit a bot. Simply click ECHO in your browser toolbar to begin streaming 16kHz PCM audio directly into the transcription engine.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/developer"
              className="bg-white text-[#12422e] font-bold px-6 py-3 rounded-2xl text-xs hover:bg-[#e8f3ed] transition shadow-sm text-center"
            >
              Get Extension Package →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-[#163a2b]">Engineered for Engineering Teams</h2>
          <p className="text-xs text-[#6e8a7d] mt-2">Zero hallucinations. Full speaker attribution.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white border border-[#e2eae5] p-5 rounded-3xl shadow-sm hover:border-[#1e6144] transition">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-sm font-bold text-[#163a2b] mt-4 mb-2">{f.title}</h3>
              <p className="text-xs text-[#6e8a7d] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#163a2b]">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="bg-white border border-[#e2eae5] rounded-2xl p-4 cursor-pointer hover:border-[#1e6144] transition"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#163a2b]">{faq.q}</span>
                <span className="text-xs text-[#1e6144] font-bold">{openFaq === index ? "−" : "+"}</span>
              </div>
              {openFaq === index && (
                <p className="text-xs text-[#6e8a7d] mt-3 leading-relaxed pt-2 border-t border-[#f0f4f2]">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-[11px] text-[#718b7f] border-t border-[#e2eae5] flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-6 w-full gap-2">
        <span>© 2026 ECHO Workspace Intelligence. Powered by Whisper STT & Firebase Auth.</span>
        <a
          href="https://github.com/Arynkr07/Echo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1e6144] hover:underline font-semibold"
        >
          View Source Repository on GitHub ↗
        </a>
      </footer>
    </div>
  );
}
