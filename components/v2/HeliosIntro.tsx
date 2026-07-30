"use client";

// HeliosIntro — the "there's a live AI here" heads-up.
//
// The problem it solves: a portfolio visitor stays 2-4 minutes and may never
// discover the concierge, the tour, or any of the AI. This announces it ONCE,
// early — a small Helios bubble in the corner naming the two things worth
// doing (ask, or take the 45-second tour). Without it, the differentiator is
// invisible until the visitor happens to stumble into it.
//
// Restraint: once per session, appears after the loader clears, yields to the
// dock and the tour, auto-dismisses so it never lingers, Variant A only.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Play, MessageSquare } from "lucide-react";
import { useConcierge } from "@/contexts/ConciergeContext";

const SEEN_KEY = "helios-intro-seen";

export default function HeliosIntro() {
  const { open, setOpen, tour, tourRunning } = useConcierge();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem(SEEN_KEY) === "1") return; } catch { return; }
    // Wait out the loader (~2.2s) + hero entrance, then a beat, so it lands in a
    // calm moment rather than fighting the first impression.
    const t = setTimeout(() => {
      if (!open && !tourRunning) setShow(true);
    }, 5200);
    return () => clearTimeout(t);
  }, [open, tourRunning]);

  const seen = () => { try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ } };
  const dismiss = () => { seen(); setShow(false); };

  // Auto-dismiss so it never becomes clutter.
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(dismiss, 15_000);
    return () => clearTimeout(t);
  }, [show]);

  // Yield the moment the visitor engages the dock or a tour starts.
  useEffect(() => { if (open || tourRunning) { seen(); setShow(false); } }, [open, tourRunning]);

  const askHelios = () => {
    seen(); setShow(false);
    setOpen(true);
    setTimeout(() => window.dispatchEvent(new CustomEvent("concierge-focus-input")), 80);
  };
  const startTour = () => { seen(); setShow(false); tour(); };

  return (
    <AnimatePresence>
      {show && !open && !tourRunning && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 right-5 z-[1250] w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl border p-4"
          style={{
            background: "var(--os-bg-window)",
            borderColor: "color-mix(in srgb, var(--os-accent) 34%, var(--os-border))",
            boxShadow: "var(--os-shadow-accent)",
          }}
          role="dialog"
          aria-label="Meet Helios, the site's AI"
        >
          <div className="flex items-start gap-2.5 mb-3">
            <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
              style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))" }}>
              <Sparkles size={13} className="text-white" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--os-text)" }}>
                <strong>Hi — I&apos;m Helios</strong>, the AI running this site. Ask me anything about Sankalp,
                or I&apos;ll give you the 45-second tour.
              </p>
            </div>
            <button onClick={dismiss} aria-label="Dismiss"
              className="grid place-items-center w-6 h-6 rounded-md shrink-0 transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ color: "var(--os-text-muted)" }}>
              <X size={11} aria-hidden />
            </button>
          </div>
          <div className="flex gap-2 pl-9">
            <button onClick={startTour}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg transition-transform hover:scale-[1.03] active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "var(--os-on-accent)" }}>
              <Play size={11} aria-hidden /> Take the tour
            </button>
            <button onClick={askHelios}
              className="flex items-center gap-1.5 text-[11.5px] font-mono px-3 py-1.5 rounded-lg border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)" }}>
              <MessageSquare size={11} aria-hidden /> Ask
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
