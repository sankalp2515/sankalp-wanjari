"use client";

// HELIOS preloader — a "system coming online" boot screen: a 3D fresnel
// core (see PreloaderScene) warming from sky to gold as a short boot log
// counts to 100%, then a gold flash and a clip-path wipe hand off to the
// site.
//
// The visual design is the supplied preloader, unchanged. What this file
// adds is the integration this app needs, and which the standalone
// component had no way to know about:
//
//   • Shown ONCE per session — gated on safeSession "booted", which is set
//     on *completion*, not eagerly (eager-set made StrictMode's
//     double-effect skip the loader in dev).
//   • safeSession never throws — raw sessionStorage throws in
//     storage-blocked browsers (Brave Shields / private mode) and would
//     leave the site stuck on boot. It degrades to an in-memory flag.
//   • Reduced-motion users skip it entirely.
//   • That gate is read through useSyncExternalStore, so the server and the
//     hydrating client render agree (reading sessionStorage directly during
//     render would be a hydration mismatch).
//   • The Three.js scene is dynamically imported (ssr:false), so the
//     overlay — name, boot log, progress — paints immediately and the 3D
//     core streams in behind it. Boot never blocks on the 3D bundle.
//   • Boot-log facts and brand strings come from config, never literals,
//     so they can't drift into fiction as the stack changes.
//   • Audio uses one lazily-created, resumed AudioContext. The original
//     minted a fresh AudioContext per sound; browsers cap those at ~6 per
//     page and never reclaim them, so the boot chime could permanently
//     consume the budget the tour's voice playback needs.
//   • The overlay unmounts at 'done' rather than sitting invisible at
//     opacity 0, which is what lets the scene's cleanup release the WebGL
//     context.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { personal } from "@/config/portfolio";
import { PROVIDERS } from "@/lib/llm/providers";
import { safeSession } from "@/lib/safeStorage";
import type { DeviceTier } from "./PreloaderScene";

const PreloaderScene = dynamic(() => import("./PreloaderScene"), { ssr: false });

export type { DeviceTier };

interface LoaderProps {
  onComplete?: (tier: DeviceTier) => void;
  brandTitle?: string;
  brandInitials?: string;
  roleTitle?: string;
}

// ── Audio ───────────────────────────────────────────────────────────────
// One shared context, created on first use and resumed if the autoplay
// policy suspended it. Silent no-op where Web Audio is unavailable.
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  } catch {
    return null;
  }
  return audioCtx;
}

const safePlaySound = (type: "chime" | "whoosh" | "hover") => {
  if (type === "hover") return; // reserved; the original had no hover tone
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    if (type === "chime") {
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.15);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(480, t + 0.2);
    }
    gain.gain.setValueAtTime(type === "chime" ? 0.08 : 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.25);
    // Release the nodes once they've rung out.
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    // Silent fail for non-audio environments
  }
};

// ── Boot log ────────────────────────────────────────────────────────────
// Every line is a REAL fact about this site, sourced from config where
// possible: runtime versions, the knowledge graph, the multi-provider
// orchestrator + its adaptive failover, and Helios (Ctrl+K).
const PROVIDER_CHAIN = PROVIDERS.map((p) => p.id).join(" → ");
const BOOT_SEQUENCE: { label: string; sub?: string }[] = [
  { label: "Spinning up runtime", sub: "next@16 · react@19" },
  { label: "Linking knowledge graph", sub: "nodes · edges · verified facts" },
  { label: "Arming orchestrator", sub: PROVIDER_CHAIN },
  { label: "Resolving failover order", sub: "adaptive self-reordering" },
  { label: "Helios online", sub: "concierge ready · Ctrl+K" },
];

const PROGRESS_TARGET = 100;
const STEP_MS = 520;
type Phase = "loading" | "ignition" | "flash" | "reveal" | "done";

// ── Session gate ────────────────────────────────────────────────────────
// Whether this page load should boot at all is a client-only fact
// (sessionStorage), so it can't be read during render without a hydration
// mismatch. useSyncExternalStore is the sanctioned way to express that:
// SSR and hydration both see the server snapshot (false → render nothing),
// then React re-reads on the client.
//
// The client snapshot is cached on first read for two reasons: getSnapshot
// must be stable across re-renders, and we set "booted" *during* the boot —
// an uncached read would flip to true mid-sequence and rip the overlay out
// mid-animation. Module state resets on a full page load, which is exactly
// the lifetime we want.
let bootAllowed: boolean | null = null;
const subscribeNever = () => () => {};
const getBootSnapshot = () => {
  if (bootAllowed === null) bootAllowed = safeSession.get("booted") !== "1";
  return bootAllowed;
};
const getServerBootSnapshot = () => false;

// Detected synchronously at mount so the scene is built once at the right
// budget. Building at 'high' and then rebuilding when a tier effect landed
// meant every boot allocated, then threw away, a full WebGL scene.
function detectTier(): DeviceTier {
  if (typeof navigator === "undefined") return "high";
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (cores <= 2 || (typeof mem === "number" && mem <= 2)) return "low";
  if (cores <= 4) return "medium";
  return "high";
}

