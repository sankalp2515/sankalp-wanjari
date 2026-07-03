"use client";

// ChapterTitle — cinematic title cards for the tour. Listens for
// "tour:step" and flashes the chapter name center-screen; a soft
// vignette frames the page while the AI is driving.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConcierge } from "@/contexts/ConciergeContext";

interface Step { chapter: string; index: number; total: number }

export default function ChapterTitle() {
  const { tourRunning } = useConcierge();
  const [step, setStep] = useState<Step | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onStep = (e: Event) => {
      setStep((e as CustomEvent<Step>).detail);
      clearTimeout(t);
      t = setTimeout(() => setStep(null), 2200);
    };
    window.addEventListener("tour:step", onStep);
    return () => { window.removeEventListener("tour:step", onStep); clearTimeout(t); };
  }, []);

  return (
    <>
      {/* Cinematic vignette while the AI drives */}
      <AnimatePresence>
        {tourRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[1050] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 62% at 50% 48%, transparent 55%, color-mix(in srgb, var(--os-bg) 65%, transparent) 100%)",
            }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Chapter card */}
      <AnimatePresence>
        {step && (
          <motion.div
            key={step.chapter}
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[22%] inset-x-0 z-[1060] flex flex-col items-center pointer-events-none"
            aria-live="polite"
          >
            <div className="text-[10px] font-mono mono-small tracking-[0.3em] mb-2"
              style={{ color: "var(--os-text-muted)" }}>
              {step.index} / {step.total}
            </div>
            <div
              className="font-display font-bold tracking-tight text-center px-6 py-3 rounded-2xl border"
              style={{
                fontSize: "clamp(1.3rem, 3.4vw, 2.2rem)",
                color: "var(--os-text)",
                background: "color-mix(in srgb, var(--os-bg-window) 88%, transparent)",
                borderColor: "color-mix(in srgb, var(--os-accent-cyan) 30%, var(--os-border))",
                backdropFilter: "blur(14px)",
                boxShadow: "var(--os-shadow)",
              }}
            >
              {step.chapter}
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="mt-3 h-[2px] w-40 origin-left rounded-full"
              style={{ background: "linear-gradient(90deg, var(--os-accent), var(--os-accent-cyan))" }}
              aria-hidden
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
