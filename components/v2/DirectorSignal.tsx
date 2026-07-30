"use client";

// DirectorSignal — the legibility layer for the autonomous page.
//
// The Director (lib/director.ts) silently reorders the grid and tunes the hero
// per visitor. Silent adaptation reads as "a website with a filter." This
// surfaces the reasoning — one calm, ambient line stating WHAT changed and WHY
// — which is what turns "personalized" into "an agent reacting to you."
//
// Deliberately restrained so it never nags: fires once per distinct persona
// decision (session-scoped), auto-dismisses, yields to the dock and the tour,
// and speaks about the WORK ("surfacing the architecture") — never about
// surveillance ("I see you doing X"), which would feel creepy.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, X } from "lucide-react";
import { useConcierge } from "@/contexts/ConciergeContext";
import { useDirective } from "@/lib/director";
import { getLog } from "@/lib/behavior";
import type { Persona } from "@/types";

// What the page is now foregrounding for each audience — phrased as curation,
// not flattery.
const FOCUS: Record<Exclude<Persona, null>, string> = {
  recruiter: "leading with outcomes and availability",
  cto: "surfacing the architecture and evaluation work first",
  developer: "putting the code craft, repos, and papers up top",
  explorer: "leading with the most unexpected build",
};

// For an INFERRED persona, name the observed signal so the "why" is concrete.
// Reads the behavior log, never the visitor's identity.
function reasonPrefix(explicit: boolean): string {
  if (explicit) return "";
  const log = getLog();
  const has = (e: string) => log.some((x) => x.e === e);
  const count = (e: string) => log.filter((x) => x.e === e).length;
  if (has("resume-open")) return "You reached for the resume — ";
  if (count("case-open") >= 2) return "You've opened a couple of breakdowns — ";
  if (has("skill")) return "You're digging into the stack — ";
  return "Reading where you're spending time — ";
}

export default function DirectorSignal() {
  const { persona, explicit } = useDirective();
  const { open, tourRunning } = useConcierge();
  const [msg, setMsg] = useState<string | null>(null);
  const shownRef = useRef<Set<string>>(new Set());

  // Announce a decision — once per persona value, after a calm beat.
  useEffect(() => {
    if (!persona || shownRef.current.has(persona)) return;
    const key = `director-signal-${persona}`;
    try {
      if (sessionStorage.getItem(key) === "1") { shownRef.current.add(persona); return; }
    } catch { /* storage blocked — best-effort */ }

    const t = setTimeout(() => {
      if (tourRunning || open) return; // don't intrude on the film or the chat
      shownRef.current.add(persona);
      try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
      setMsg(
        explicit
          ? `Shaping this around you — ${FOCUS[persona]}.`
          : `${reasonPrefix(explicit)}${FOCUS[persona]}.`,
      );
    }, 2200);
    return () => clearTimeout(t);
  }, [persona, explicit, tourRunning, open]);

  // Auto-dismiss — a signal, not a sticky banner.
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 6800);
    return () => clearTimeout(t);
  }, [msg]);

  // Yield immediately if the dock opens or the tour starts.
  useEffect(() => { if (open || tourRunning) setMsg(null); }, [open, tourRunning]);

  return (
    <AnimatePresence>
      {msg && !open && !tourRunning && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-24 left-5 z-[1230] max-w-[300px] rounded-2xl border px-3.5 py-2.5 flex items-start gap-2.5"
          style={{
            background: "color-mix(in srgb, var(--os-bg-window) 94%, transparent)",
            borderColor: "color-mix(in srgb, var(--os-accent) 26%, var(--os-border))",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--os-shadow-accent)",
          }}
          role="status"
          aria-live="polite"
        >
          <span
            className="grid place-items-center w-5 h-5 rounded-md shrink-0 mt-0.5"
            style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))" }}
          >
            <Compass size={11} className="text-white" aria-hidden />
          </span>
          <div className="min-w-0">
            <span className="block text-[9.5px] font-mono tracking-[0.14em]" style={{ color: "var(--os-accent)" }}>
              HELIOS · DIRECTING
            </span>
            <p className="text-[12px] leading-snug" style={{ color: "var(--os-text-secondary)" }}>{msg}</p>
          </div>
          <button
            onClick={() => setMsg(null)}
            aria-label="Dismiss"
            className="grid place-items-center w-5 h-5 rounded-md shrink-0 transition-colors hover:bg-[var(--os-bg-hover)]"
            style={{ color: "var(--os-text-muted)" }}
          >
            <X size={11} aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
