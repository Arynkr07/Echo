"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Sora:wght@500;700;800&family=Manrope:wght@400;500;700&display=swap";

/** Shared page frame: landing-style nav, theme toggle and glow background. */
export default function AppShell({
  active,
  onSignOut,
  children,
}: {
  active?: "dashboard" | "history" | "developer";
  onSignOut?: () => void;
  children: React.ReactNode;
}) {
  const curRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState("M");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Sync user name
  useEffect(() => {
    const updateName = () => {
      const saved = localStorage.getItem("echo_username");
      if (saved) {
        setUserName(saved);
      }
    };
    updateName();
    
    // Listen to custom event for name updates across components
    window.addEventListener("echo_name_changed", updateName);
    
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !localStorage.getItem("echo_username")) {
        setUserName(u.displayName || u.email?.split("@")[0] || "Member");
      }
    });
    
    return () => {
      window.removeEventListener("echo_name_changed", updateName);
      unsub();
    };
  }, []);

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const v = editValue.trim();
    if (v) {
      setUserName(v);
      localStorage.setItem("echo_username", v);
      window.dispatchEvent(new Event("echo_name_changed"));
    }
    setIsEditing(false);
    setMenuOpen(false);
  };

  /* Same ring + dot cursor as the landing page (mouse devices only) */
  useEffect(() => {
    const cur = curRef.current;
    if (!cur || !matchMedia("(pointer: fine)").matches) return;
    const d = document.documentElement;
    const ring = cur.querySelector("b") as HTMLElement;
    const dot = cur.querySelector("i") as HTMLElement;
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, raf = 0;
    d.classList.add("ec-hc");
    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
    };
    const over = (e: PointerEvent) => {
      cur.classList.toggle("h", !!(e.target as Element | null)?.closest("a,button,input"));
    };
    const loop = () => {
      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      ring.style.transform = `translate(${cx}px,${cy}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerover", over);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      d.classList.remove("ec-hc");
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("echo-theme");
      document.documentElement.setAttribute("data-theme", saved === "light" ? "light" : "dark");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = () => {
    const d = document.documentElement;
    const next = d.getAttribute("data-theme") === "light" ? "dark" : "light";
    d.setAttribute("data-theme", next);
    try {
      localStorage.setItem("echo-theme", next);
    } catch {
      /* ignore */
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".ec-dropdown-wrap")) {
        setMenuOpen(false);
        setIsEditing(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, [menuOpen]);

  return (
    <div className="ec">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_URL} rel="stylesheet" />
      <div className="ec-glow" aria-hidden="true" />
      <div className="ec-cur" ref={curRef} aria-hidden="true">
        <b />
        <i />
      </div>
      <nav className="ec-nav">
        <Link className="ec-logo" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={30} height={30} style={{ borderRadius: 8 }} />
          echo
        </Link>
        <Link className={`ec-link ${active === "dashboard" ? "on" : ""}`} href="/dashboard">Dashboard</Link>
        <Link className={`ec-link ${active === "history" ? "on" : ""}`} href="/dashboard/history">History</Link>
        <Link className={`ec-link hide ${active === "developer" ? "on" : ""}`} href="/developer">Install</Link>
        
        <div style={{ marginLeft: "auto", display: "flex", gap: "14px", alignItems: "center" }}>
          <button className="ec-tm" type="button" aria-label="Switch light or dark mode" onClick={toggle}>◐</button>
          
          {onSignOut && (
            <div className="ec-dropdown-wrap">
              <button 
                className="ec-avatar" 
                onClick={() => { setMenuOpen(!menuOpen); setIsEditing(false); }}
                title="Profile options"
              >
                {userName.charAt(0)}
              </button>
              
              {menuOpen && (
                <div className="ec-dropdown">
                  {isEditing ? (
                    <form onSubmit={handleSaveName} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input 
                        className="ec-in" 
                        style={{ padding: "8px 12px", fontSize: "0.9rem" }}
                        autoFocus 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)} 
                        placeholder="Your name"
                      />
                      <button type="submit" className="ec-btn" style={{ padding: "8px", fontSize: "0.85rem" }}>Save</button>
                    </form>
                  ) : (
                    <>
                      <div style={{ padding: "4px 12px 10px", fontSize: "0.85rem", color: "var(--mute)", borderBottom: "1px solid var(--line)", marginBottom: "4px" }}>
                        Signed in as <b>{userName}</b>
                      </div>
                      <button onClick={() => { setIsEditing(true); setEditValue(userName); }}>
                        Rename profile
                      </button>
                      <button onClick={onSignOut} style={{ color: "#ff4d6d" }}>
                        Sign out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}
