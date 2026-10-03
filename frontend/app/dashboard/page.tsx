"use client";

/**
 * Echo dashboard (app/dashboard/page.tsx), all in one file:
 *   1. types and demo data
 *   2. the page: stats, search + meeting list, and the selected meeting with three tabs
 * The styles live in app/globals.css (classes that start with "db-").
 */

import Link from "next/link";
import { useEffect, useState } from "react";

<<<<<<< Updated upstream
/* ------------------------------ types and demo data ------------------------------ */
=======
export default function EchoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [displayedMeeting, setDisplayedMeeting] = useState<Meeting | null>(null);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [transcriptList, setTranscriptList] = useState<TranscriptItem[]>([]);
  const [intelligence, setIntelligence] = useState<MeetingSummary | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
>>>>>>> Stashed changes

interface Line {
  time: number; // seconds from the start of the meeting
  speaker: string;
  text: string;
}
interface Action {
  id: string;
  text: string;
  owner: string;
  due?: string;
  done: boolean;
}
interface Meeting {
  id: string;
  title: string;
  date: string;
  minutes: number;
  summary: string;
  decisions: string[];
  actions: Action[];
  transcript: Line[];
}

<<<<<<< Updated upstream
/**
 * Demo data. To use your own API, fetch from /api/meetings (app/api/meetings) inside the page,
 * keep it in state, and make sure each item has the fields of the Meeting type above.
 */
const MEETINGS: Meeting[] = [
  {
    id: "weekly-build-sync",
    title: "Weekly build sync",
    date: "Oct 1, 6:38 PM",
    minutes: 5,
    summary:
      "The team agreed to speed up the roof work. Reinforcements go in now so the roof crew can start on Monday, and Riddhima will share the build plan by Friday.",
    decisions: ["Send reinforcements now", "Roof crew starts Monday"],
    actions: [
      { id: "a1", text: "Send reinforcements to the roof site", owner: "Aryan", done: true },
      { id: "a2", text: "Roof crew starts work", owner: "Aryan", due: "Monday", done: false },
      { id: "a3", text: "Share the build plan", owner: "Riddhima", due: "Friday", done: false },
    ],
    transcript: [
      { time: 0, speaker: "Aryan", text: "Since we have an entire city to build, these houses need to go up fast." },
      { time: 15, speaker: "Riddhima", text: "Let's send in reinforcements so we can finish the roof." },
      { time: 25, speaker: "Aryan", text: "Agreed, roof crew starts Monday." },
      { time: 48, speaker: "Ritika", text: "Do we have the materials for the second floor already?" },
      { time: 62, speaker: "Riddhima", text: "Not yet. I will share the build plan by Friday so we can order them." },
    ],
  },
  {
    id: "design-review",
    title: "Design review",
    date: "Sep 23, 11:20 PM",
    minutes: 21,
    summary:
      "Ritika walked through the new popup design. The record button moves to the top, and the live badge becomes red so it is hard to miss.",
    decisions: ["Record button moves to the top of the popup", "Live badge uses red"],
    actions: [
      { id: "a1", text: "Update the popup layout", owner: "Ritika", due: "Wednesday", done: false },
      { id: "a2", text: "Test the red live badge in dark mode", owner: "Aryan", done: false },
    ],
    transcript: [
      { time: 0, speaker: "Ritika", text: "Here is the new popup. The record button was too low before." },
      { time: 22, speaker: "Aryan", text: "Moving it to the top makes sense. People press it first." },
      { time: 41, speaker: "Ritika", text: "I also want the live badge to be red so you can see it from across the room." },
    ],
  },
  {
    id: "standup",
    title: "Standup",
    date: "Sep 23, 11:19 PM",
    minutes: 9,
    summary: "Quick daily check-in. Aryan is fixing a capture bug, Riddhima is building the dashboard, Ritika is tuning the summaries.",
    decisions: [],
    actions: [{ id: "a1", text: "Fix the audio capture bug on long meetings", owner: "Aryan", done: false }],
    transcript: [
      { time: 0, speaker: "Aryan", text: "I am fixing a capture bug that shows up on long meetings." },
      { time: 18, speaker: "Riddhima", text: "I am building the dashboard. The meeting list is done." },
      { time: 35, speaker: "Ritika", text: "I am tuning the summaries so they stay short." },
    ],
  },
];

