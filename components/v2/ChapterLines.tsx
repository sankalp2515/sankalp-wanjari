"use client";

// ChapterLines — scroll-driven chapter markers that appear over the
// 3D canvas in the gaps BETWEEN sections, announcing what the particle
// field is becoming: "> THE WORK" as the galaxy forms, "> CAPABILITIES"
// as the lattice forms. They live below the content layer, so they can
// never fight real copy — they exist only in the transitions.
//
// Same zero-React-rerender discipline as the field: one scroll listener,
// style.opacity writes only.

import { useEffect, useRef } from "react";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function ChapterLines() {
  const workLine = useRef<HTMLDivElement>(null);
  const skillsLine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let workTop = Infinity;
    let skillsTop = Infinity;
    const measure = () => {
      workTop = document.getElementById("section-work")?.offsetTop ?? Infinity;
      skillsTop = document.getElementById("section-skills")?.offsetTop ?? Infinity;
    };
    const update = () => {
      const y = window.scrollY || 0;
      const h = Math.max(window.innerHeight, 1);

      // "> THE WORK": rises as the hero exits, gone before work content lands
      const rise1 = clamp01((y - h * 0.55) / (h * 0.3));
      const fall1 = workTop === Infinity ? 0 : clamp01((y - (workTop - h * 0.8)) / (h * 0.35));
      const op1 = Math.min(rise1, 1 - fall1);

      // "> CAPABILITIES": tracks the lattice morph, gone as skills content lands
      const rise2 = skillsTop === Infinity ? 0 : clamp01((y - (skillsTop - h * 0.95)) / (h * 0.3));
      const fall2 = skillsTop === Infinity ? 0 : clamp01((y - (skillsTop - h * 0.45)) / (h * 0.3));
      const op2 = Math.min(rise2, 1 - fall2);

      if (workLine.current) {
        workLine.current.style.opacity = String(op1);
        workLine.current.style.transform = `translateY(${(1 - op1) * 14}px)`;
      }
      if (skillsLine.current) {
        skillsLine.current.style.opacity = String(op2);
        skillsLine.current.style.transform = `translateY(${(1 - op2) * 14}px)`;
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const lineStyle: React.CSSProperties = {
    opacity: 0,
    color: "var(--os-text-secondary)",
    textShadow: "0 2px 24px color-mix(in srgb, var(--os-bg) 80%, transparent)",
  };

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      <div
        ref={workLine}
        className="absolute top-[38%] inset-x-0 text-center font-mono uppercase tracking-[0.42em]"
        style={{ ...lineStyle, fontSize: "clamp(0.9rem, 1.9vw, 1.3rem)" }}
      >
        <span style={{ color: "var(--os-accent)" }}>&gt;</span> The Work
      </div>
      <div
        ref={skillsLine}
        className="absolute top-[38%] inset-x-0 text-center font-mono uppercase tracking-[0.42em]"
        style={{ ...lineStyle, fontSize: "clamp(0.9rem, 1.9vw, 1.3rem)" }}
      >
        <span style={{ color: "var(--os-accent-cyan)" }}>&gt;</span> Capabilities
      </div>
    </div>
  );
}
