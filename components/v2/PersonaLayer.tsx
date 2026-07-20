"use client";

// PersonaLayer — approach #10: choose-your-path branching.
// First visit: a lightweight chooser (skippable, never nags again).
// After choosing: a slim tailored strip under the nav with the one
// action that audience actually wants. Persona also tunes the AI.

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Cpu, Compass, ArrowRight, CalendarDays } from "lucide-react";
import { Persona } from "@/types";
import { personal, social } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import { GithubIcon } from "@/components/ui/Icons";

const PROMPTED_KEY = "persona-prompted";
const STRIP_DISMISSED_KEY = "persona-strip-dismissed";

const CHOICES: { id: Persona; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: "recruiter", label: "I'm a recruiter", hint: "30-second summary + resume", icon: <FileText size={16} /> },
  { id: "cto", label: "I'm a CTO / EM", hint: "Architecture & case studies", icon: <Cpu size={16} /> },
  { id: "developer", label: "I'm an engineer", hint: "Stack, repos, papers", icon: <GithubIcon size={16} /> },
  { id: "explorer", label: "Just exploring", hint: "Let the AI give you a tour", icon: <Compass size={16} /> },
];

function StripContent({ persona }: { persona: Persona }) {
  const { tour } = useConcierge();
  const openCase = () => window.dispatchEvent(new CustomEvent("stage:case", { detail: "001" }));

  switch (persona) {
    case "recruiter":
      return (
        <>
          <span className="min-w-0 truncate">
            <strong style={{ color: "var(--os-text)" }}>30-sec version:</strong> 3 yrs FIS Global · 3 production AI systems ·
            2 published papers · {personal.availability.toLowerCase()}, notice {personal.noticePeriod.toLowerCase()}
          </span>
          <span className="flex items-center gap-2 shrink-0">
            <a href={personal.resumeUrl} download className="persona-strip-cta">
              <FileText size={11} aria-hidden /> Resume
            </a>
            <a href={`mailto:${personal.email}`} className="persona-strip-cta">
              <CalendarDays size={11} aria-hidden /> Reach out
            </a>
          </span>
        </>
      );
    case "cto":
      return (
        <>
          <span className="min-w-0 truncate">
            <strong style={{ color: "var(--os-text)" }}>For technical eyes:</strong> 10-agent LangGraph orchestration,
            6-provider LLM fallback, CI-gated groundedness evals — full architecture write-ups inside
          </span>
          <button onClick={openCase} className="persona-strip-cta shrink-0">
            AutoML case study <ArrowRight size={11} aria-hidden />
          </button>
        </>
      );
    case "developer":
      return (
        <>
          <span className="min-w-0 truncate">
            <strong style={{ color: "var(--os-text)" }}>Fellow builder:</strong> Python · LangGraph · FastAPI · Qdrant ·
            Docker — and this site itself is project #3 (agent operates the UI via CustomEvents)
          </span>
          <a href={social.github} target="_blank" rel="noopener noreferrer" className="persona-strip-cta shrink-0">
            <GithubIcon size={11} /> GitHub
          </a>
        </>
      );
    case "explorer":
      return (
        <>
          <span className="min-w-0 truncate">
            <strong style={{ color: "var(--os-text)" }}>Welcome!</strong> Easiest way in: let the AI concierge drive you
            through the whole portfolio in 45 seconds
          </span>
          <button onClick={() => tour()} className="persona-strip-cta shrink-0">
            Start the tour <ArrowRight size={11} aria-hidden />
          </button>
        </>
      );
    default:
      return null;
  }
}

