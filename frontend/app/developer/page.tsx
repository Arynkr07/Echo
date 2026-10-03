"use client";

import React from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";

const Code = ({ children }: { children: React.ReactNode }) => <code className="ec-code">{children}</code>;

const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Get the extension folder",
    body: (
      <>
        Take the <Code>extension/</Code> folder from the Echo project. It holds <Code>manifest.json</Code>, the background
        worker, popup, offscreen page and content scripts.
      </>
    ),
  },
  {
    title: "Open the extensions page",
    body: (
      <>
        In Chrome, Edge or Brave, go to <Code>chrome://extensions</Code> and switch on <b>Developer mode</b> in the top
        right corner.
      </>
    ),
  },
  {
    title: "Load it unpacked",
    body: (
      <>
        Click <b>Load unpacked</b> and choose the <Code>extension/</Code> folder. The Echo icon appears in your toolbar.
      </>
    ),
  },
  {
    title: "Sign in on the dashboard",
    body: <>Open the dashboard and sign in once. Echo links your account to the extension on its own, with no keys to paste.</>,
  },
  {
    title: "Record from Google Meet",
    body: <>Open a Meet tab, click Echo and press record. Stop when you are done and your notes appear on the dashboard.</>,
  },
];

export default function ExtensionInstallPage() {
  return (
    <AppShell active="developer">
      <main className="ec-wrap">
        <header className="ec-head">
          <h1>
            Attach Echo in <span className="ec-g">five steps.</span>
          </h1>
          <p>Takes about two minutes, once. Tell the people on your call that you are recording, as you would with any recorder.</p>
        </header>

        <div className="ec-grid">
          {STEPS.map((s, i) => (
            <div className="ec-card ec-step" key={s.title}>
              <span className="ec-num">{i + 1}</span>
              <div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: 6 }}>{s.title}</h3>
                <p style={{ margin: 0, color: "var(--mute)" }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <Link className="ec-btn" href="/dashboard">Open dashboard</Link>
        </div>
      </main>
    </AppShell>
  );
}