export default function Loader({
  onComplete,
  brandTitle = personal.name,
  brandInitials = personal.shortName.charAt(0),
  roleTitle = personal.title,
}: LoaderProps = {}) {
  const reduced = useReducedMotion();
  const notBooted = useSyncExternalStore(subscribeNever, getBootSnapshot, getServerBootSnapshot);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [ignition, setIgnition] = useState(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [tier] = useState<DeviceTier>(detectTier);
  const completed = useRef(false);

  // Boot only on a fresh session, and never for reduced-motion users.
  const booting = notBooted && !reduced;

  // Fire onComplete exactly once, whether we booted or skipped.
  //
  // The skip path is deferred a frame on purpose. During hydration
  // useSyncExternalStore serves the server snapshot, so `booting` is false
  // for one commit even on a fresh session; firing immediately would report
  // "loader finished" before it had started. React applies the client
  // snapshot before the next frame, and the dep change cancels the pending
  // callback, so the deferred fire only survives when we genuinely skipped.
  useEffect(() => {
    if (completed.current) return;
    const fire = () => {
      completed.current = true;
      onComplete?.(tier);
    };
    if (phase === "done") return fire();
    if (booting) return;
    const id = requestAnimationFrame(fire);
    return () => cancelAnimationFrame(id);
  }, [booting, phase, onComplete, tier]);

  // Boot progress + log. Driven on rAF rather than a 20ms setInterval: the
  // original ticked 130 times through React state during boot regardless of
  // whether the browser could paint, which competed with the scene warming
  // up. rAF also self-throttles when backgrounded.
  useEffect(() => {
    if (!booting || phase !== "loading") return;

    const total = BOOT_SEQUENCE.length;
    const perStep = PROGRESS_TARGET / total;
    const totalMs = STEP_MS * total;
    const t0 = performance.now();
    let raf = 0;

    const tick = () => {
      const el = performance.now() - t0;
      if (el >= totalMs) {
        setProgress(PROGRESS_TARGET);
        setStepIndex(total - 1);
        setIgnition(true);
        safeSession.set("booted", "1");
        safePlaySound("chime");
        setPhase("ignition");
        return;
      }
      const step = Math.min(total - 1, Math.floor(el / STEP_MS));
      setStepIndex(step);
      if (step === total - 1) setIgnition(true);
      const withinStep = (el - step * STEP_MS) / STEP_MS;
      const eased = 1 - Math.pow(1 - Math.min(1, withinStep), 2);
      setProgress(Math.min(PROGRESS_TARGET - 1, Math.round(step * perStep + eased * perStep)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [booting, phase]);

  // Phase transitions — timings unchanged from the original.
  useEffect(() => {
    if (!booting) return;
    const timers: number[] = [];

    if (phase === "ignition") {
      timers.push(window.setTimeout(() => setPhase("flash"), 550));
    } else if (phase === "flash") {
      safePlaySound("whoosh");
      timers.push(window.setTimeout(() => setPhase("reveal"), 280));
    } else if (phase === "reveal") {
      timers.push(window.setTimeout(() => setPhase("done"), 650));
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [booting, phase]);

  const handleSkip = useCallback(() => {
    setProgress(PROGRESS_TARGET);
    setStepIndex(BOOT_SEQUENCE.length - 1);
    setIgnition(true);
    safeSession.set("booted", "1");
    safePlaySound("whoosh");
    setPhase("flash");
  }, []);

  // Escape / Enter / Space skip. Space is preventDefault'd so it can't also
  // scroll the page underneath the overlay.
  useEffect(() => {
    if (!booting || phase === "done") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        if (e.key === " ") e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [booting, phase, handleSkip]);

  const visible = booting && phase !== "done";
  const isExiting = phase === "reveal" || phase === "done";
  const isFlashing = phase === "flash";
  const step = BOOT_SEQUENCE[stepIndex];

  return (
    <AnimatePresence>
      {visible && (
      <div
        key="helios-preloader-v11"
        className={`fixed inset-0 z-[9999] flex flex-col justify-between bg-[#030712] text-[#F8FAFC] font-sans select-none overflow-hidden transition-all duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isExiting ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
        }`}
        style={{
          clipPath: isExiting ? "inset(0 0 100% 0)" : "inset(0 0 0 0)",
        }}
        role="status"
        aria-live="polite"
        aria-label="Booting portfolio"
      >
        {/* White-Hot / Golden Flash Overlay on 100% */}
        <div
          className={`pointer-events-none absolute inset-0 z-40 bg-[#D4AF37] transition-opacity duration-300 ${
            isFlashing ? "opacity-75" : "opacity-0"
          }`}
        />

        {/* Background Ambient Radial Glow */}
        <div
          className={`absolute inset-0 z-0 pointer-events-none transition-all duration-700 ${
            ignition
              ? "bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.22)_0%,rgba(3,7,18,1)_75%)]"
              : "bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12)_0%,rgba(3,7,18,1)_75%)]"
          }`}
        />

        {/* ================= HEADER ================= */}
        <header className="relative z-30 p-6 sm:p-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border transition-colors duration-500 ${
                ignition
                  ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  : "border-[#38bdf8]/40 bg-[#38bdf8]/10"
              }`}
            >
              <span
                className={`font-mono text-base sm:text-lg font-bold transition-colors duration-500 ${
                  ignition ? "text-[#D4AF37]" : "text-[#38bdf8]"
                }`}
              >
                {brandInitials}
              </span>
              <span
                className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full shadow-[0_0_8px_2px] transition-colors duration-500 ${
                  ignition
                    ? "animate-pulse bg-[#D4AF37] shadow-[#D4AF37]/60"
                    : "bg-[#38bdf8] shadow-[#38bdf8]/60"
                }`}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-sans text-xs sm:text-sm font-semibold tracking-wide text-[#F8FAFC]">
                {brandTitle}
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                  ignition ? "text-[#D4AF37]/80" : "text-[#38bdf8]/80"
                }`}
              >
                {roleTitle}
              </span>
            </div>
          </div>

          <button
            onClick={handleSkip}
            data-cursor="SKIP"
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#0A1128]/90 hover:bg-[#38bdf8] hover:text-[#030712] border border-[#38bdf8]/40 text-[#38bdf8] font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.2)] flex items-center space-x-2 rounded-sm"
          >
            <span>SKIP</span>
            <span className="text-[9px] opacity-70">[ ↵ ]</span>
          </button>
        </header>

        {/* ================= CENTER DISPLAY ================= */}
        <main className="relative z-30 my-auto flex flex-col items-center justify-center text-center px-4 -mt-4 sm:-mt-6">
          {/* 1. 3D OBJECT CANVAS */}
          <div className="relative w-full max-w-sm h-36 sm:h-44 flex items-center justify-center pointer-events-none -mb-2">
            <PreloaderScene ignition={ignition} tier={tier} />
          </div>

          {/* 2. HELIOS DISPLAY TITLE */}
          <motion.h1
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className={`text-6xl sm:text-8xl md:text-9xl font-extrabold tracking-tight uppercase text-transparent bg-clip-text leading-none transition-all duration-700 ${
              ignition
                ? "bg-gradient-to-b from-[#FFFDF0] via-[#D4AF37] to-[#805C00] drop-shadow-[0_0_60px_rgba(212,175,55,0.65)]"
                : "bg-gradient-to-b from-[#F8FAFC] via-[#38bdf8] to-[#0F172A] drop-shadow-[0_0_35px_rgba(56,189,248,0.25)]"
            }`}
          >
            HELIOS
          </motion.h1>

          {/* 3. TAGLINE */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className={`mt-2 font-mono text-[11px] sm:text-xs tracking-[0.3em] font-semibold uppercase transition-colors duration-500 ${
              ignition ? "text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]" : "text-[#88A2D4]"
            }`}
          >
            is getting things ready for you
          </motion.div>

          {/* 4. TICKER STEP MESSAGE */}
          <div className="mt-5 mb-2.5 h-5 w-full max-w-md font-mono text-[11px] text-[#88A2D4]">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <span className={ignition ? "text-[#D4AF37]" : "text-[#38bdf8]"}>›</span>{" "}
              <span className="text-[#F8FAFC] font-medium">{step.label}</span>
              {step.sub && <span className="text-[#556B9E]"> — {step.sub}</span>}
            </motion.p>
          </div>

          {/* 5. PROGRESS BAR */}
          <div className="w-full max-w-xs sm:max-w-md h-1.5 bg-[#0A1128] rounded-full overflow-hidden border border-[#38bdf8]/20 relative">
            <div
              className={`h-full transition-[width,background-color] duration-150 ease-out ${
                ignition
                  ? "bg-gradient-to-r from-[#997A15] via-[#D4AF37] to-[#FFF5C0] shadow-[0_0_15px_rgba(212,175,55,0.9)]"
                  : "bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.6)]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2.5 flex w-full max-w-xs sm:max-w-md items-center justify-between font-mono text-[10px] text-[#556B9E]">
            <span className="tabular-nums">{progress.toString().padStart(3, "0")}%</span>
            <span className={ignition ? "text-[#D4AF37] font-bold tracking-widest" : "text-[#38bdf8] tracking-widest"}>
              {ignition ? "HELIOS ONLINE" : "SYSTEM BOOTING"}
            </span>
          </div>
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="relative z-30 p-6 sm:p-8 text-center font-mono text-[10px] sm:text-[11px] text-[#556B9E] max-w-lg mx-auto">
          <p className="leading-relaxed">
            A portfolio built as a product. Every heavy feature degrades gracefully — it never breaks, it only becomes less lifelike.
          </p>
        </footer>
      </div>
      )}
    </AnimatePresence>
  );
}
