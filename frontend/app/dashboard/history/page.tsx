"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { api, Meeting, MeetingSummary, setApiUser } from "@/lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        setApiUser(currentUser.uid);
      }
    });

    api.getAllMeetings().then((data) => {
      // Filter out active meetings, only show ended ones in history
      const pastMeetings = data.filter(m => m.status === "ended");
      setMeetings(pastMeetings);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSelectMeeting = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setLoadingSummary(true);
    setSummary(null);
    const data = await api.getMeetingIntelligence(meeting.id);
    setSummary(data);
    setLoadingSummary(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
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
            <Link href="/dashboard" className="w-10 h-10 rounded-xl text-[#7f998c] hover:bg-[#f4f7f5] flex items-center justify-center text-sm transition" title="Dashboard">
              ⊞
            </Link>
            <Link href="/dashboard/history" className="w-10 h-10 rounded-xl bg-[#e8f3ed] text-[#1e6144] font-bold flex items-center justify-center text-sm shadow-xs" title="Past Meetings History">
              🕒
            </Link>
            <Link href="/developer" className="w-10 h-10 rounded-xl text-[#7f998c] hover:bg-[#f4f7f5] flex items-center justify-center text-sm transition" title="Download Extension">
              🧩
            </Link>
          </nav>
        </div>

        <button onClick={handleSignOut} className="text-[#7f998c] hover:text-[#dc2626] text-xs font-semibold cursor-pointer" title="Sign Out">
          ⏻
        </button>
      </aside>

      {/* 2. Main Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#163a2b]">Meeting History 🕒</h1>
            <p className="text-xs text-[#6e8a7d] mt-0.5">Review summaries and decisions from past meetings.</p>
          </div>
          <Link
            href="/developer"
            className="text-xs font-semibold text-[#1e6144] bg-[#e8f3ed] border border-[#cde4d7] hover:bg-[#dcf0e4] px-4 py-1.5 rounded-full transition"
          >
            Download Extension 🧩
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* List of Meetings */}
          <div className="md:col-span-4 bg-white border border-[#e2eae5] rounded-3xl p-5 shadow-sm h-[calc(100vh-140px)] overflow-y-auto">
            <h2 className="text-sm font-bold text-[#163a2b] mb-4">Past Meetings</h2>
            {meetings.length === 0 ? (
              <p className="text-xs text-[#9ab5a8]">No past meetings found.</p>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={() => handleSelectMeeting(meeting)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      selectedMeeting?.id === meeting.id
                        ? "bg-[#e8f3ed] border-[#cde4d7]"
                        : "bg-[#f9fbf9] border-[#edf2ef] hover:border-[#1e6144]"
                    }`}
                  >
                    <p className="text-xs font-bold text-[#163a2b] truncate" title={meeting.id}>
                      {meeting.id}
                    </p>
                    <p className="text-[10px] text-[#718b7f] mt-1">
                      {new Date(meeting.started_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meeting Details */}
          <div className="md:col-span-8 bg-white border border-[#e2eae5] rounded-3xl p-6 shadow-sm h-[calc(100vh-140px)] overflow-y-auto">
            {!selectedMeeting ? (
              <div className="flex items-center justify-center h-full text-sm text-[#9ab5a8]">
                Select a meeting from the list to view its summary and decisions.
              </div>
            ) : loadingSummary ? (
              <div className="flex items-center justify-center h-full text-sm text-[#718b7f]">
                Loading summary...
              </div>
            ) : summary ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#163a2b] mb-2">Summary</h3>
                  <p className="bg-[#f9fbf9] p-4 rounded-2xl border border-[#edf2ef] text-sm text-[#385345] leading-relaxed">
                    {summary.summary || "No summary available."}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-[#163a2b] mb-2">Key Decisions</h3>
                  <ul className="space-y-2 bg-[#f9fbf9] p-4 rounded-2xl border border-[#edf2ef]">
                    {summary.decisions?.length > 0 ? (
                      summary.decisions.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#385345]">
                          <span className="text-[#1e6144] font-bold">•</span>
                          <span>{d}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-[#9ab5a8]">No decisions recorded.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#163a2b] mb-2">Action Items</h3>
                  <div className="space-y-2 bg-[#f9fbf9] p-4 rounded-2xl border border-[#edf2ef]">
                    {summary.actions?.length > 0 ? (
                      summary.actions.map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-[#e2eae5]">
                          <span className="font-medium text-[#163a2b] text-sm">{t.title}</span>
                          <span className="text-[11px] text-[#1e6144] font-bold bg-[#e8f3ed] px-2 py-1 rounded">
                            {t.owner} • {t.due}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#9ab5a8]">No action items recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[#9ab5a8]">
                Failed to load intelligence for this meeting.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
