"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { api, Meeting, MeetingSummary, TranscriptItem, setApiUser } from "@/lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "summary" | "decisions" | "actions" | "all">("transcript");
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const handleSelectMeeting = useCallback(async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setLoadingDetails(true);
    setTranscript([]);
    setSummary(null);

    try {
      const [transcriptData, intelligenceData] = await Promise.all([
        api.getLiveTranscript(meeting.id),
        api.getMeetingIntelligence(meeting.id),
      ]);
      setTranscript(transcriptData || []);
      setSummary(intelligenceData || null);
    } catch (err) {
      console.error("Failed to load meeting details:", err);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    const fetchMeetings = async () => {
      const data = await api.getAllMeetings();
      // Filter out active meetings, only show ended ones in history
      const pastMeetings = data.filter((m) => m.status === "ended");
      setMeetings(pastMeetings);
      if (pastMeetings.length > 0) {
        setSelectedMeeting((prev) => {
          if (!prev) {
            handleSelectMeeting(pastMeetings[0]);
            return pastMeetings[0];
          }
          return prev;
        });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        setApiUser(currentUser.uid);
        fetchMeetings();
      }
    });

    fetchMeetings();

    return () => unsubscribe();
  }, [router, handleSelectMeeting]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleCopyTranscript = () => {
    if (!transcript.length) return;
    const text = transcript
      .map((t) => `[${t.time}] ${t.speaker}: ${t.text}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#1b2b23] flex font-sans antialiased">
      {/* 1. Slim Icon Navigation */}
      <aside className="w-16 bg-white border-r border-[#e2eae5] flex flex-col items-center py-6 justify-between shrink-0">
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/"
            className="w-10 h-10 rounded-2xl bg-[#1e6144] flex items-center justify-center text-white font-black text-lg shadow-sm"
            title="Go to Home"
          >
            E
          </Link>
          <nav className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-xl text-[#7f998c] hover:bg-[#f4f7f5] flex items-center justify-center text-sm transition"
              title="Dashboard"
            >
              ⊞
            </Link>
            <Link
              href="/dashboard/history"
              className="w-10 h-10 rounded-xl bg-[#e8f3ed] text-[#1e6144] font-bold flex items-center justify-center text-sm shadow-xs"
              title="Past Meetings History"
            >
              🕒
            </Link>
            <Link
              href="/developer"
              className="w-10 h-10 rounded-xl text-[#7f998c] hover:bg-[#f4f7f5] flex items-center justify-center text-sm transition"
              title="Download Extension"
            >
              🧩
            </Link>
          </nav>
        </div>

        <button
          onClick={handleSignOut}
          className="text-[#7f998c] hover:text-[#dc2626] text-xs font-semibold cursor-pointer"
          title="Sign Out"
        >
          ⏻
        </button>
      </aside>

      {/* 2. Main Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#163a2b]">Meeting History 🕒</h1>
            <p className="text-xs text-[#6e8a7d] mt-0.5">
              Review full transcripts, AI-generated summaries, and key decisions from past recorded meetings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[#466556] bg-white border border-[#dce6e1] hover:border-[#1e6144] px-4 py-1.5 rounded-full transition shadow-xs"
            >
              ← Back to Dashboard
            </Link>
            <Link
              href="/developer"
              className="text-xs font-semibold text-[#1e6144] bg-[#e8f3ed] border border-[#cde4d7] hover:bg-[#dcf0e4] px-4 py-1.5 rounded-full transition"
            >
              Download Extension 🧩
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* List of Meetings */}
          <div className="md:col-span-4 bg-white border border-[#e2eae5] rounded-3xl p-5 shadow-sm h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#163a2b]">Past Meetings</h2>
              <span className="text-[11px] font-bold text-[#1e6144] bg-[#e8f3ed] px-2 py-0.5 rounded-full">
                {meetings.length} Recorded
              </span>
            </div>

            {meetings.length === 0 ? (
              <div className="text-center py-16 text-xs text-[#9ab5a8]">
                No past meetings found. Once you complete a recording with the extension, it will appear here.
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={() => handleSelectMeeting(meeting)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      selectedMeeting?.id === meeting.id
                        ? "bg-[#e8f3ed] border-[#1e6144] shadow-xs"
                        : "bg-[#f9fbf9] border-[#edf2ef] hover:border-[#a8d3bd]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#163a2b] font-mono truncate max-w-[190px]" title={meeting.id}>
                        {meeting.id}
                      </span>
                      <span className="text-[10px] bg-white border border-[#dce6e1] text-[#466556] font-semibold px-1.5 py-0.5 rounded">
                        ✓ Ended
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#718b7f] mt-1.5">
                      <span>{new Date(meeting.started_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>{new Date(meeting.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meeting Details View */}
          <div className="md:col-span-8 bg-white border border-[#e2eae5] rounded-3xl p-6 shadow-sm h-[calc(100vh-140px)] flex flex-col">
            {!selectedMeeting ? (
              <div className="flex items-center justify-center flex-1 text-sm text-[#9ab5a8]">
                Select a meeting from the list to view its transcript and AI intelligence.
              </div>
            ) : loadingDetails ? (
              <div className="flex flex-col items-center justify-center flex-1 text-sm text-[#718b7f] gap-3">
                <div className="w-6 h-6 border-2 border-[#1e6144] border-t-transparent rounded-full animate-spin"></div>
                <span>Loading complete transcript & intelligence...</span>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Meeting Meta Header */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#edf2ef] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#163a2b] font-mono">{selectedMeeting.id}</h2>
                      <span className="text-[10px] bg-[#e8f3ed] text-[#1e6144] font-bold px-2 py-0.5 rounded-full">
                        {transcript.length} {transcript.length === 1 ? "Segment" : "Segments"}
                      </span>
                    </div>
                    <p className="text-xs text-[#718b7f] mt-0.5">
                      Recorded on {new Date(selectedMeeting.started_at).toLocaleString()}
                    </p>
                  </div>

                  {transcript.length > 0 && (
                    <button
                      onClick={handleCopyTranscript}
                      className="text-xs font-semibold text-[#1e6144] bg-[#e8f3ed] hover:bg-[#dcf0e4] border border-[#cde4d7] px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                      title="Copy full text transcript"
                    >
                      <span>{copiedTranscript ? "✓ Copied!" : "📋 Copy Transcript"}</span>
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#edf2ef] mt-4 mb-4 gap-1 overflow-x-auto shrink-0">
                  <button
                    onClick={() => setActiveTab("transcript")}
                    className={`pb-2.5 px-3.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "transcript"
                        ? "text-[#1e6144] border-b-2 border-[#1e6144]"
                        : "text-[#718b7f] hover:text-[#163a2b]"
                    }`}
                  >
                    <span>💬 Whole Transcription</span>
                    <span className="text-[10px] bg-[#edf3ef] px-1.5 py-0.2 rounded-full font-mono">
                      {transcript.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`pb-2.5 px-3.5 text-xs font-bold transition cursor-pointer ${
                      activeTab === "summary"
                        ? "text-[#1e6144] border-b-2 border-[#1e6144]"
                        : "text-[#718b7f] hover:text-[#163a2b]"
                    }`}
                  >
                    📋 AI Summary
                  </button>
                  <button
                    onClick={() => setActiveTab("decisions")}
                    className={`pb-2.5 px-3.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "decisions"
                        ? "text-[#1e6144] border-b-2 border-[#1e6144]"
                        : "text-[#718b7f] hover:text-[#163a2b]"
                    }`}
                  >
                    <span>🎯 Decisions</span>
                    <span className="text-[10px] bg-[#edf3ef] px-1.5 py-0.2 rounded-full font-mono">
                      {summary?.decisions?.length || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("actions")}
                    className={`pb-2.5 px-3.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "actions"
                        ? "text-[#1e6144] border-b-2 border-[#1e6144]"
                        : "text-[#718b7f] hover:text-[#163a2b]"
                    }`}
                  >
                    <span>✅ Action Items</span>
                    <span className="text-[10px] bg-[#edf3ef] px-1.5 py-0.2 rounded-full font-mono">
                      {summary?.actions?.length || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`pb-2.5 px-3.5 text-xs font-bold transition cursor-pointer ${
                      activeTab === "all"
                        ? "text-[#1e6144] border-b-2 border-[#1e6144]"
                        : "text-[#718b7f] hover:text-[#163a2b]"
                    }`}
                  >
                    📑 Complete Overview
                  </button>
                </div>

                {/* Tab Body */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs">
                  {/* WHOLE TRANSCRIPTION TAB */}
                  {(activeTab === "transcript" || activeTab === "all") && (
                    <div className="space-y-3">
                      {activeTab === "all" && (
                        <h3 className="text-sm font-bold text-[#163a2b] flex items-center gap-2">
                          <span>💬 Whole Transcription</span>
                          <span className="text-[10px] bg-[#e8f3ed] text-[#1e6144] px-2 py-0.5 rounded-full font-mono">
                            {transcript.length} segments
                          </span>
                        </h3>
                      )}

                      {transcript.length > 0 ? (
                        <div className="space-y-3">
                          {transcript.map((item, idx) => (
                            <div
                              key={idx}
                              className="border-l-2 border-[#1e6144] pl-3.5 py-2 bg-[#f9fbf9] rounded-r-2xl border-t border-b border-r border-[#edf2ef]"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs text-[#163a2b] bg-[#e8f3ed] text-[#1e6144] px-2 py-0.5 rounded-md">
                                  {item.speaker || "Participant"}
                                </span>
                                <span className="text-[10px] font-mono text-[#718b7f]">{item.time}</span>
                              </div>
                              <p className="text-xs text-[#2b4437] leading-relaxed select-text mt-1">
                                {item.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-[#f9fbf9] rounded-2xl border border-[#edf2ef] text-[#9ab5a8]">
                          No transcript segments were recorded for this meeting.
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUMMARY TAB */}
                  {(activeTab === "summary" || activeTab === "all") && (
                    <div className="space-y-2">
                      {activeTab === "all" && (
                        <h3 className="text-sm font-bold text-[#163a2b] mt-4">📋 AI Executive Summary</h3>
                      )}
                      <div className="bg-[#f9fbf9] p-4 rounded-2xl border border-[#edf2ef] leading-relaxed text-[#385345]">
                        {summary?.summary || "No summary was generated for this meeting."}
                      </div>
                    </div>
                  )}

                  {/* KEY DECISIONS TAB */}
                  {(activeTab === "decisions" || activeTab === "all") && (
                    <div className="space-y-2">
                      {activeTab === "all" && (
                        <h3 className="text-sm font-bold text-[#163a2b] mt-4">🎯 Key Decisions</h3>
                      )}
                      <ul className="space-y-2 bg-[#f9fbf9] p-4 rounded-2xl border border-[#edf2ef]">
                        {summary?.decisions && summary.decisions.length > 0 ? (
                          summary.decisions.map((d, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[#385345]">
                              <span className="text-[#1e6144] font-bold text-sm leading-none mt-0.5">•</span>
                              <span className="leading-snug">{d}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-[#9ab5a8]">No specific decisions were identified.</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* ACTION ITEMS TAB */}
                  {(activeTab === "actions" || activeTab === "all") && (
                    <div className="space-y-2">
                      {activeTab === "all" && (
                        <h3 className="text-sm font-bold text-[#163a2b] mt-4">✅ Action Items</h3>
                      )}
                      <div className="space-y-2 bg-[#f9fbf9] p-4 rounded-2xl border border-[#edf2ef]">
                        {summary?.actions && summary.actions.length > 0 ? (
                          summary.actions.map((t) => (
                            <div
                              key={t.id}
                              className="flex justify-between items-center p-3 bg-white rounded-xl border border-[#e2eae5] shadow-2xs"
                            >
                              <span className="font-semibold text-[#163a2b]">{t.title}</span>
                              <span className="text-[11px] text-[#1e6144] font-bold bg-[#e8f3ed] px-2.5 py-1 rounded-lg">
                                {t.owner || "Unassigned"} • {t.due || "No date"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[#9ab5a8]">No action items were extracted.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
