"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Echo landing page: converted from static HTML to a React + TSX    */
/*  component. Drop it into any React project (Vite, CRA, Next.js     */
/*  client component, etc.): `import EchoLanding from "./EchoLanding"` */
/*  Next.js App Router: add "use client" as the first line.           */
/* ------------------------------------------------------------------ */

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Sora:wght@500;700;800&family=Manrope:wght@400;500;700&display=swap";

const CSS = `
:root{--bg:#F5F7FA;--panel:#fff;--ink:#0A0E14;--mute:#58627A;--line:#DCE2EC;--g1:#00B87F;--g2:#0A8DE8;--g3:#E8307A;--onG:#06100C;--gr:linear-gradient(100deg,var(--g1),var(--g2) 55%,var(--g3));
box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#06080C;--panel:#0E1219;--ink:#EEF2F7;--mute:#8A94A6;--line:#1B2230;--g1:#22F2A9;--g2:#2DB6FF;--g3:#FF4F9A}}
:root[data-theme="dark"]{--bg:#06080C;--panel:#0E1219;--ink:#EEF2F7;--mute:#8A94A6;--line:#1B2230;--g1:#22F2A9;--g2:#2DB6FF;--g3:#FF4F9A}
*,*::before,*::after{box-sizing:border-box}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;background:var(--bg);color:var(--ink);font:400 1.06rem/1.6 Manrope,system-ui,sans-serif;overflow-x:hidden;transition:background .4s}
h1,h2,h3{font-family:Sora,Manrope,system-ui,sans-serif;font-weight:800;margin:0;letter-spacing:-.04em;line-height:1.04}
a{color:inherit}
:focus-visible{outline:3px solid var(--g2);outline-offset:3px}
#fx{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
main,nav{position:relative;z-index:2}
#bar{position:fixed;top:0;left:0;height:3px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--gr);z-index:30}
#cur{display:none}
html.hc *{cursor:none!important}
html.hc #cur{display:block}
#cur i,#cur b{position:fixed;left:0;top:0;z-index:40;pointer-events:none;border-radius:50%;mix-blend-mode:difference;background:#fff}
#cur i{width:8px;height:8px;margin:-4px}
#cur b{width:38px;height:38px;margin:-19px;background:none;border:1.5px solid #fff;transition:width .25s,height .25s,margin .25s,background .25s}
#cur.h b{width:70px;height:70px;margin:-35px;background:#fff}
nav{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;gap:22px;padding:calc(16px + env(safe-area-inset-top,0px)) max(24px,calc((100vw - 1120px)/2)) 16px;z-index:20;backdrop-filter:blur(14px);background:color-mix(in srgb,var(--bg) 60%,transparent)}
.logo{font:800 1.5rem Sora,sans-serif;text-decoration:none;margin-right:auto;letter-spacing:-.05em;display:flex;gap:9px;align-items:center}
.logo i{width:20px;height:20px;border-radius:50%;background:var(--gr);box-shadow:0 0 0 5px color-mix(in srgb,var(--g1) 25%,transparent)}
nav a.l{text-decoration:none;color:var(--mute);font-weight:500}
nav a.l:hover{color:var(--ink)}
.tm{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--panel);color:var(--ink);cursor:pointer;display:grid;place-items:center;font-size:1.05rem;padding:0}
.btn{display:inline-block;background:var(--gr);color:var(--onG);padding:16px 30px;border-radius:99px;font:800 1rem Sora,sans-serif;letter-spacing:-.02em;text-decoration:none;border:0;cursor:pointer;will-change:transform}
.btn.o{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--line)}
.in{max-width:1120px;margin:0 auto;padding:0 24px}
.hero{min-height:100svh;display:flex;flex-direction:column;justify-content:center;padding-top:90px}
h1{font-size:clamp(2.8rem,9.4vw,8.2rem);max-width:10.5ch}
.hero .ln{display:block;overflow:hidden;padding-bottom:.08em}
.hero .ln span{display:inline-block;transform:translateY(110%);animation:up 1.1s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:var(--d)}
.g{background:var(--gr);-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes up{to{transform:none}}
.hero p{max-width:50ch;color:var(--mute);font-size:1.2rem;margin:30px 0 34px;opacity:0;animation:fi 1s .9s forwards}
.cta{display:flex;gap:14px;flex-wrap:wrap;opacity:0;animation:fi 1s 1.1s forwards}
.chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:36px;opacity:0;animation:fi 1s 1.3s forwards}
.chips span{border:1px solid var(--line);border-radius:99px;padding:7px 16px;font-size:.92rem;color:var(--mute);background:color-mix(in srgb,var(--panel) 70%,transparent)}
@keyframes fi{to{opacity:1}}
.scroll{position:absolute;bottom:26px;left:50%;color:var(--mute);font-size:.85rem}
.scene{position:relative}
.stick{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;display:flex;align-items:center}
#call{height:480vh}#feat{height:420vh}#nobot{height:340vh}
.two{display:grid;grid-template-columns:1fr 1.2fr;gap:48px;align-items:center;width:100%}
.caps{position:relative;height:250px}
.cp{position:absolute;inset:0;opacity:0;transform:translateY(34px);transition:opacity .6s,transform .6s}
.cp.on{opacity:1;transform:none}
.cp small{color:var(--mute);font-weight:700}
.cp h2{font-size:clamp(1.9rem,4vw,3.3rem);margin:10px 0 14px}
.cp p{color:var(--mute);max-width:40ch;margin:0}
.win{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:16px;box-shadow:0 50px 100px -40px rgba(0,0,0,.6);transform:perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .25s}
.wb{display:flex;gap:7px;align-items:center;font-size:.8rem;color:var(--mute);margin-bottom:14px}
.wb i{width:11px;height:11px;border-radius:50%;background:var(--line)}
.wb b{margin-left:auto;color:#ff4d6d;font-weight:700}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.tl{aspect-ratio:4/3;border-radius:14px;background:color-mix(in srgb,var(--ink) 6%,var(--panel));display:grid;place-items:center;position:relative}
.tl span{width:46px;height:46px;border-radius:50%;background:var(--gr);display:grid;place-items:center;font:800 1.1rem Sora;color:var(--onG)}
.tl em{position:absolute;left:10px;bottom:8px;font-style:normal;font-size:.75rem;color:var(--mute)}
[data-st]{opacity:0;transform:translateY(18px);transition:opacity .6s,transform .6s}
[data-st].on{opacity:1;transform:none}
.nb{display:inline-block;margin:12px 0 0;font-size:.85rem;font-weight:700;color:var(--g1);border:1px solid var(--g1);border-radius:99px;padding:3px 12px}
.wave{display:flex;gap:3px;align-items:center;height:44px;margin-top:12px}
.wave i{flex:1;border-radius:3px;background:var(--gr);animation:wv 1.2s ease-in-out infinite}
@keyframes wv{0%,100%{height:12%}50%{height:100%}}
.trn{list-style:none;margin:10px 0 0;padding:0;font-size:.9rem}
.trn li{padding:7px 0;border-top:1px solid var(--line)}
.trn b{color:var(--g2);margin-right:6px}
.out{display:grid;gap:8px;margin-top:10px}
.out div{border-radius:12px;padding:10px 14px;font-size:.88rem;background:color-mix(in srgb,var(--g1) 12%,transparent)}
.out div:nth-child(2){background:color-mix(in srgb,var(--g2) 14%,transparent)}.out div:nth-child(3){background:color-mix(in srgb,var(--g3) 14%,transparent)}
.out b{margin-right:6px}
.tcode{position:absolute;left:24px;right:24px;bottom:calc(26px + env(safe-area-inset-bottom,0px));display:flex;gap:14px;align-items:center;color:var(--mute);font-size:.85rem;font-variant-numeric:tabular-nums}
.tcode u{flex:1;height:3px;background:var(--line);border-radius:3px;position:relative;text-decoration:none}
.tcode u::after{content:"";position:absolute;inset:0;background:var(--gr);border-radius:3px;transform-origin:0 50%;transform:scaleX(var(--p,0))}
.track{display:flex;width:400vw;transform:translateX(calc(var(--p,0)*-300vw));will-change:transform}
.pan{width:100vw;padding:0 max(24px,calc((100vw - 1120px)/2));display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.pan h2{font-size:clamp(2rem,5vw,4rem);margin-bottom:16px}
.pan p{color:var(--mute);max-width:42ch;margin:0}
.card{background:radial-gradient(420px circle at var(--mx,50%) var(--my,0%),color-mix(in srgb,var(--g2) 22%,transparent),transparent 60%),var(--panel);border:1px solid var(--line);border-radius:26px;padding:26px;min-height:300px}
.card li{list-style:none;padding:12px 0;border-top:1px solid var(--line)}
.card ul{margin:0;padding:0}
.card li:first-child{border:0}
.live{color:#ff4d6d;font-weight:800;font-size:.85rem}
.q{background:color-mix(in srgb,var(--g2) 18%,transparent);border-radius:16px 16px 4px 16px;padding:12px 16px;margin:0 0 12px auto;width:fit-content;max-width:90%}
.a{background:color-mix(in srgb,var(--ink) 7%,transparent);border-radius:16px 16px 16px 4px;padding:12px 16px;width:fit-content;max-width:94%}
.a small{display:block;color:var(--mute);margin-top:6px}
.mq{overflow:hidden;white-space:nowrap;padding:60px 0;font:800 clamp(3rem,11vw,9rem)/1 Sora,sans-serif;letter-spacing:-.05em}
.mq div{display:inline-block;transform:translateX(calc(var(--sy,0)*-9vw));-webkit-text-stroke:2px var(--ink);color:transparent}
.mq div span{color:var(--ink);-webkit-text-stroke:0}
.rv{font:800 clamp(1.8rem,4.2vw,3.5rem)/1.18 Sora,sans-serif;letter-spacing:-.04em;max-width:17ch}
.rv .w{color:color-mix(in srgb,var(--ink) 20%,transparent);transition:color .3s}
.rv .w.l{color:var(--ink)}
.ro{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:8px 22px}
.p{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--line)}
.p:last-child{border:0}
.av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:var(--gr);color:var(--onG)}
.p em{margin-left:auto;font-style:normal;font-size:.85rem;color:var(--mute)}
.bot{opacity:calc(1 - var(--p,0)*2.4);transform:translateX(calc(var(--p,0)*120px));filter:blur(calc(var(--p,0)*8px))}
.bot .av{background:#ff4d6d;color:#fff}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;padding:90px 0}
.stats strong{display:block;font:800 clamp(2.6rem,6vw,4.8rem)/1 Sora,sans-serif;letter-spacing:-.05em;background:var(--gr);-webkit-background-clip:text;background-clip:text;color:transparent}
.stats span{color:var(--mute)}
.att{padding:110px 0}
.att h2{font-size:clamp(2.2rem,6vw,5rem);max-width:12ch;margin-bottom:16px}
.att .sub{color:var(--mute);max-width:50ch;margin:0 0 44px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;counter-reset:s}
.st{counter-increment:s}
.st::before{content:counter(s);display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--gr);color:var(--onG);font:800 1.1rem Sora;margin-bottom:16px}
.st h3{font-size:1.3rem;margin-bottom:8px}.st p{margin:0 0 16px;color:var(--mute)}
.cpy{font:500 .92rem Manrope,sans-serif;background:var(--bg);color:var(--ink);border:1.5px dashed var(--mute);border-radius:10px;padding:9px 13px;cursor:pointer}
footer{padding:30px 0 40px;color:var(--mute);font-size:.92rem;border-top:1px solid var(--line)}
footer .in{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
@media(max-width:820px){.two,.pan{grid-template-columns:1fr;gap:20px}.caps{height:210px}.stats{grid-template-columns:1fr 1fr}.steps{grid-template-columns:1fr}nav a.l{display:none}.pan .card{min-height:0;padding:18px}.tiles .tl:nth-child(3){display:none}.tiles{grid-template-columns:1fr 1fr}.scroll{display:none}}
html.rm .scene{height:auto!important}
html.rm .stick{position:static;height:auto;padding:80px 0;overflow:visible}
html.rm [data-st],html.rm .cp{opacity:1;transform:none;position:static}
html.rm .caps{height:auto}
html.rm .track{width:auto;flex-direction:column;transform:none;gap:60px}
html.rm .pan{width:auto}
html.rm .rv .w{color:var(--ink)}
html.rm .hero .ln span{transform:none;animation:none}html.rm .hero p,html.rm .cta,html.rm .chips{opacity:1;animation:none}
`;

