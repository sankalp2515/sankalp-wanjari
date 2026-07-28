"use client";

// Boot loader — a "system coming online" sequence: a wireframe core
// (see LoaderScene) warming from teal to amber as a short boot log
// counts up to 100%, then the overlay wipes away.
//
// Design rules carried over from the previous starfield loader
// (kept as Loader.starfield.bak.tsx):
//   • Shown ONCE per session — gated on safeSession "booted", which is
//     set on *completion*, not eagerly (eager-set made StrictMode's
//     double-effect skip the loader in dev).
//   • safeSession never throws — raw sessionStorage threw in
//     storage-blocked browsers (Brave Shields / private mode) and left
//     the site stuck on boot. It degrades to an in-memory flag instead.
//   • Reduced-motion users skip it entirely (via useReducedMotion, read
//     at render — not a ref set in an effect, so there's no first-frame
//     flash of motion).
//
// The Three.js scene is dynamically imported (ssr:false), so the overlay
// — name, boot log, progress — paints immediately and the 3D core streams
// in behind it. Boot never blocks on the 3D bundle.

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { personal } from "@/config/portfolio";
import { PROVIDERS } from "@/lib/llm/providers";
import { safeSession } from "@/lib/safeStorage";

const LoaderScene = dynamic(() => import("./LoaderScene"), { ssr: false });

// Boot log — every line is a REAL fact about this site, sourced where
// possible from config so it can never drift into fiction:
//   • runtime versions, the knowledge graph, the multi-provider
//     orchestrator + its adaptive failover, and Helios (Ctrl+K).
const PROVIDER_CHAIN = PROVIDERS.map((p) => p.id).join(" → ");
const BOOT_SEQUENCE: { label: string; sub: string }[] = [
  { label: "Spinning up runtime", sub: "next 16 · react 19" },
  { label: "Linking knowledge graph", sub: "nodes · edges · verified facts" },
  { label: "Arming orchestrator", sub: PROVIDER_CHAIN },
  { label: "Resolving failover order", sub: "adaptive self-reordering" },
  { label: "Helios online", sub: "concierge ready · Ctrl+K" },
];

const STEP_MS = 560; // per boot-log line
const TOTAL_MS = STEP_MS * BOOT_SEQUENCE.length;

