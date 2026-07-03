"use client";

// Boot loader — the name IS the loading screen. Shown once per
// session, ~1.3s, then wipes away. Skipped for reduced-motion.

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { personal } from "@/config/portfolio";

const DURATION_MS = 1300;

export default function Loader() {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced) return;
    if (sessionStorage.getItem("booted") === "1") return;
    sessionStorage.setItem("booted", "1");

    const t0 = performance.now();
    let raf = 0;
    // Defer the first setState past the effect body (avoids the
    // cascading-render lint rule) then drive the count-up on rAF.
    const tick = () => {
      const p = Math.min((performance.now() - t0) / DURATION_MS, 1);
      setShow(true);
      // ease-out so the count feels like it's settling, not racing
      setProgress(Math.round((1 - Math.pow(1 - p, 2)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setShow(false), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="boot"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center"
          style={{ background: "var(--os-bg)" }}
          aria-hidden
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold tracking-tight text-center leading-none"
            style={{ fontSize: "clamp(2.6rem, 8vw, 5.5rem)", color: "var(--os-text)" }}
          >
            {personal.shortName}{" "}
            <span className="text-shimmer">{personal.name.split(" ").slice(-1)[0]}</span>
          </motion.div>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-40 h-[2px] rounded-full overflow-hidden" style={{ background: "var(--os-border)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--os-accent), var(--os-accent-cyan))",
                }}
              />
            </div>
            <span className="text-[11px] font-mono tabular-nums" style={{ color: "var(--os-text-muted)" }}>
              {progress}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
