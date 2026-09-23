"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { api, TranscriptItem, TaskItem, DashboardMetrics, MeetingSummary } from "@/lib/api";

export default function EchoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [transcriptList, setTranscriptList] = useState<TranscriptItem[]>([]);
  const [intelligence, setIntelligence] = useState<MeetingSummary | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const loadMeetingData = useCallback(async (meetingId: string) => {
    const [transcript, summary] = await Promise.all([
      api.getLiveTranscript(meetingId),
      api.getMeetingIntelligence(meetingId),
    ]);
    if (transcript && transcript.length > 0) setTranscriptList(transcript);
    if (summary) {
      setIntelligence(summary);
      if (summary.actions && summary.actions.length > 0) setTasks(summary.actions);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.push("/login");
      else setUser(currentUser);
    });

    // Load metrics and latest meeting on mount
    api.getDashboardMetrics().then(setMetrics);
    api.getLatestMeeting().then((meeting) => {
      if (meeting) {
        setActiveMeetingId(meeting.id);
        loadMeetingData(meeting.id);
      }
    });

    // Poll transcript every 5 seconds (refreshes when a new recording finishes)
    const interval = setInterval(() => {
      api.getLatestMeeting().then((meeting) => {
        if (meeting && meeting.id !== activeMeetingId) {
          setActiveMeetingId(meeting.id);
        }
        if (meeting) loadMeetingData(meeting.id);
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [router, loadMeetingData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const toggleTask = (id: number) => {
    setTasks((prev) => api.toggleTaskStatus(prev, id));
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#1b2b23] flex font-sans antialiased">
      {/* 1. Slim Icon Navigation */}
      <aside className="w-16 bg-white border-r border-[#e2eae5] flex flex-col items-center py-6 justify-between shrink-0">
        <div className="flex flex-col items-center gap-6">
          <Link href="/" className="w-10 h-10 rounded-2xl bg-[#1e6144] flex items-center justify-center text-white font-black text-lg shadow-sm" title="Go to Home">
            E
          </Link>
          <nav className="flex flex-col gap-3">
            <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-[#e8f3ed] text-[#1e6144] font-bold flex items-center justify-center text-sm shadow-xs" title="Dashboard">
              ⊞
            </Link>
            <Link href="/developer" className="w-10 h-10 rounded-xl text-[#7f998c] hover:bg-[#f4f7f5] flex items-center justify-center text-sm transition" title="Developer Endpoints">
              ⚡
            </Link>
            <a
              href="https://github.com/Arynkr07/Echo"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl text-[#7f998c] hover:text-[#1e6144] hover:bg-[#f4f7f5] flex items-center justify-center text-base transition"
              title="GitHub Repository"
            >
              🐙
            </a>
          </nav>
        </div>

        <button onClick={handleSignOut} className="text-[#7f998c] hover:text-[#dc2626] text-xs font-semibold cursor-pointer" title="Sign Out">
          ⏻
        </button>
      </aside>

      {/* 2. Main Executive Workstation */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#163a2b]">
              Good morning, {user?.displayName || user?.email?.split("@")[0] || "Member"} 👋
            </h1>
            <p className="text-xs text-[#6e8a7d] mt-0.5">
              {activeMeetingId
                ? <>Active Meeting: <strong className="text-[#1e6144] font-mono">{activeMeetingId}</strong></>
                : <span className="text-[#9ab5a8]">No meetings recorded yet — start the extension to begin</span>
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/developer"
              className="text-xs font-semibold text-[#1e6144] bg-[#e8f3ed] border border-[#cde4d7] hover:bg-[#dcf0e4] px-4 py-1.5 rounded-full transition"
            >
              API Hub & Extension ⚡
            </Link>
            <a
              href="https://github.com/Arynkr07/Echo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#466556] bg-white border border-[#dce6e1] hover:border-[#1e6144] px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5"
            >
              <span>GitHub</span>
              <span className="text-[10px]">↗</span>
            </a>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-[#466556] bg-white border border-[#dce6e1] hover:border-[#1e6144] px-4 py-1.5 rounded-full transition shadow-xs cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Top Tier: Calendar + 4 Core Metrics Cards + Donut Allocation */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Meeting Calendar Widget */}
          <div className="xl:col-span-4 bg-gradient-to-br from-[#1e6144] to-[#12422e] rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#a9d8c0]">
              <span className="font-semibold text-white">🗓 Meeting Calendar</span>
              <span className="text-[10px] bg-[#297855] px-2 py-0.5 rounded-full">October 2026</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] mt-4 mb-2 text-[#9acbb2] font-semibold">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
              <span className="py-1 text-[#6fa389]">28</span>
              <span className="py-1 text-[#6fa389]">29</span>
              <span className="py-1 text-[#6fa389]">30</span>
              <span className="py-1 bg-[#f472b6] text-white rounded-full font-bold shadow-xs">1</span>
              <span className="py-1">2</span>
              <span className="py-1">3</span>
              <span className="py-1">4</span>
              <span className="py-1 bg-[#facc15] text-[#12422e] rounded-full font-bold">5</span>
              <span className="py-1">6</span>
              <span className="py-1">7</span>
              <span className="py-1 bg-[#fb7185] text-white rounded-full font-bold">8</span>
              <span className="py-1">9</span>
              <span className="py-1">10</span>
              <span className="py-1">11</span>
              <span className="py-1">12</span>
              <span className="py-1">13</span>
              <span className="py-1">14</span>
              <span className="py-1 bg-[#34d399] text-[#12422e] rounded-full font-bold">15</span>
              <span className="py-1">16</span>
              <span className="py-1">17</span>
              <span className="py-1">18</span>
            </div>

            <div className="mt-4 pt-3 border-t border-[#297855] flex justify-between text-[11px] text-[#b6dec9]">
              <span>Next Milestone: <strong>Whisper Ingestion Freeze</strong></span>
              <span className="text-[#facc15] font-semibold">Oct 5</span>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="xl:col-span-5 grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#e2eae5] rounded-3xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#718b7f]">
                <span>This month</span>
                <span>📅</span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#153e2d]">{metrics?.totalMeetings ?? 48}</span>
                  <span className="text-[10px] font-bold text-[#1e6144] bg-[#e7f5ed] px-1.5 py-0.5 rounded">↗ 12%</span>
                </div>
                <p className="text-[10px] text-[#718b7f]">vs last month</p>
              </div>
              <div className="flex items-center gap-1.5 pt-2">
                <span className="w-2.5 h-3 bg-[#fbcfe8] rounded-full"></span>
                <span className="w-2.5 h-6 bg-[#f472b6] rounded-full"></span>
                <span className="w-2.5 h-4 bg-[#f472b6] rounded-full"></span>
                <span className="w-2.5 h-7 bg-[#1e6144] rounded-full"></span>
              </div>
            </div>

            <div className="bg-white border border-[#e2eae5] rounded-3xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#718b7f]">
                <span>Action items</span>
                <span>📋</span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#153e2d]">{metrics?.totalActions ?? 134}</span>
                  <span className="text-[10px] font-bold text-[#1e6144] bg-[#e7f5ed] px-1.5 py-0.5 rounded">89 done</span>
                </div>
                <p className="text-[10px] text-[#718b7f]">45 remaining</p>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-[#718b7f] mb-1">
                  <span>Completion</span>
                  <span>{metrics?.completedPercent ?? 66}%</span>
                </div>
                <div className="w-full bg-[#edf2ef] rounded-full h-1.5">
                  <div className="bg-[#1e6144] h-1.5 rounded-full w-2/3"></div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e2eae5] rounded-3xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#718b7f]">
                <span>Avg. Meeting Length</span>
                <span>⏱</span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#153e2d]">{metrics?.avgLengthMin ?? 38} min</span>
                  <span className="text-[10px] font-bold text-[#1e6144] bg-[#e7f5ed] px-1.5 py-0.5 rounded">↗ 10%</span>
                </div>
                <p className="text-[10px] text-[#718b7f]">shorter than last month</p>
              </div>
              <div className="w-full bg-[#fce7f3] rounded-full h-1.5 flex overflow-hidden">
                <div className="bg-[#f472b6] h-full w-1/3"></div>
                <div className="bg-[#1e6144] h-full w-2/3"></div>
              </div>
            </div>

            <div className="bg-white border border-[#e2eae5] rounded-3xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#718b7f]">
                <span>Hours Saved by AI</span>
                <span>✨</span>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#153e2d]">{metrics?.hoursSaved ?? 18.4}h</span>
                  <span className="text-[10px] font-bold text-[#1e6144] bg-[#e7f5ed] px-1.5 py-0.5 rounded">↗ 29%</span>
                </div>
                <p className="text-[10px] text-[#718b7f]">automated transcription</p>
              </div>
              <div className="flex items-center gap-1.5 pt-2">
                <span className="w-2.5 h-2 bg-[#fbcfe8] rounded-full"></span>
                <span className="w-2.5 h-5 bg-[#f472b6] rounded-full"></span>
                <span className="w-2.5 h-6 bg-[#1e6144] rounded-full"></span>
              </div>
            </div>
          </div>

          {/* Workload Allocation Donut */}
          <div className="xl:col-span-3 bg-white border border-[#e2eae5] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-[#1e3f30]">Workload Allocation</span>

            <div className="flex items-center justify-center my-3">
              <div className="w-28 h-28 rounded-full border-[10px] border-[#1e6144] border-r-[#f472b6] border-b-[#facc15] flex items-center justify-center shadow-xs">
                <div className="text-center">
                  <span className="text-lg font-black text-[#153e2d]">65.4%</span>
                  <p className="text-[9px] text-[#718b7f]">Efficiency</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center text-[#557163]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1e6144]"></span> Design Sync</span>
                <span className="font-semibold text-[#153e2d]">45%</span>
              </div>
              <div className="flex justify-between items-center text-[#557163]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f472b6]"></span> Sprint Review</span>
                <span className="font-semibold text-[#153e2d]">30%</span>
              </div>
              <div className="flex justify-between items-center text-[#557163]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#facc15]"></span> 1:1 Check-in</span>
                <span className="font-semibold text-[#153e2d]">25%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Tier: Live Transcript & AI Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Live Transcript Stream */}
          <div className="lg:col-span-6 bg-white border border-[#e2eae5] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#edf2ef] mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1e6144] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping"></span>
                  Live Meeting Transcript
                </span>
                <span className="text-[10px] bg-[#eef5f1] text-[#466556] px-2 py-0.5 rounded-full font-mono">
                  Real-time
                </span>
              </div>

              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-2">
                {transcriptList.map((item, idx) => (
                  <div key={idx} className="border-l-2 border-[#1e6144] pl-3 py-1 bg-[#f9fbf9] rounded-r-xl">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs text-[#163a2b]">{item.speaker}</span>
                      <span className="text-[10px] text-[#718b7f]">{item.time}</span>
                    </div>
                    <p className="text-xs text-[#385345] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Companion Tabs */}
          <div className="lg:col-span-6 bg-white border border-[#e2eae5] rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="flex border-b border-[#edf2ef] mb-4 gap-2">
              <button
                onClick={() => setActiveTab("summary")}
                className={
                  activeTab === "summary"
                    ? "pb-2.5 px-3 text-xs font-bold transition text-[#1e6144] border-b-2 border-[#1e6144]"
                    : "pb-2.5 px-3 text-xs font-bold transition text-[#718b7f] hover:text-[#163a2b]"
                }
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab("decisions")}
                className={
                  activeTab === "decisions"
                    ? "pb-2.5 px-3 text-xs font-bold transition text-[#1e6144] border-b-2 border-[#1e6144]"
                    : "pb-2.5 px-3 text-xs font-bold transition text-[#718b7f] hover:text-[#163a2b]"
                }
              >
                Decisions
              </button>
              <button
                onClick={() => setActiveTab("actions")}
                className={
                  activeTab === "actions"
                    ? "pb-2.5 px-3 text-xs font-bold transition text-[#1e6144] border-b-2 border-[#1e6144]"
                    : "pb-2.5 px-3 text-xs font-bold transition text-[#718b7f] hover:text-[#163a2b]"
                }
              >
                Extracted Actions
              </button>
            </div>

            <div className="flex-1 text-xs leading-relaxed text-[#385345]">
              {activeTab === "summary" && (
                <p className="bg-[#f9fbf9] p-4 rounded-2xl border border-[#edf2ef]">
                  {intelligence?.summary || (
                    <span className="text-[#9ab5a8]">
                      {activeMeetingId
                        ? "AI summary is being generated — check back shortly after recording ends."
                        : "Record a meeting to see your AI-generated summary here."}
                    </span>
                  )}
                </p>
              )}

              {activeTab === "decisions" && (
                <ul className="space-y-2.5 bg-[#f9fbf9] p-4 rounded-2xl border border-[#edf2ef]">
                  {intelligence?.decisions && intelligence.decisions.length > 0
                    ? intelligence.decisions.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#1e6144] font-bold">•</span>
                          <span>{d}</span>
                        </li>
                      ))
                    : <li className="text-[#9ab5a8]">No decisions recorded yet for this meeting.</li>
                  }
                </ul>
              )}

              {activeTab === "actions" && (
                <div className="space-y-2 bg-[#f9fbf9] p-3 rounded-2xl border border-[#edf2ef]">
                  {tasks.length > 0
                    ? tasks.slice(0, 3).map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-2 bg-white rounded-xl border border-[#e2eae5]">
                          <span className="font-medium text-[#163a2b]">{t.title}</span>
                          <span className="text-[10px] text-[#1e6144] font-bold bg-[#e8f3ed] px-2 py-0.5 rounded">
                            {t.owner} • {t.due}
                          </span>
                        </div>
                      ))
                    : <p className="text-[#9ab5a8] p-2">No action items extracted yet.</p>
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Tier: Meeting Frequency + Team Insights + Top Recurring Tasks */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Meeting Frequency Stream Wave Chart */}
          <div className="xl:col-span-5 bg-white border border-[#e2eae5] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1e3f30] mb-2">
              <span>Meeting Frequency</span>
              <span className="text-[11px] text-[#718b7f]">30 Days</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center py-2 border-b border-[#edf2ef]">
              <div>
                <p className="text-[10px] text-[#718b7f]">Held</p>
                <p className="text-sm font-bold text-[#153e2d]">{metrics?.totalMeetings ?? 48}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#718b7f]">Transcribed</p>
                <p className="text-sm font-bold text-[#1e6144]">{metrics?.transcribedPercent ?? 92}%</p>
              </div>
              <div>
                <p className="text-[10px] text-[#718b7f]">Actions</p>
                <p className="text-sm font-bold text-[#153e2d]">{metrics?.totalActions ?? 132}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#718b7f]">Done</p>
                <p className="text-sm font-bold text-[#1e6144]">{metrics?.completedPercent ?? 68}%</p>
              </div>
            </div>

            <div className="h-28 w-full mt-3 flex items-end">
              <svg viewBox="0 0 500 150" className="w-full h-full">
                <defs>
                  <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#1e6144" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d="M0,80 C100,20 180,120 280,60 C380,10 420,90 500,40 L500,150 L0,150 Z" fill="url(#freqGrad)" />
                <path d="M0,80 C100,20 180,120 280,60 C380,10 420,90 500,40" fill="none" stroke="#1e6144" strokeWidth="3" />
              </svg>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-[#718b7f] mt-1">
              <span className="bg-[#e7f5ed] px-1.5 py-0.5 rounded text-[#1e6144]">↗ 100%</span>
              <span className="bg-[#e7f5ed] px-1.5 py-0.5 rounded text-[#1e6144]">↗ 92%</span>
              <span className="bg-[#e7f5ed] px-1.5 py-0.5 rounded text-[#1e6144]">↗ 67%</span>
              <span className="bg-[#e7f5ed] px-1.5 py-0.5 rounded text-[#1e6144]">↗ 37%</span>
            </div>
          </div>

          {/* Team Health Insights */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            <div className="bg-white border border-[#e2eae5] rounded-3xl p-4 shadow-sm">
              <div className="flex justify-between items-center text-xs text-[#718b7f] mb-1">
                <span>Team Engagement</span>
                <span>📈</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#153e2d]">{metrics?.teamEngagementPercent ?? 84}%</span>
                <span className="text-[10px] text-[#ec4899] font-semibold">5% improvement</span>
              </div>
              <p className="text-[10px] text-[#718b7f] mb-2">Healthy multi-speaker balance</p>
              <div className="w-full bg-[#edf2ef] rounded-full h-1.5 flex overflow-hidden">
                <div className="bg-[#1e6144] h-full w-4/6"></div>
                <div className="bg-[#f472b6] h-full w-2/6"></div>
              </div>
            </div>

            <div className="bg-white border border-[#e2eae5] rounded-3xl p-4 shadow-sm">
              <div className="flex justify-between items-center text-xs text-[#718b7f] mb-1">
                <span>Meeting Sentiment</span>
                <span>✨</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#153e2d]">{metrics?.sentimentPercent ?? 92}%</span>
                <span className="text-[10px] bg-[#e7f5ed] text-[#1e6144] px-1.5 py-0.5 rounded font-semibold">Positive</span>
              </div>
              <p className="text-[10px] text-[#718b7f] mb-2">Based on current agenda</p>
              <div className="w-full bg-[#edf2ef] rounded-full h-1.5">
                <div className="bg-[#10b981] h-1.5 rounded-full w-11/12"></div>
              </div>
            </div>

            <div className="bg-white border border-[#e2eae5] rounded-3xl p-4 shadow-sm">
              <div className="flex justify-between items-center text-xs text-[#718b7f] mb-1">
                <span>Project Progress</span>
                <span>⚙</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#153e2d]">78%</span>
                <span className="text-[10px] text-[#ec4899] font-semibold">10% increase</span>
              </div>
            </div>
          </div>

          {/* Action Items List */}
          <div className="xl:col-span-4 bg-white border border-[#e2eae5] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#1e3f30] mb-3">
                <span>Top Recurring Topics & Tasks</span>
                <span className="text-[11px] text-[#718b7f]">Checklist</span>
              </div>

              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={
                      task.done
                        ? "p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 bg-[#fbf4f6] border-[#fbcfe8]"
                        : "p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 bg-[#f7faf8] border-[#e2ede7] hover:border-[#1e6144]"
                    }
                  >
                    <div
                      className={
                        task.done
                          ? "w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center text-[10px] shrink-0 bg-[#f472b6] border-[#f472b6] text-white"
                          : "w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center text-[10px] shrink-0 border-[#718b7f]"
                      }
                    >
                      {task.done ? "✓" : ""}
                    </div>
                    <div className="flex-1">
                      <p className={task.done ? "text-xs font-medium leading-snug line-through text-[#8fa298]" : "text-xs font-medium leading-snug text-[#153e2d]"}>
                        {task.title}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-[#718b7f]">
                        <span className="font-medium text-[#466556]">👤 {task.owner}</span>
                        <span className="bg-white px-2 py-0.5 rounded-full border border-[#e2eae5] text-[9px] font-semibold">
                          {task.due}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#edf2ef] text-center">
              <span className="text-xs font-semibold text-[#1e6144]">
                Automated via ECHO Chrome Extension
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