export default function PersonaLayer({ variant = "a" }: { variant?: "a" | "b" }) {
  const { persona, setPersona } = useConcierge();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [stripDismissed, setStripDismissed] = useState(true); // hidden until mount check

  // First visit (and no ?for= param): offer the chooser once, after a beat.
  // Deferred past paint so hydration compares against the SSR default.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setStripDismissed(sessionStorage.getItem(STRIP_DISMISSED_KEY) === "1");
    });
    // Chooser waits out the arrival: loader (~2.2s) + hero entrance +
    // a few seconds of calm. Interrupting the first impression at 1.8s
    // cost more goodwill than the persona data was worth.
    const hasParam = new URLSearchParams(window.location.search).get("for");
    const t = variant === "b" || hasParam || localStorage.getItem(PROMPTED_KEY)
      ? null
      : setTimeout(() => setChooserOpen(true), 9000);
    return () => {
      cancelAnimationFrame(raf);
      if (t) clearTimeout(t);
    };
  }, [variant]);

  // One solicitation at a time: when a nudge popup appears, the strip yields.
  useEffect(() => {
    const onNudge = () => {
      sessionStorage.setItem(STRIP_DISMISSED_KEY, "1");
      setStripDismissed(true);
    };
    window.addEventListener("nudge:shown", onNudge);
    return () => window.removeEventListener("nudge:shown", onNudge);
  }, []);

  const choose = useCallback(
    (p: Persona) => {
      localStorage.setItem(PROMPTED_KEY, "1");
      setChooserOpen(false);
      if (p) {
        setPersona(p);
        sessionStorage.removeItem(STRIP_DISMISSED_KEY);
        setStripDismissed(false);
      }
    },
    [setPersona]
  );

  const dismissStrip = () => {
    sessionStorage.setItem(STRIP_DISMISSED_KEY, "1");
    setStripDismissed(true);
  };

  return (
    <>
      {/* ── Tailored strip under the nav ── */}
      <AnimatePresence>
        {persona && !stripDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-16 inset-x-0 z-[999] px-3"
          >
            <div
              className="max-w-5xl mx-auto flex items-center gap-3 justify-between text-[12px] px-4 py-2 rounded-b-2xl border border-t-0"
              style={{
                background: "color-mix(in srgb, var(--os-bg-elevated) 92%, transparent)",
                backdropFilter: "blur(14px)",
                borderColor: "var(--os-border-subtle)",
                color: "var(--os-text-secondary)",
              }}
            >
              <StripContent persona={persona} />
              <button
                onClick={dismissStrip}
                aria-label="Dismiss"
                className="grid place-items-center w-6 h-6 rounded-md shrink-0 transition-colors hover:bg-[var(--os-bg-hover)]"
                style={{ color: "var(--os-text-muted)" }}
              >
                <X size={12} aria-hidden />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── First-visit chooser ── */}
      <AnimatePresence>
        {chooserOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1400] flex items-end sm:items-center justify-center p-4"
            style={{ background: "color-mix(in srgb, var(--os-bg) 55%, transparent)", backdropFilter: "blur(6px)" }}
            onClick={() => choose(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border p-6"
              style={{
                background: "var(--os-bg-window)",
                borderColor: "color-mix(in srgb, var(--os-accent) 25%, var(--os-border))",
                boxShadow: "var(--os-shadow-accent)",
              }}
              role="dialog"
              aria-label="Choose your path"
            >
              <div className="text-[11px] font-mono mono-small tracking-widest mb-2" style={{ color: "var(--os-accent)" }}>
                QUICK QUESTION
              </div>
              <h3 className="font-display font-bold text-[20px] mb-1" style={{ color: "var(--os-text)" }}>
                What brings you here?
              </h3>
              <p className="text-[12.5px] mb-5" style={{ color: "var(--os-text-muted)" }}>
                I&apos;ll shape the experience around it — takes one tap, skippable.
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {CHOICES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => choose(c.id)}
                    className="text-left rounded-2xl border p-3.5 transition-all hover:-translate-y-0.5"
                    style={{
                      borderColor: "var(--os-border)",
                      background: "color-mix(in srgb, var(--os-bg-surface) 60%, transparent)",
                    }}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-semibold mb-1" style={{ color: "var(--os-accent)" }}>
                      {c.icon} {c.label}
                    </span>
                    <span className="text-[11px] leading-snug block" style={{ color: "var(--os-text-muted)" }}>
                      {c.hint}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => choose(null)}
                className="w-full text-center text-[12px] font-mono py-2 rounded-xl transition-colors hover:bg-[var(--os-bg-hover)]"
                style={{ color: "var(--os-text-muted)" }}
              >
                Just let me browse →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
