"use client";

/**
 * Echo dashboard (app/dashboard/page.tsx), all in one file:
 *   1. types and demo data
 *   2. the page: stats, search + meeting list, and the selected meeting with three tabs
 * The styles live in app/globals.css (classes that start with "db-").
 */

import Link from "next/link";
import { useEffect, useState } from "react";

/* ------------------------------ types and demo data ------------------------------ */

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

        {/* ---------- Numbers ---------- */}
        <dl className="db-stats">
          <div><dt>meetings kept</dt><dd>{MEETINGS.length}</dd></div>
          <div><dt>minutes transcribed</dt><dd>{totalMinutes}</dd></div>
          <div><dt>open action items</dt><dd>{totalOpen}</dd></div>
        </dl>

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