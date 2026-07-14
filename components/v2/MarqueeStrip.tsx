"use client";

// MarqueeStrip — an infinite horizontal skill ticker directly below the
// hero. Pure CSS transform animation (GPU-cheap, no JS loop), edge fade
// masks, pause-on-hover, and a static wrap for reduced-motion.

import { skills } from "@/config/portfolio";
import { useReducedMotion } from "framer-motion";

// Two rows scrolling opposite ways reads richer than one.
const ROW_A = skills.filter((_, i) => i % 2 === 0).map((s) => s.name);
const ROW_B = skills.filter((_, i) => i % 2 === 1).map((s) => s.name);

function Row({ items, reverse, duration }: { items: string[]; reverse?: boolean; duration: number }) {
  return (
    <div className="flex overflow-hidden select-none" aria-hidden>
      <div
        className="flex shrink-0 items-center gap-8 pr-8 marquee-track"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {/* Rendered twice → seamless loop at -50% */}
        {[...items, ...items].map((name, i) => (
          <span key={`${name}-${i}`} className="flex items-center gap-8 shrink-0">
            <span
              className="font-display font-semibold whitespace-nowrap"
              style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.7rem)", color: "var(--os-text-secondary)" }}
            >
              {name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--os-accent)" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MarqueeStrip() {
  const reduced = useReducedMotion();

  if (reduced) {
    // Static, wrapped — no motion
    return (
      <div className="border-y py-5 px-5" style={{ borderColor: "var(--os-border-subtle)" }}>
        <div className="max-w-5xl mx-auto flex flex-wrap gap-x-6 gap-y-2 justify-center">
          {skills.map((s) => (
            <span key={s.name} className="font-mono text-[13px]" style={{ color: "var(--os-text-secondary)" }}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative py-6 border-y overflow-hidden marquee-mask"
      style={{ borderColor: "var(--os-border-subtle)", background: "color-mix(in srgb, var(--os-bg-elevated) 40%, transparent)" }}
    >
      <div className="flex flex-col gap-3">
        <Row items={ROW_A} duration={38} />
        <Row items={ROW_B} duration={46} reverse />
      </div>
    </div>
  );
}