const REVEAL_TEXT =
  "Other tools send a bot into your call. Echo sends nothing. It listens through your own browser, so your participant list stays exactly the way it was.";

type Theme = "dark" | "light";
type Dyn = React.CSSProperties & Record<`--${string}`, string | number>;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ---------- Animated number (counts up when scrolled into view) ---------- */
interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  reduced: boolean;
}

function CountUp({ value, decimals = 0, prefix = "", suffix = "", reduced }: CountUpProps) {
  const ref = useRef<HTMLElement>(null);
  const [text, setText] = useState(`${prefix}${(0).toFixed(decimals)}${suffix}`);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        const t0 = performance.now();
        const frame = (t: number) => {
          const k = reduced ? 1 : clamp01((t - t0) / 1400);
          const e = 1 - Math.pow(1 - k, 3);
          setText(`${prefix}${(value * e).toFixed(decimals)}${suffix}`);
          if (k < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, decimals, prefix, suffix, reduced]);

  return <strong ref={ref}>{text}</strong>;
}

/* ------------------------------ Main page ------------------------------ */
export default function EchoLanding() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [copied, setCopied] = useState(false);
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  const callRef = useRef<HTMLElement>(null);
  const featRef = useRef<HTMLElement>(null);
  const nobotRef = useRef<HTMLElement>(null);
  const colorsRef = useRef<string[]>(["#22F2A9", "#2DB6FF", "#FF4F9A"]);

  /* Restore saved theme on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("echo-theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  /* Apply theme to <html> and refresh canvas colours */
  useEffect(() => {
    const d = document.documentElement;
    d.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("echo-theme", theme);
    } catch {
      /* ignore */
    }
    const s = getComputedStyle(d);
    colorsRef.current = ["--g1", "--g2", "--g3"].map((v) => s.getPropertyValue(v).trim());
  }, [theme]);

  /* Reduced-motion class on <html> */
  useEffect(() => {
    const d = document.documentElement;
    if (reduced) d.classList.add("rm");
    return () => d.classList.remove("rm");
  }, [reduced]);

  /* All scroll / pointer / canvas behaviour */
  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const cv = canvasRef.current;
    const bar = barRef.current;
    const cur = curRef.current;
    const win = winRef.current;
    const tc = tcRef.current;
    if (!root || !cv || !bar || !cur || !win || !tc) return;

    const d = document.documentElement;
    const fine = matchMedia("(pointer: fine)").matches;
    const caps = root.querySelectorAll<HTMLElement>(".cp");
    const sts = root.querySelectorAll<HTMLElement>("[data-st]");
    const words = root.querySelectorAll<HTMLElement>("#rv .w");
    const ring = cur.querySelector("b") as HTMLElement;
    const dot = cur.querySelector("i") as HTMLElement;
    const g = cv.getContext("2d")!;

    interface Scene {
      el: HTMLElement;
      p: number;
      f: (p: number) => void;
    }
    const scenes: Scene[] = [
      {
        el: callRef.current!,
        p: 0,
        f: (p) => {
          const i = Math.min(3, Math.floor(p * 4));
          caps.forEach((c, k) => c.classList.toggle("on", k === i));
          sts.forEach((s) => s.classList.toggle("on", Number(s.dataset.st) <= i + 1));
          const s = Math.round(p * 306);
          tc.textContent = ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + (s % 60)).slice(-2);
        },
      },
      { el: featRef.current!, p: 0, f: () => {} },
      {
        el: nobotRef.current!,
        p: 0,
        f: (p) => {
          const n = Math.floor(clamp01((p - 0.08) / 0.6) * words.length * 1.02);
          words.forEach((w, k) => w.classList.toggle("l", k < n));
        },
      },
    ];

    let mx = innerWidth / 2,
      my = innerHeight / 2,
      cx = mx,
      cy = my,
      lx = 0,
      ly = 0;
    let rp: { x: number; y: number; r: number; a: number }[] = [];
    const dpr = Math.min(2, devicePixelRatio || 1);
    let H = innerHeight,
      Wd = innerWidth,
      sy = 0,
      vel = 0,
      ps = 0;

    if (fine) d.classList.add("hc");

    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      cur.classList.toggle("h", !!t?.closest("a,button,input"));
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      if (Math.hypot(mx - lx, my - ly) > 46) {
        lx = mx;
        ly = my;
        rp.push({ x: mx, y: my, r: 6, a: 0.7 });
      }
      const t = e.target as Element | null;
      const c = t?.closest<HTMLElement>(".card");
      if (c) {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", e.clientX - r.left + "px");
        c.style.setProperty("--my", e.clientY - r.top + "px");
      }
      const w = win.getBoundingClientRect();
      if (e.clientX > w.left - 100 && e.clientX < w.right + 100 && e.clientY > w.top - 100 && e.clientY < w.bottom + 100) {
        win.style.setProperty("--ry", ((e.clientX - w.left) / w.width - 0.5) * 10 + "deg");
        win.style.setProperty("--rx", -((e.clientY - w.top) / w.height - 0.5) * 8 + "deg");
      } else {
        win.style.setProperty("--ry", "0deg");
        win.style.setProperty("--rx", "0deg");
      }
    };
    const onDown = (e: PointerEvent) => {
      for (let k = 0; k < 3; k++) rp.push({ x: e.clientX, y: e.clientY, r: -k * 14, a: 0.9 });
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerdown", onDown);

    /* Magnetic buttons */
    const cleanups: (() => void)[] = [];
    root.querySelectorAll<HTMLElement>("[data-mag]").forEach((b) => {
      const move = (e: PointerEvent) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px,${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
      };
      const leave = () => {
        b.style.transform = "";
      };
      b.addEventListener("pointermove", move);
      b.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        b.removeEventListener("pointermove", move);
        b.removeEventListener("pointerleave", leave);
      });
    });

    const resize = () => {
      Wd = innerWidth;
      H = innerHeight;
      cv.width = Wd * dpr;
      cv.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);

    let raf = 0;
    const loop = (t: number) => {
      const cs = colorsRef.current;
      sy = scrollY;
      vel += (Math.abs(sy - ps) - vel) * 0.1;
      ps = sy;
      d.style.setProperty("--sy", (sy / H).toFixed(3));
      bar.style.transform = `scaleX(${clamp01(sy / (d.scrollHeight - H))})`;

      scenes.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        const tot = s.el.offsetHeight - H;
        const tp = clamp01(-r.top / tot);
        s.p += (tp - s.p) * 0.14;
        s.el.style.setProperty("--p", s.p.toFixed(4));
        s.f(tp);
      });

      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      ring.style.transform = `translate(${cx}px,${cy}px)`;

      g.clearRect(0, 0, Wd, H);
      const hero = clamp01(1 - sy / (H * 0.9));
      const n = Math.floor(Wd / 14);
      const gr = g.createLinearGradient(0, 0, Wd, 0);
      gr.addColorStop(0, cs[0]);
      gr.addColorStop(0.55, cs[1]);
      gr.addColorStop(1, cs[2]);
      g.fillStyle = gr;
      g.globalAlpha = 0.1 + 0.5 * hero;
      for (let i = 0; i < n; i++) {
        const x = i * 14 + 4;
        const near = Math.exp(-Math.pow((x - mx) / 150, 2));
        const h =
          14 + Math.abs(Math.sin(i * 0.35 + t / 700) * Math.cos(i * 0.13 - t / 1100)) * H * 0.16 + near * H * 0.2 + vel * 1.6;
        g.fillRect(x, H - h * (0.35 + 0.65 * hero), 6, h * (0.35 + 0.65 * hero));
      }
      g.globalAlpha = 1;
      g.strokeStyle = gr;
      g.lineWidth = 1.5;
      rp = rp.filter((p) => {
        p.r += 3.2;
        p.a *= 0.962;
        if (p.r > 0) {
          g.globalAlpha = p.a * 0.8;
          g.beginPath();
          g.arc(p.x, p.y, p.r, 0, 6.283);
          g.stroke();
        }
        return p.a > 0.02;
      });
      g.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
      cleanups.forEach((fn) => fn());
      d.classList.remove("hc");
      d.style.removeProperty("--sy");
    };
  }, [reduced]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const copyExtensions = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    };
    try {
      navigator.clipboard.writeText("chrome://extensions").then(done, done);
    } catch {
      done();
    }
  };

  const delay = (s: string): Dyn => ({ "--d": s });

  return (
    <div ref={rootRef}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_URL} rel="stylesheet" />
      <style>{CSS}</style>

      <canvas id="fx" ref={canvasRef} aria-hidden="true" />
      <div id="bar" ref={barRef} />
      <div id="cur" ref={curRef} aria-hidden="true">
        <b />
        <i />
      </div>

      <nav>
        <a className="logo" href="#top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={30} height={30} style={{ borderRadius: 8 }} />
          echo
        </a>
        <a className="l" href="#call">How it works</a>
        <a className="l" href="#nobot">No bot</a>
        <a className="l" href="#attach">Attach</a>
        <Link className="l" href="/dashboard">Dashboard</Link>
        <button className="tm" id="tm" type="button" aria-label="Switch light or dark mode" onClick={toggleTheme}>
          ◐
        </button>
      </nav>

      <main>
        <header className="hero in" id="top">
          <h1>
            <span className="ln"><span style={delay(".1s")}>Be in the</span></span>
            <span className="ln"><span style={delay(".2s")}>meeting.</span></span>
            <span className="ln"><span className="g" style={delay(".35s")}>Echo takes</span></span>
            <span className="ln"><span className="g" style={delay(".45s")}>the notes.</span></span>
          </h1>
          <p>
            Echo listens to the audio of your Google Meet tab, turns it into a transcript in seconds, then hands you the
            summary, the decisions and who owes what. No bot ever joins your call.
          </p>
          <div className="cta">
            <Link className="btn" data-mag href="/dashboard">Open Dashboard</Link>
            <a className="btn o" data-mag href="#call">Watch it work</a>
          </div>
          <div className="chips">
            <span>No bot in the call</span>
            <span>Notes in under 10 seconds</span>
            <span>Runs in your browser</span>
          </div>
          <div className="scroll">Scroll</div>
        </header>

        <section className="scene" id="call" ref={callRef}>
          <div className="stick">
            <div className="in two">
              <div className="caps">
                <div className="cp"><small>Step 1</small><h2>Open Meet. Press record.</h2><p>Echo taps the audio your tab is already playing and notices who is speaking.</p></div>
                <div className="cp"><small>Step 2</small><h2>Audio leaves in 5-second pieces.</h2><p>You keep talking. Echo streams the sound out while a live badge shows in your dashboard.</p></div>
                <div className="cp"><small>Step 3</small><h2>Every word, with a name on it.</h2><p>Whisper Large-v3 turns speech into a transcript, line by line, speaker by speaker.</p></div>
                <div className="cp"><small>Step 4</small><h2>Then the notes write themselves.</h2><p>A summary, the key decisions, and action items with owners and deadlines.</p></div>
              </div>

              <div className="win" id="win" ref={winRef}>
                <div className="wb">
                  <i /><i /><i />&nbsp;meet.google.com · Weekly build sync<b data-st="1">● REC</b>
                </div>
                <div className="tiles">
                  <div className="tl"><span>A</span><em>Aryan</em></div>
                  <div className="tl"><span>R</span><em>Riddhima</em></div>
                  <div className="tl"><span>K</span><em>Ritika</em></div>
                </div>
                <span className="nb" data-st="1">No bot in the call</span>
                <div className="wave" data-st="2">
                  {Array.from({ length: 44 }, (_, i) => (
                    <i key={i} style={{ animationDelay: `${-i * 0.11}s` }} />
                  ))}
                </div>
                <ul className="trn" data-st="3">
                  <li><b>Aryan</b>Since we have an entire city to build, these houses need to go up fast.</li>
                  <li><b>Riddhima</b>Let&apos;s send in reinforcements so we can finish the roof.</li>
                </ul>
                <div className="out" data-st="4">
                  <div><b>Summary</b>Team agreed to speed up the roof work.</div>
                  <div><b>Decision</b>Send reinforcements now.</div>
                  <div><b>Action</b>Roof crew starts Monday. Owner: Aryan.</div>
                </div>
              </div>
            </div>
            <div className="tcode">
              <span ref={tcRef}>00:00</span>
              <u />
              <span>05:06</span>
            </div>
          </div>
        </section>

        <div className="mq" aria-hidden="true">
          <div>
            Transcribe <span>Summarize</span> Decide <span>Remember</span> Transcribe <span>Summarize</span> Decide
          </div>
        </div>

        <section className="scene" id="feat" ref={featRef}>
          <div className="stick">
            <div className="track">
              <div className="pan">
                <div>
                  <h2>See it as it is said</h2>
                  <p>The transcript grows on your dashboard during the call, with speaker names and timestamps on every line.</p>
                </div>
                <div className="card">
                  <div className="live">● LIVE MEETING</div>
                  <ul>
                    <li><b>00:00</b> Since we have an entire city to build...</li>
                    <li><b>00:15</b> Let&apos;s send in reinforcements.</li>
                    <li><b>00:25</b> Agreed, roof crew starts Monday.</li>
                  </ul>
                </div>
              </div>
              <div className="pan">
                <div>
                  <h2>Decisions don&apos;t get lost</h2>
                  <p>Echo pulls out what was decided and what needs doing, with an owner and a deadline for each task.</p>
                </div>
                <div className="card">
                  <ul>
                    <li>✓ Send reinforcements now</li>
                    <li>☐ Roof crew starts Monday · Aryan</li>
                    <li>☐ Share the build plan · Riddhima · Friday</li>
                  </ul>
                </div>
              </div>
              <div className="pan">
                <div>
                  <h2>Ask your meeting</h2>
                  <p>Type a question in plain words. The answer comes with the part of the transcript it came from.</p>
                </div>
                <div className="card">
                  <div className="q">What did we decide about the roof?</div>
                  <div className="a">
                    You agreed to send in reinforcements so the roof gets finished.
                    <small>From the transcript at 00:15</small>
                  </div>
                </div>
              </div>
              <div className="pan">
                <div>
                  <h2>Every call, kept</h2>
                  <p>Open any past meeting to read the full transcript, summary and action items. Copy it with one click.</p>
                </div>
                <div className="card">
                  <ul>
                    <li>Weekly build sync · Oct 1, 6:38 PM</li>
                    <li>Design review · Sep 23, 11:20 PM</li>
                    <li>Standup · Sep 23, 11:19 PM</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="scene" id="nobot" ref={nobotRef}>
          <div className="stick">
            <div className="in two">
              <p className="rv" id="rv">
                {REVEAL_TEXT.split(" ").map((w, i, arr) => (
                  <React.Fragment key={i}>
                    <span className="w">{w}</span>
                    {i < arr.length - 1 ? " " : null}
                  </React.Fragment>
                ))}
              </p>
              <div className="ro">
                <div className="p"><span className="av">A</span>Aryan Kumar<em>Host</em></div>
                <div className="p"><span className="av">R</span>Riddhima Sinha<em /></div>
                <div className="p"><span className="av">K</span>Ritika Kushwaha<em /></div>
                <div className="p bot"><span className="av">B</span>Notetaker Bot<em>Waiting to be admitted</em></div>
              </div>
            </div>
          </div>
        </section>

        <div className="in stats">
          <div><CountUp value={6.3} decimals={1} suffix="s" reduced={reduced} /><span>to transcribe five minutes of speech</span></div>
          <div><CountUp value={4.2} decimals={1} suffix="%" reduced={reduced} /><span>word error rate with Whisper Large-v3</span></div>
          <div><CountUp value={67} prefix="+" suffix=" MB" reduced={reduced} /><span>extra browser memory while recording</span></div>
          <div><CountUp value={0} reduced={reduced} /><span>bots in your participant list</span></div>
        </div>

        <section className="att in" id="attach">
          <h2>Attach Echo in three steps</h2>
          <p className="sub">
            Takes about two minutes, once. Tell the people on your call that you are recording, as you would with any recorder.
          </p>
          <div className="steps">
            <div className="card st">
              <h3>Download</h3>
              <p>Get the extension files from the project page.</p>
              <Link className="btn" data-mag href="/developer">Install Guide</Link>
            </div>
            <div className="card st">
              <h3>Load it</h3>
              <p>Open the extensions page, turn on Developer mode, then choose Load unpacked.</p>
              <button className="cpy" id="cpy" type="button" onClick={copyExtensions}>
                {copied ? "Copied. Paste in a new tab" : "Copy chrome://extensions"}
              </button>
            </div>
            <div className="card st">
              <h3>Attach to a call</h3>
              <p>Open Google Meet, click Echo and start recording. Stop when you are done and open your dashboard.</p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="in">
          <span>Echo, built by Aryan Kumar, Riddhima Sinha and Ritika Kushwaha.</span>
          <Link href="/dashboard">Go to Dashboard</Link>
        </div>
      </footer>
    </div>
  );
}