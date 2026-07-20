"use client";

// One visible world behind the whole scroll. The field changes its dominant
// frequency per chapter, so the portfolio has a visual arc instead of the
// same wallpaper from first pixel to last.

import { useEffect, useRef, useState } from "react";

const CHAPTER_TONES: Record<string, string> = {
  "section-hero": "var(--os-accent)",
  "section-about": "var(--os-accent-cyan)",
  "section-work": "var(--os-accent)",
  "section-research": "var(--os-accent-green)",
  "section-arc": "var(--os-accent-cyan)",
  "section-education": "var(--os-accent)",
  "section-skills": "var(--os-accent-cyan)",
  "section-contact": "var(--os-accent-green)",
};

export default function AmbientBackground() {
  const [active, setActive] = useState(false);
  const [tone, setTone] = useState(CHAPTER_TONES["section-hero"]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = (event: Event) => setActive((event as CustomEvent<boolean>).detail);
    window.addEventListener("agent-typing-change", on);
    return () => window.removeEventListener("agent-typing-change", on);
  }, []);

  useEffect(() => {
    const field = ref.current;
    if (!field) return;
    let frame = 0;
    const updatePointer = (event: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        field.style.setProperty("--cx", String(event.clientX / window.innerWidth));
        field.style.setProperty("--cy", String(event.clientY / window.innerHeight));
      });
    };
    window.addEventListener("mousemove", updatePointer, { passive: true });
    return () => { window.removeEventListener("mousemove", updatePointer); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    const observers = Object.keys(CHAPTER_TONES).flatMap((id) => {
      const node = document.getElementById(id);
      if (!node) return [];
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setTone(CHAPTER_TONES[id]); },
        { rootMargin: "-38% 0px -45% 0px", threshold: 0.04 }
      );
      observer.observe(node);
      return [observer];
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  return (
    <div
      ref={ref}
      className="ambient-field fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
      style={{
        background: "var(--os-bg)",
        "--cx": "0.5",
        "--cy": "0.5",
        "--chapter-tone": tone,
        "--signal-energy": active ? "1" : "0.72",
      } as React.CSSProperties}
    >
      <div className="ambient-field__aurora" />
      <div className="ambient-field__horizon" />
      <div className="ambient-field__coordinates" />
      <div className="ambient-field__grain" />
      <div className="ambient-field__vignette" />
    </div>
  );
}