type Tab = "summary" | "transcript" | "actions";
=======
  const loadMeetingData = useCallback(async (meeting: Meeting) => {
    setDisplayedMeeting(meeting);
    setActiveMeetingId(meeting.id);
    const [transcript, summary] = await Promise.all([
      api.getLiveTranscript(meeting.id),
      api.getMeetingIntelligence(meeting.id),
    ]);
    setTranscriptList(transcript || []);
    setIntelligence(summary || null);
    if (summary && summary.actions) {
      setTasks(summary.actions);
    } else {
      setTasks([]);
    }
  }, []);

  const refreshMeetingData = useCallback(async () => {
    const meeting = await api.getLatestMeeting();
    if (meeting) {
      loadMeetingData(meeting);
    } else {
      setDisplayedMeeting(null);
      setActiveMeetingId(null);
      setTranscriptList([]);
      setIntelligence(null);
      setTasks([]);
    }
  }, [loadMeetingData]);
>>>>>>> Stashed changes

/* ---------------------------------- helpers ---------------------------------- */

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const initials = (name: string) => name.slice(0, 2).toUpperCase();

function applySavedTheme() {
  try {
    const saved = localStorage.getItem("echo-theme");
    if (saved) document.documentElement.dataset.theme = saved;
  } catch {
    /* storage blocked: keep the default */
  }
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("echo-theme", next);
  } catch {
    /* ignore */
  }
}

/** Notes as plain text, for the "Copy notes" button. */
function toNotes(m: Meeting, isDone: (a: Action) => boolean): string {
  return [
    m.title,
    `${m.date} · ${m.minutes} min`,
    "",
    "Summary",
    m.summary,
    "",
    "Decisions",
    ...(m.decisions.length ? m.decisions.map((d) => `- ${d}`) : ["- none"]),
    "",
    "Action items",
    ...m.actions.map((a) => `- [${isDone(a) ? "x" : " "}] ${a.text} (${a.owner}${a.due ? `, ${a.due}` : ""})`),
  ].join("\n");
}

