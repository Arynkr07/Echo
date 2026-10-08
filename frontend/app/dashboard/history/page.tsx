"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { api, Meeting, MeetingSummary, TranscriptItem, setApiUser } from "@/lib/api";
import AppShell from "../../components/AppShell";

type Tab = "transcript" | "summary" | "decisions" | "actions";

export default function HistoryPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("transcript");
  const [copied, setCopied] = useState(false);

  const select = useCallback(async (m: Meeting) => {
    setSelected(m);
    setLoading(true);
    setTranscript([]);
    setSummary(null);
    try {
      const [t, s] = await Promise.all([api.getLiveTranscript(m.id), api.getMeetingIntelligence(m.id)]);
      setTranscript(t || []);
      setSummary(s || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const data = await api.getAllMeetings();
      const past = data.filter((m) => m.status === "ended");
      setMeetings(past);
      setSelected((prev) => {
        if (!prev && past.length > 0) {
          select(past[0]);
          return past[0];
        }
        return prev;
      });
    };
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else {
        setApiUser(u.uid);
        load();
      }
    });
    load();
    return () => unsub();
  }, [router, select]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const copy = () => {
    if (!transcript.length) return;
    navigator.clipboard.writeText(transcript.map((t) => `[${t.time}] ${t.speaker}: ${t.text}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (mId: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    const ok = await api.deleteMeeting(mId);
    if (ok) {
      setMeetings((prev) => prev.filter((m) => m.id !== mId));
      if (selected?.id === mId) {
        setSelected(null);
        setTranscript([]);
        setSummary(null);
      }
    } else {
      alert("Failed to delete meeting.");
    }
  };

  return (
    <AppShell active="history" onSignOut={handleSignOut}>
      <main className="ec-wrap">
        <header className="ec-head">
          <h1>
            Every call, <span className="ec-g">kept.</span>
          </h1>
          <p>Open any past meeting to read the whole transcription, the summary, decisions and action items.</p>
        </header>

        <div className="ec-split">
          <aside className="ec-card">
            <div className="ec-title">
              <span>Past meetings</span>
              <span className="ec-pill">{meetings.length}</span>
            </div>
            {meetings.length === 0 ? (
              <p className="ec-empty">Finished recordings will show up here.</p>
            ) : (
              meetings.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`ec-row ${selected?.id === m.id ? "on" : ""}`}
                  onClick={() => select(m)}
                >
                  <b title={m.id}>{m.id}</b>
                  <span>
                    {new Date(m.started_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} •{" "}
                    {new Date(m.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              ))
            )}
          </aside>

          <section className="ec-card">
            {!selected ? (
              <p className="ec-empty">Select a meeting to read it.</p>
            ) : loading ? (
              <p className="ec-empty">Loading the full transcript…</p>
            ) : (
              <>
                <div className="ec-title">
                  <span>{selected.id}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="ec-btn o" type="button" onClick={() => handleDelete(selected.id)} style={{ color: '#ff4f9a', borderColor: '#ff4f9a' }}>
                      Delete
                    </button>
                    {transcript.length > 0 && (
                      <button className="ec-btn o" type="button" onClick={copy}>
                        {copied ? "Copied" : "Copy transcript"}
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: "var(--mute)", fontSize: ".85rem", margin: "-6px 0 14px" }}>
                  Recorded {new Date(selected.started_at).toLocaleString()} · {transcript.length} segments
                </p>
                <div className="ec-tabs">
                  {(
                    [
                      ["transcript", `Whole transcription (${transcript.length})`],
                      ["summary", "Summary"],
                      ["decisions", `Decisions (${summary?.decisions?.length || 0})`],
                      ["actions", `Actions (${summary?.actions?.length || 0})`],
                    ] as [Tab, string][]
                  ).map(([k, label]) => (
                    <button key={k} type="button" className={`ec-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
                      {label}
                    </button>
                  ))}
                </div>

                {tab === "transcript" &&
                  (transcript.length ? (
                    <div className="ec-scroll" style={{ maxHeight: 520 }}>
                      {transcript.map((l, i) => (
                        <div className="ec-line" key={i}>
                          <b>{l.speaker || "Participant"}</b>
                          <small>{l.time}</small>
                          <div>{l.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ec-empty">No transcript was recorded for this meeting.</p>
                  ))}
                {tab === "summary" && (
                  <div className="ec-out">{summary?.summary || "No summary was generated for this meeting."}</div>
                )}
                {tab === "decisions" &&
                  (summary?.decisions?.length ? (
                    summary.decisions.map((d, i) => (
                      <div className="ec-out b" key={i}>{d}</div>
                    ))
                  ) : (
                    <p className="ec-empty">No decisions were identified.</p>
                  ))}
                {tab === "actions" &&
                  (summary?.actions?.length ? (
                    summary.actions.map((t) => (
                      <div className={`ec-task ${t.done ? "done" : ""}`} key={t.id}>
                        <span className="ec-box">{t.done ? "✓" : ""}</span>
                        <div>
                          <p>{t.title}</p>
                          <small>{t.owner || "Unassigned"} · {t.due || "No date"}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="ec-empty">No action items were extracted.</p>
                  ))}
              </>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