export default function Loader() {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [ignition, setIgnition] = useState(false);
  const [exiting, setExiting] = useState(false);
  const rafRef = useRef(0);

  // Drive the count-up + boot log on rAF (smoother than setInterval and
  // auto-throttles when backgrounded). Runs once, on mount.
  useEffect(() => {
    if (reduced) return;
    if (safeSession.get("booted") === "1") return;

    const total = BOOT_SEQUENCE.length;
    const perStep = 100 / total;
    const t0 = performance.now();
    let finished = false;

    const finish = () => {
      finished = true;
      setProgress(100);
      setStepIndex(total - 1);
      setIgnition(true);
      safeSession.set("booted", "1");
      setTimeout(() => setExiting(true), 520);
    };

    const tick = () => {
      const elapsed = performance.now() - t0;
      setShow(true);
      if (elapsed >= TOTAL_MS) return finish();
      const step = Math.min(total - 1, Math.floor(elapsed / STEP_MS));
      setStepIndex(step);
      if (step === total - 1) setIgnition(true);
      const withinStep = (elapsed - step * STEP_MS) / STEP_MS;
      const eased = 1 - Math.pow(1 - Math.min(1, withinStep), 2);
      setProgress(Math.min(99, Math.round(step * perStep + eased * perStep)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (!finished) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  // Wipe the overlay, then unmount (disposing the WebGL context with it).
  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => setShow(false), 700);
    return () => clearTimeout(t);
  }, [exiting]);

  const handleSkip = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setProgress(100);
    setStepIndex(BOOT_SEQUENCE.length - 1);
    setIgnition(true);
    safeSession.set("booted", "1");
    setExiting(true);
  }, []);

  const step = BOOT_SEQUENCE[stepIndex];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="boot"
          animate={{ opacity: exiting ? 0 : 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "var(--os-bg)" }}
          role="status"
          aria-live="polite"
          aria-label="Booting portfolio"
        >
          {/* 3D core — streams in behind the overlay; null until loaded */}
          <div className="absolute inset-0">
            <LoaderScene ignition={ignition} reduceMotion={false} />
          </div>

          {/* Vignette keeps the center readable over the scene */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, transparent 30%, color-mix(in srgb, var(--os-bg) 92%, transparent) 92%)",
            }}
          />

          {/* Content overlay */}
          <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6">
            {/* Identity badge — cool→warm at ignition */}
            <div className="mb-10 flex items-center gap-3">
              <div
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border transition-colors duration-500"
                style={{
                  borderColor: `color-mix(in srgb, ${ignition ? "var(--os-accent)" : "var(--os-accent-cyan)"} 50%, transparent)`,
                  background: `color-mix(in srgb, ${ignition ? "var(--os-accent)" : "var(--os-accent-cyan)"} 10%, transparent)`,
                }}
              >
                <span
                  className="font-display text-lg font-bold transition-colors duration-500"
                  style={{ color: ignition ? "var(--os-accent)" : "var(--os-accent-cyan)" }}
                >
                  {personal.shortName.charAt(0)}
                </span>
                <span
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full transition-colors duration-500"
                  style={{
                    background: ignition ? "var(--os-accent)" : "var(--os-accent-cyan)",
                    boxShadow: `0 0 8px 2px color-mix(in srgb, ${ignition ? "var(--os-accent)" : "var(--os-accent-cyan)"} 60%, transparent)`,
                  }}
                />
              </div>
              <div className="flex flex-col leading-tight text-left">
                <span className="font-display text-sm font-semibold tracking-wide" style={{ color: "var(--os-text)" }}>
                  {personal.name}
                </span>
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-500"
                  style={{ color: `color-mix(in srgb, ${ignition ? "var(--os-accent)" : "var(--os-accent-cyan)"} 80%, transparent)` }}
                >
                  {personal.title}
                </span>
              </div>
            </div>

            {/* Boot log — current line */}
            <div className="mb-5 h-6 w-full">
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center font-mono text-xs"
                style={{ color: "var(--os-text-secondary)" }}
              >
                <span style={{ color: ignition ? "var(--os-accent)" : "var(--os-accent-cyan)" }}>›</span>{" "}
                <span style={{ color: "var(--os-text)" }}>{step.label}</span>
                <span style={{ color: "var(--os-text-muted)" }}> — {step.sub}</span>
              </motion.p>
            </div>

            {/* Progress track + glowing fill */}
            <div
              className="h-px w-full overflow-hidden"
              style={{ background: "color-mix(in srgb, var(--os-text-muted) 22%, transparent)" }}
            >
              <div
                className="h-full transition-[width] duration-100 ease-out"
                style={{
                  width: `${progress}%`,
                  background: ignition
                    ? "linear-gradient(90deg, transparent, var(--os-accent) 55%, var(--os-accent))"
                    : "linear-gradient(90deg, transparent, var(--os-accent-cyan) 55%, var(--os-accent-cyan))",
                  boxShadow: `0 0 10px color-mix(in srgb, ${ignition ? "var(--os-accent)" : "var(--os-accent-cyan)"} 65%, transparent)`,
                }}
              />
            </div>

            {/* Percent + Skip */}
            <div className="mt-3 flex w-full items-center justify-between font-mono text-[10px]" style={{ color: "var(--os-text-muted)" }}>
              <span className="tabular-nums">{progress.toString().padStart(3, "0")}%</span>
              <button
                onClick={handleSkip}
                className="cursor-pointer uppercase tracking-[0.18em] transition-colors focus:outline-none"
                style={{ color: "var(--os-text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--os-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--os-text-muted)")}
              >
                Skip
              </button>
            </div>
          </div>

          {/* Film grain — keeps the void from banding */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
