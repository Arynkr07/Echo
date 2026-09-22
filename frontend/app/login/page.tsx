"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function EchoAuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setLoading(true);

    try {
      if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setStatusMsg({ type: "success", text: "Reset link sent! Please check your email inbox." });
      } else if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message.replace("Firebase: ", "") });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setStatusMsg(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message.replace("Firebase: ", "") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#1b2b23] flex flex-col justify-between font-sans antialiased">
      <nav className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
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
            API Endpoints ⚡
          </Link>
          <a
            href="https://github.com/Arynkr07/Echo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#466556] hover:text-[#1e6144] transition"
          >
            GitHub ↗
          </a>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md bg-white border border-[#e2eae5] rounded-3xl p-8 sm:p-10 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#e8f3ed] text-[#1e6144] flex items-center justify-center font-bold text-xl mb-3 border border-[#cde4d7]">
              {mode === "forgot" ? "🔑" : "⊞"}
            </div>
            <h1 className="text-2xl font-bold text-[#163a2b] tracking-tight">
              {mode === "signin" && "Welcome Back"}
              {mode === "signup" && "Create ECHO Account"}
              {mode === "forgot" && "Reset Password"}
            </h1>
            <p className="text-xs text-[#718b7f] mt-1">
              {mode === "signin" && "Sign in to access your live meeting companion"}
              {mode === "signup" && "Get started with non-intrusive meeting intelligence"}
              {mode === "forgot" && "We will email you a secure recovery link"}
            </p>
          </div>

          {statusMsg && (
            <div
              className={`mb-4 p-3 border text-xs rounded-xl ${
                statusMsg.type === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-emerald-50 border-emerald-200 text-[#1e6144]"
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full mb-4 bg-white border border-[#dce6e1] hover:border-[#1e6144] text-[#163a2b] font-medium py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
              >
                <span>Continue with Google</span>
              </button>
              <div className="flex items-center gap-2 mb-4">
                <hr className="flex-1 border-[#edf2ef]" />
                <span className="text-[10px] text-[#8fa298] uppercase">or with email</span>
                <hr className="flex-1 border-[#edf2ef]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#466556] mb-1.5">Workspace Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#f8faf9] border border-[#dce6e1] rounded-2xl px-4 py-3 text-sm text-[#163a2b] focus:outline-none focus:border-[#1e6144] focus:bg-white transition"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#466556]">Password</label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setStatusMsg(null); }}
                      className="text-[11px] text-[#1e6144] hover:underline font-medium cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#f8faf9] border border-[#dce6e1] rounded-2xl px-4 py-3 text-sm text-[#163a2b] focus:outline-none focus:border-[#1e6144] focus:bg-white transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#1e6144] hover:bg-[#164d36] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md shadow-[#1e6144]/15 cursor-pointer disabled:opacity-60"
            >
              {loading
                ? "Processing..."
                : mode === "signin"
                ? "Sign In to Dashboard →"
                : mode === "signup"
                ? "Create Account →"
                : "Send Password Reset Link →"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#718b7f]">
            {mode === "signin" && (
              <>
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setStatusMsg(null); }}
                  className="text-[#1e6144] font-semibold hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setStatusMsg(null); }}
                  className="text-[#1e6144] font-semibold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => { setMode("signin"); setStatusMsg(null); }}
                className="text-[#1e6144] font-semibold hover:underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-[11px] text-[#718b7f] border-t border-[#e2eae5]">
        © 2026 ECHO Workspace Intelligence. Powered by Whisper STT & Firebase Auth.
      </footer>
    </div>
  );
}
