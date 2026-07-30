"use client";

// HighlightStrip — the slim line under the nav.
//
// Replaces the old persona strip. It asks nothing and can't confuse anyone
// because it isn't pretending to be personalized: it shows ONE real highlight,
// picked at random per visit, from facts that already live in config. Dismiss
// once and it stays gone for the session.
//
// Hydration note: the random pick happens in an effect (after mount), never
// during render — otherwise the server and the browser would roll different
// numbers and React would throw a hydration mismatch. So SSR/first paint render
// nothing, and the strip appears a beat later.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, FileText, Mail, ArrowRight, MessageSquare } from "lucide-react";
import { personal } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";

const DISMISS_KEY = "highlight-strip-dismissed";

// Each line is a verified fact from config, paired with the ONE action that
// makes sense for it. The strip isn't persona-personalized (so it can't feel
// fake), but it's no longer a dead end — every line has somewhere to go.
type CtaKind = "resume" | "contact" | "work" | "ask";
interface Highlight { text: string; cta: { label: string; kind: CtaKind } }

const HIGHLIGHTS: Highlight[] = [
  { text: `${personal.availability} · notice ${personal.noticePeriod.toLowerCase()}`, cta: { label: "Reach out", kind: "contact" } },
  ...personal.stats.map((s): Highlight => ({ text: `${s.value} ${s.label}`, cta: { label: "See the work", kind: "work" } })),
  { text: "Zero fabricated citations — enforced as a CI gate, not a heuristic", cta: { label: "See the work", kind: "work" } },
  { text: "Schema compliance driven from 25% to 99% (StructAgent, LoRA + DPO)", cta: { label: "See the work", kind: "work" } },
  { text: "6-provider LLM fallback — the whole site runs at zero paid API cost", cta: { label: "Ask Helios", kind: "ask" } },
  { text: `${personal.stats.length ? "3 production AI systems" : ""} · resume updated ${personal.resumeUpdated}`, cta: { label: "View resume", kind: "resume" } },
];

const CTA_ICON: Record<CtaKind, React.ReactNode> = {
  resume: <FileText size={11} aria-hidden />,
  contact: <Mail size={11} aria-hidden />,
  work: <ArrowRight size={11} aria-hidden />,
  ask: <MessageSquare size={11} aria-hidden />,
};

export default function HighlightStrip() {
  const { setOpen } = useConcierge();
  // `null` until mounted → nothing renders on the server or first paint.
  const [idx, setIdx] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch { /* storage blocked — best-effort */ }
    setIdx(Math.floor(Math.random() * HIGHLIGHTS.length));
    setDismissed(false);
  }, []);

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  const runCta = (kind: CtaKind) => {
    switch (kind) {
      case "resume":  window.dispatchEvent(new CustomEvent("resume:open")); break;
      case "contact": window.location.href = `mailto:${personal.email}`; break;
      case "work":    window.dispatchEvent(new CustomEvent("stage:nav", { detail: "work" })); break;
      case "ask":
        setOpen(true);
        setTimeout(() => window.dispatchEvent(new CustomEvent("concierge-focus-input")), 80);
        break;
    }
  };

  return (
    <AnimatePresence>
      {idx !== null && !dismissed && (
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
            <span className="flex items-center gap-2 min-w-0">
              <Sparkles size={12} className="shrink-0" style={{ color: "var(--os-accent)" }} aria-hidden />
              <span className="truncate">{HIGHLIGHTS[idx].text}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => runCta(HIGHLIGHTS[idx].cta.kind)}
                className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: "color-mix(in srgb, var(--os-accent) 40%, transparent)",
                  color: "var(--os-accent)",
                  background: "color-mix(in srgb, var(--os-accent) 8%, transparent)",
                }}
              >
                {CTA_ICON[HIGHLIGHTS[idx].cta.kind]} {HIGHLIGHTS[idx].cta.label}
              </button>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="grid place-items-center w-6 h-6 rounded-md transition-colors hover:bg-[var(--os-bg-hover)]"
                style={{ color: "var(--os-text-muted)" }}
              >
                <X size={12} aria-hidden />
              </button>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