/* ------------------------------------ page ----------------------------------- */

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState(MEETINGS[0].id);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("summary");
  const [ticked, setTicked] = useState<Record<string, boolean>>({}); // "meetingId:actionId" -> done
  const [copied, setCopied] = useState(false);

  useEffect(applySavedTheme, []);

  // Search looks in titles and in every transcript
  const q = query.trim().toLowerCase();
  const visible = q
    ? MEETINGS.filter((m) => m.title.toLowerCase().includes(q) || m.transcript.some((l) => l.text.toLowerCase().includes(q)))
    : MEETINGS;
  const selected = visible.find((m) => m.id === selectedId) ?? visible[0];

  const isDone = (m: Meeting) => (a: Action) => ticked[`${m.id}:${a.id}`] ?? a.done;
  const openCount = (m: Meeting) => m.actions.filter((a) => !isDone(m)(a)).length;

  const totalMinutes = MEETINGS.reduce((sum, m) => sum + m.minutes, 0);
  const totalOpen = MEETINGS.reduce((sum, m) => sum + openCount(m), 0);

  const copyNotes = () => {
    if (!selected) return;
    navigator.clipboard.writeText(toNotes(selected, isDone(selected))).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
<<<<<<< Updated upstream
=======

    api.getDashboardMetrics().then(setMetrics);
    refreshMeetingData();

    const interval = setInterval(() => {
      api.getDashboardMetrics().then(setMetrics);
      refreshMeetingData();
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [router, refreshMeetingData]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
>>>>>>> Stashed changes
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "transcript", label: "Transcript" },
    { id: "actions", label: selected && openCount(selected) ? `Action items (${openCount(selected)})` : "Action items" },
  ];

  return (
    <>
      <nav>
        <Link className="logo" href="/"><i />echo</Link>
        <Link className="l" href="/#call">How it works</Link>
        <Link className="l" href="/#attach">Attach</Link>
        <button className="tm" type="button" aria-label="Switch light or dark mode" onClick={toggleTheme}>◐</button>
      </nav>

      <main className="db in">
        <header className="db-head">
          <h1>Your meetings</h1>
          <p>Every call Echo listened to, with the transcript, the notes and what needs doing.</p>
        </header>

<<<<<<< Updated upstream
        {/* ---------- Numbers ---------- */}
        <dl className="db-stats">
          <div><dt>meetings kept</dt><dd>{MEETINGS.length}</dd></div>
          <div><dt>minutes transcribed</dt><dd>{totalMinutes}</dd></div>
          <div><dt>open action items</dt><dd>{totalOpen}</dd></div>
        </dl>
=======
      {/* 2. Main Executive Workstation */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#163a2b] flex items-center gap-2">
              Good morning,{" "}
              {isEditingName ? (
                <input
                  type="text"
                  autoFocus
                  defaultValue={customName || user?.displayName || user?.email?.split("@")[0] || "Member"}
                  onBlur={(e) => handleSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName(e.currentTarget.value)}
                  className="bg-transparent border-b-2 border-[#1e6144] outline-none text-[#163a2b] font-bold focus:ring-0 max-w-[150px]"
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-[#1e6144] transition underline decoration-dashed decoration-[#c4e3d1] underline-offset-4"
                  onClick={() => setIsEditingName(true)}
                  title="Click to edit name"
                >
                  {customName || user?.displayName || user?.email?.split("@")[0] || "Member"}
                </span>
              )} 👋
            </h1>
            <div className="text-xs text-[#6e8a7d] mt-1 flex items-center gap-2">
              {displayedMeeting ? (
                displayedMeeting.status === "active" ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#1e6144] bg-[#e7f5ed] px-2.5 py-0.5 rounded-full text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping inline-block"></span>
                      LIVE
                    </span>
                    <span>Active Meeting: <strong className="text-[#163a2b] font-mono">{displayedMeeting.id}</strong></span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 text-[#1e6144] bg-[#e8f3ed] border border-[#cde4d7] px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
                      <span>✓ Last Meeting:</span>
                      <strong className="font-mono text-[#163a2b] ml-1">{displayedMeeting.id}</strong>
                    </span>
                    <span className="text-[11px] text-[#718b7f]">
                      ({new Date(displayedMeeting.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </>
                )
              ) : (
                <span className="text-[#9ab5a8]">No meetings recorded yet — start the extension to begin</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/developer"
              className="text-xs font-semibold text-[#1e6144] bg-[#e8f3ed] border border-[#cde4d7] hover:bg-[#dcf0e4] px-4 py-1.5 rounded-full transition"
            >
              Download Extension 🧩
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-[#466556] bg-white border border-[#dce6e1] hover:border-[#1e6144] px-4 py-1.5 rounded-full transition shadow-xs cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
>>>>>>> Stashed changes

        <div className="db-grid">
          {/* ---------- Left: search and meeting list ---------- */}
          <div className="db-list">
            <label className="db-search">
              <span className="db-sr">Search meetings and transcripts</span>
              <input
                type="search"
                placeholder="Search titles and transcripts"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

<<<<<<< Updated upstream
            {visible.length === 0 ? (
              <p className="db-empty">No meeting matches &ldquo;{query}&rdquo;. Try a different word.</p>
            ) : (
              <ul>
                {visible.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={`db-row ${m.id === selected?.id ? "on" : ""}`}
                      onClick={() => setSelectedId(m.id)}
=======
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
          {/* Live / Latest Transcript Stream */}
          <div className="lg:col-span-6 bg-white border border-[#e2eae5] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#edf2ef] mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1e6144] flex items-center gap-2">
                  {displayedMeeting?.status === "active" ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping"></span>
                      Live Meeting Transcript
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#1e6144]"></span>
                      Latest Meeting Transcript
                    </>
                  )}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium ${
                  displayedMeeting?.status === "active"
                    ? "bg-[#e7f5ed] text-[#1e6144]"
                    : "bg-[#edf3ef] text-[#466556]"
                }`}>
                  {displayedMeeting?.status === "active" ? "Real-time" : "Saved Session"}
                </span>
              </div>

              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-2">
                {transcriptList.length > 0 ? (
                  transcriptList.map((item, idx) => (
                    <div key={idx} className="border-l-2 border-[#1e6144] pl-3 py-1 bg-[#f9fbf9] rounded-r-xl">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-xs text-[#163a2b]">{item.speaker}</span>
                        <span className="text-[10px] text-[#718b7f]">{item.time}</span>
                      </div>
                      <p className="text-xs text-[#385345] leading-relaxed">{item.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-[#9ab5a8]">
                    {displayedMeeting ? (
                      displayedMeeting.status === "active"
                        ? "Waiting for speech to be transcribed in real-time..."
                        : "No transcript segments recorded for this meeting."
                    ) : (
                      "No meeting recorded yet. Start the Chrome extension to record."
                    )}
                  </div>
                )}
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
                      {displayedMeeting
                        ? (displayedMeeting.status === "active"
                            ? "AI summary is being generated — check back shortly after recording ends."
                            : "No summary available for this meeting.")
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
                <span className="text-xl font-bold text-[#153e2d]">{metrics?.sentimentPercent ?? 50}%</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  (metrics?.sentimentPercent ?? 50) >= 75 ? 'bg-[#e7f5ed] text-[#1e6144]' :
                  (metrics?.sentimentPercent ?? 50) >= 50 ? 'bg-[#fef3c7] text-[#92400e]' :
                  'bg-[#fee2e2] text-[#991b1b]'
                }`}>
                  {(metrics?.sentimentPercent ?? 50) >= 75 ? 'Positive' :
                   (metrics?.sentimentPercent ?? 50) >= 50 ? 'Neutral' : 'Tense'}
                </span>
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
>>>>>>> Stashed changes
                    >
                      <strong>{m.title}</strong>
                      <span>{m.date} · {m.minutes} min</span>
                      {openCount(m) > 0 && <em className="db-open">{openCount(m)} open</em>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ---------- Right: the selected meeting ---------- */}
          {selected && (
            <article className="db-detail">
              <header>
                <div>
                  <h2>{selected.title}</h2>
                  <p>{selected.date} · {selected.minutes} min</p>
                </div>
                <button className="cpy" type="button" onClick={copyNotes}>{copied ? "Copied" : "Copy notes"}</button>
              </header>

              <div className="db-tabs" role="tablist">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    type="button"
                    aria-selected={tab === t.id}
                    className={tab === t.id ? "on" : ""}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div role="tabpanel">
                {tab === "summary" && (
                  <>
                    <p className="db-summary">{selected.summary}</p>
                    <h3>Decisions</h3>
                    {selected.decisions.length === 0 ? (
                      <p className="db-empty">No decisions were made in this meeting.</p>
                    ) : (
                      <ul className="db-plain">
                        {selected.decisions.map((d) => <li key={d}>✓ {d}</li>)}
                      </ul>
                    )}
                  </>
                )}

                {tab === "transcript" && (
                  <ol className="db-transcript">
                    {selected.transcript.map((line) => (
                      <li key={line.time}>
                        <span className="db-av">{initials(line.speaker)}</span>
                        <div>
                          <b>{line.speaker}</b> <time>{clock(line.time)}</time>
                          <p>{line.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {tab === "actions" && (
                  <ul className="db-actions">
                    {selected.actions.map((a) => {
                      const done = isDone(selected)(a);
                      return (
                        <li key={a.id}>
                          <label>
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={() => setTicked((t) => ({ ...t, [`${selected.id}:${a.id}`]: !done }))}
                            />
                            <span className={done ? "done" : ""}>{a.text}</span>
                          </label>
                          <small>{a.owner}{a.due ? ` · ${a.due}` : ""}</small>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </article>
          )}
        </div>
      </main>

      <footer>
        <div className="in">
          <span>Echo, built by Aryan Kumar, Ritika Kushwaha and Riddhima Sinha.</span>
          <a href="https://github.com/Arynkr07/Echo">Project on GitHub</a>
        </div>
      </footer>
    </>
  );
}