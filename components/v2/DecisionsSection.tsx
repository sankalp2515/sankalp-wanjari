"use client";

// "How I decide" — the APM signal, before any project. A tile rotates through
// real product calls (config/portfolio.ts productDecisions): the decision, why,
// and what it cost. The cost line is deliberately the loudest after the
// decision: trade-offs are what a PM interview probes.
//
// Rotation: every 7 s, flipping on the X axis. It pauses on hover, focus, when
// the section leaves the screen or the tab is hidden, and never auto-advances
// under reduced motion. Prev/next, the theme list and ←/→ give full control.

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { productDecisions } from "@/config/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import SectionShell from "./SectionShell";

const INTERVAL = 7000;

export default function DecisionsSection() {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [dir, setDir] = useState(1);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const n = productDecisions.length;
  const d = productDecisions[i];

  const go = useCallback((next: number, direction = 1) => {
    setDir(direction);
    setI(((next % n) + n) % n);
  }, [n]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The guided tour drives the tile: `decide:<id>` cues jump to the decision
  // being narrated, and auto-rotation stays off for the whole film.
  const [touring, setTouring] = useState(false);
  useEffect(() => {
    const onEnter = () => setTouring(true);
    const onExit = () => setTouring(false);
    const onCue = (e: Event) => {
      const c = (e as CustomEvent<string>).detail;
      if (!c?.startsWith("decide:")) return;
      const k = productDecisions.findIndex((x) => x.id === c.slice(7));
      if (k >= 0) go(k, 1);
    };
    window.addEventListener("film:enter", onEnter);
    window.addEventListener("film:exit", onExit);
    window.addEventListener("film:cue", onCue);
    return () => {
      window.removeEventListener("film:enter", onEnter);
      window.removeEventListener("film:exit", onExit);
      window.removeEventListener("film:cue", onCue);
    };
  }, [go]);

  const running = !reduced && !hold && onScreen && !touring;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => { if (!document.hidden) go(i + 1, 1); }, INTERVAL);
    return () => window.clearTimeout(t);
  }, [running, i, go]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1, 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1, -1); }
  };

  return (
    <SectionShell
      id="section-decisions"
      index="01"
      kicker="How I decide"
      title="Every product call costs something. Here is what mine cost."
      subtitle="Seven real decisions from shipped work: what I chose, why, and the trade-off I accepted. The trade-off is the part worth interviewing me on."
    >
      <div
        ref={ref}
        className="dtile"
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocusCapture={() => setHold(true)}
        onBlurCapture={() => setHold(false)}
        onKeyDown={onKey}
        role="region"
        aria-roledescription="carousel"
        aria-label="Product decisions"
      >
        <div className="dtile__stage">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <m.article
              key={d.id}
              className="dtile__card"
              custom={dir}
              initial={reduced ? { opacity: 0 } : { rotateX: dir > 0 ? -78 : 78, y: dir > 0 ? 28 : -28, opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { rotateX: 0, y: 0, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { rotateX: dir > 0 ? 78 : -78, y: dir > 0 ? -28 : 28, opacity: 0 }}
              transition={{ duration: reduced ? 0.2 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              aria-live={running ? "off" : "polite"}
            >
              <header className="dtile__meta">
                <span className="ds-chip">{d.theme}</span>
                <span className="ds-label">{d.project}</span>
                <span className="dtile__count ds-label">{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
              </header>
              <h3 className="dtile__decision">{d.decision}</h3>
              <dl className="dtile__body">
                <div><dt className="ds-label">Why</dt><dd>{d.why}</dd></div>
                <div className="dtile__cost"><dt className="ds-label">What it cost</dt><dd>{d.cost}</dd></div>
              </dl>
            </m.article>
          </AnimatePresence>
          {/* Progress for the auto-rotation; restarts on every change. */}
          <span key={`p-${i}-${running}`} className={`dtile__progress ${running ? "is-running" : ""}`} style={{ animationDuration: `${INTERVAL}ms` }} aria-hidden />
        </div>

        <div className="dtile__controls">
          <ol className="dtile__index">
            {productDecisions.map((x, k) => (
              <li key={x.id}>
                <button type="button" aria-pressed={k === i} onClick={() => go(k, k > i ? 1 : -1)}>
                  <span className="dtile__dot" aria-hidden />
                  {x.theme}
                </button>
              </li>
            ))}
          </ol>
          <div className="dtile__arrows">
            <button type="button" className="dtile__arrow" onClick={() => go(i - 1, -1)} aria-label="Previous decision"><ArrowLeft size={16} aria-hidden /></button>
            <button type="button" className="dtile__arrow" onClick={() => go(i + 1, 1)} aria-label="Next decision"><ArrowRight size={16} aria-hidden /></button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
