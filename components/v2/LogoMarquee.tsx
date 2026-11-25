"use client";

// LogoMarquee — the strip under the hero, brought back (premium pass,
// config/premiumPass.ts: MARQUEE_BACK). The old one was a ticker of skill
// names; this one carries proof:
//   row 1: the organisations behind the record, each logo with its one fact
//   row 2: the tools the builds run on, as monochrome marks
// Motion: each row drifts on its own and leans into the visitor's scroll
// (scrolling down speeds it up, scrolling up runs it backwards for a moment).
// One rAF loop, only while the strip is on screen; hover or focus slows it to a
// stop so a logo can be read. Reduced motion: a static, wrapped list.

import { useEffect, useRef } from "react";
import LogoMark from "./LogoMark";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Every fact restates config/portfolio.ts (experience, achievements, education).
const ORGS: { name: string; fact: string }[] = [
  { name: "FIS Global", fact: "3 years building tools for U.S. & U.K. banks" },
  { name: "The Economic Times", fact: "2nd nationally, ET AI Hackathon 2026" },
  { name: "Accenture", fact: "co-judged the ET AI Hackathon" },
  { name: "HackerRank", fact: "7th of 3,062 finalists" },
  { name: "SerpApi", fact: "Best in Track: AI Agents" },
  { name: "IIIT Pune", fact: "B.E. Computer Engineering, Honors AI/ML" },
  { name: "BITSoM", fact: "Product Management with GenAI & Agentic AI" },
];

const TOOLS = [
  "Python", "LangGraph", "FastAPI", "PyTorch", "Hugging Face", "Docker", "PostgreSQL", "Redis",
  "Qdrant", "MLflow", "Langfuse", "Grafana", "Prometheus", "Ollama", "Groq", "TypeScript", "Next.js", "Angular",
];

function useDrift(reduced: boolean) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (reduced || !el) return;
    const rows = Array.from(el.querySelectorAll<HTMLElement>(".lmq__row"));
    const speeds = [-38, 30]; // px/s; sign = direction
    const pos = [0, 0];
    let raf = 0, last = 0, lastY = window.scrollY, vel = 0, slow = 1, target = 1, visible = false;

    const frame = (t: number) => {
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0);
      last = t;
      const y = window.scrollY;
      // Smoothed scroll velocity in px/s, clamped so a fling can't blur it.
      const v = dt ? (y - lastY) / dt : 0;
      lastY = y;
      vel += (Math.max(-2400, Math.min(2400, v)) - vel) * 0.12;
      slow += (target - slow) * 0.08;
      rows.forEach((r, i) => {
        const half = r.scrollWidth / 2;
        const dir = Math.sign(speeds[i]);
        pos[i] += (speeds[i] + dir * vel * 0.25) * slow * dt;
        if (half) pos[i] = ((pos[i] % half) - half) % half;
        r.style.transform = `translate3d(${pos[i].toFixed(1)}px,0,0)`;
      });
      raf = visible ? requestAnimationFrame(frame) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = 0; lastY = window.scrollY; raf = requestAnimationFrame(frame); }
    });
    io.observe(el);
    const hold = () => { target = 0; };
    const go = () => { target = 1; };
    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", go);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", go);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", go);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", go);
    };
  }, [reduced]);

  return root;
}

export default function LogoMarquee() {
  const reduced = useReducedMotion();
  const root = useDrift(reduced);

  const orgs = (copy: number) => ORGS.map((o) => (
    <li key={`${o.name}-${copy}`} className="lmq__org" aria-hidden={copy ? true : undefined}>
      <LogoMark name={o.name} size={30} />
      <span className="lmq__orgtext">
        <span className="lmq__name">{o.name}</span>
        <span className="lmq__fact">{o.fact}</span>
      </span>
    </li>
  ));
  const tools = (copy: number) => TOOLS.map((t) => (
    <li key={`${t}-${copy}`} className="lmq__tool" aria-hidden={copy ? true : undefined}>
      <LogoMark name={t} size={18} tone="ink" />
      <span>{t}</span>
    </li>
  ));

  return (
    <section ref={root} className={`lmq ${reduced ? "lmq--static" : ""}`} aria-label="Organisations and tools behind the work">
      <p className="lmq__kicker ds-label">On the record with</p>
      <div className="lmq__viewport">
        <ul className="lmq__row lmq__row--orgs">
          {orgs(0)}{!reduced && orgs(1)}
        </ul>
      </div>
      <div className="lmq__viewport">
        <ul className="lmq__row lmq__row--tools">
          {tools(0)}{!reduced && tools(1)}
        </ul>
      </div>
    </section>
  );
}
