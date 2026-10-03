"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  api,
  Meeting,
  TranscriptItem,
  TaskItem,
  DashboardMetrics,
  MeetingSummary,
  setApiUser,
} from "@/lib/api";
import AppShell from "../components/AppShell";

type Tab = "summary" | "decisions" | "actions";

export default function EchoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  // The meeting on screen: the live one, or the last one once it has ended.
  const [displayed, setDisplayed] = useState<Meeting | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [intelligence, setIntelligence] = useState<MeetingSummary | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [customName, setCustomName] = useState("");

  const refresh = useCallback(async () => {
    const latest = await api.getLatestMeeting();
    if (!latest) return; // keep whatever is on screen, never blank out
    setDisplayed(latest);
    const [t, s] = await Promise.all([
      api.getLiveTranscript(latest.id),
      api.getMeetingIntelligence(latest.id),
    ]);
    setTranscript(t || []);
    setIntelligence(s || null);
    setTasks(s?.actions || []);
  }, []);

  useEffect(() => {
    const updateName = () => {
      const savedName = localStorage.getItem("echo_username");
      if (savedName) setCustomName(savedName);
    };
    updateName();
    window.addEventListener("echo_name_changed", updateName);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
        setApiUser(u.uid);
      }
    });

    api.getDashboardMetrics().then(setMetrics);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const interval = setInterval(() => {
      api.getDashboardMetrics().then(setMetrics);
      refresh();
    }, 4000);
    
    return () => {
      window.removeEventListener("echo_name_changed", updateName);
      unsubscribe();
      clearInterval(interval);
    };
  }, [router, refresh]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const name = customName || user?.displayName || user?.email?.split("@")[0] || "Member";
  const isLive = displayed?.status === "active";

  return (
    <AppShell active="dashboard" onSignOut={handleSignOut}>
      <main className="ec-wrap">
        <header className="ec-head">
          <h1>
            Hello, <span className="ec-g">{name}</span>.
          </h1>
          <p>Every call Echo listened to, with the transcript, the notes and what needs doing.</p>
        </header>

        <dl className="ec-stats" style={{ margin: "0 0 24px" }}>
          <div className="ec-card ec-stat">
            <strong>{metrics?.totalMeetings ?? 0}</strong>
            <span>meetings kept</span>
          </div>
          <div className="ec-card ec-stat">
            <strong>{metrics?.transcribedPercent ?? 0}%</strong>
            <span>transcribed</span>
          </div>
          <div className="ec-card ec-stat">
            <strong>{metrics?.totalActions ?? 0}</strong>
            <span>action items</span>
          </div>
          <div className="ec-card ec-stat">
            <strong>{metrics?.avgLengthMin ?? 0}m</strong>
            <span>average length</span>
          </div>
        </dl>

        <div className="ec-two">
          <section className="ec-card">
            <div className="ec-title">
              <span>Transcript</span>
              {displayed &&
                (isLive ? (
                  <span className="ec-live">LIVE MEETING</span>
                ) : (
                  <span className="ec-saved">LAST MEETING · SAVED</span>
                ))}
            </div>
            {displayed && (
              <p style={{ color: "var(--mute)", fontSize: ".85rem", margin: "0 0 10px" }}>
                {displayed.id} · {new Date(displayed.started_at).toLocaleString()}
              </p>
            )}
            <div className="ec-scroll">
              {transcript.length === 0 ? (
                <p className="ec-empty">
                  {displayed
                    ? "The transcript appears here once the audio is processed."
                    : "No meetings yet. Start recording from the Echo extension."}
                </p>
              ) : (
                transcript.map((l, i) => (
                  <div className="ec-line" key={i}>
                    <b>{l.speaker || "Participant"}</b>
                    <small>{l.time}</small>
                    <div>{l.text}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <Link className="ec-btn o" href="/dashboard/history">Open full history</Link>
            </div>
          </section>

          <section className="ec-card">
            <div className="ec-title">
              <span>Meeting notes</span>
            </div>
            <div className="ec-tabs">
              {(["summary", "decisions", "actions"] as Tab[]).map((t) => (
                <button key={t} type="button" className={`ec-tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
                  {t === "summary" ? "Summary" : t === "decisions" ? "Decisions" : "Actions"}
                </button>
              ))}
            </div>
            {tab === "summary" && (
              <div className="ec-out">
                {intelligence?.summary ||
                  (displayed
                    ? "The summary is being written. Check back shortly after recording ends."
                    : "Record a meeting to see your summary here.")}
              </div>
            )}
            {tab === "decisions" &&
              (intelligence?.decisions?.length ? (
                intelligence.decisions.map((d, i) => (
                  <div className="ec-out b" key={i}>{d}</div>
                ))
              ) : (
                <p className="ec-empty">No decisions recorded for this meeting.</p>
              ))}
            {tab === "actions" &&
              (tasks.length ? (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`ec-task ${t.done ? "done" : ""}`}
                    onClick={() => setTasks((p) => api.toggleTaskStatus(p, t.id))}
                  >
                    <span className="ec-box">{t.done ? "✓" : ""}</span>
                    <div>
                      <p>{t.title}</p>
                      <small>{t.owner || "Unassigned"} · {t.due || "No date"}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="ec-empty">No action items extracted yet.</p>
              ))}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
