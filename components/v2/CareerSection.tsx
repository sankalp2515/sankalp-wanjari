"use client";

// Career — vertical timeline. Fully responsive: single column with
// a left rail; no fixed widths, nothing clipped.

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Briefcase } from "lucide-react";
import { experience } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import Reveal from "./Reveal";

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function CareerSection() {
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();

  // Scroll-scrubbed: the timeline draws itself as you move through it
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.8", "end 0.45"],
  });
  const lineScale = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <SectionShell
      id="section-arc"
      kicker="THE ARC"
      title="Three years of shipping, then all-in on AI"
      subtitle="From enterprise data migration at scale to agentic systems — the engineering discipline carried over."
    >
      <div className="relative ml-3 sm:ml-5">
        {/* Static faint rail + scroll-drawn gradient line on top */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: "var(--os-border)" }} aria-hidden />
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-[2px] origin-top"
          style={{
            background: "linear-gradient(180deg, var(--os-accent), var(--os-accent-cyan))",
            scaleY: reduced ? 1 : lineScale,
          }}
          aria-hidden
        />
      <ol ref={listRef} className="space-y-10">
        {experience.map((e, i) => (
          <li key={`${e.company}-${e.title}`} className="relative pl-8 sm:pl-10">
            {/* Node */}
            <span
              className="absolute -left-[17px] top-0 grid place-items-center w-8 h-8 rounded-full border-2"
              style={{
                background: "var(--os-bg-elevated)",
                borderColor: "var(--os-accent)",
                color: "var(--os-accent)",
              }}
              aria-hidden
            >
              <Briefcase size={13} />
            </span>

            <Reveal delay={i * 0.06}>
              <div className="glass-card rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-mono mb-2" style={{ color: "var(--os-text-muted)" }}>
                  <span style={{ color: "var(--os-accent)" }}>
                    {fmt(e.date)} — {e.endDate ? fmt(e.endDate) : "present"}
                  </span>
                  <span>· {e.location}</span>
                </div>
                <h3 className="font-display font-bold text-[17px] leading-snug" style={{ color: "var(--os-text)" }}>
                  {e.title}
                </h3>
                <div className="text-[13.5px] font-medium mt-0.5 mb-3" style={{ color: "var(--os-text-secondary)" }}>
                  {e.company}
                </div>
                <ul className="space-y-1.5 mb-4">
                  {e.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
                      <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: "var(--os-accent)" }} aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-1.5">
                  {e.tags.map((t) => (
                    <span key={t} className="text-[10.5px] font-mono px-2 py-0.5 rounded-md"
                      style={{ background: "var(--os-bg-surface)", color: "var(--os-text-muted)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
      </div>
    </SectionShell>
  );
}
