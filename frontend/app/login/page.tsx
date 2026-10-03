"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import AppShell from "../components/AppShell";

type Mode = "signin" | "signup" | "forgot";

export default function EchoAuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fail = (err: unknown) =>
    setMsg({
      type: "error",
      text: (err instanceof Error ? err.message : "Something went wrong").replace("Firebase: ", ""),
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setMsg({ type: "success", text: "Reset link sent. Check your inbox." });
      } else if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
      }
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setMsg(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  };

  const go = (m: Mode) => {
    setMode(m);
    setMsg(null);
  };

  return (
    <AppShell>
      <div className="ec-auth">
        <div className="ec-card">
          <h1 style={{ fontSize: "2.2rem", marginBottom: 8 }}>
            {mode === "signin" && (
              <>Welcome <span className="ec-g">back.</span></>
            )}
            {mode === "signup" && (
              <>Create your <span className="ec-g">account.</span></>
            )}
            {mode === "forgot" && (
              <>Reset <span className="ec-g">password.</span></>
            )}
          </h1>
          <p style={{ color: "var(--mute)", margin: "0 0 22px" }}>
            {mode === "signin" && "Sign in to see your meetings."}
            {mode === "signup" && "Takes ten seconds. No bot will ever join your call."}
            {mode === "forgot" && "We will email you a recovery link."}
          </p>

          {msg && <div className={`ec-msg ${msg.type}`}>{msg.text}</div>}

          {mode !== "forgot" && (
            <>
              <button type="button" className="ec-btn o" style={{ width: "100%", marginBottom: 14 }} onClick={google} disabled={loading}>
                Continue with Google
              </button>
              <p style={{ textAlign: "center", color: "var(--mute)", fontSize: ".85rem", margin: "0 0 14px" }}>or with email</p>
            </>
          )}

          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <div>
              <label className="ec-label">Email</label>
              <input className="ec-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="ec-label">Password</label>
                <input className="ec-in" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                {mode === "signin" && (
                  <button type="button" className="ec-link" style={{ fontSize: ".85rem", marginTop: 8 }} onClick={() => go("forgot")}>
                    Forgot password?
                  </button>
                )}
              </div>
            )}
            <button className="ec-btn" type="submit" disabled={loading}>
              {loading ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "var(--mute)", fontSize: ".9rem", marginTop: 20 }}>
            {mode === "signin" && (
              <>New here? <button type="button" className="ec-link" onClick={() => go("signup")}>Sign up</button></>
            )}
            {mode === "signup" && (
              <>Have an account? <button type="button" className="ec-link" onClick={() => go("signin")}>Sign in</button></>
            )}
            {mode === "forgot" && (
              <button type="button" className="ec-link" onClick={() => go("signin")}>← Back to sign in</button>
            )}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
