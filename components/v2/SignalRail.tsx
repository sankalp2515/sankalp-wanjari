"use client";

// A quiet, persistent index of the film. It makes the vertical scroll feel
// authored: every section is a chapter on one continuous transmission.

import { useEffect, useRef, useState } from "react";

const CHAPTERS = [
  { id: "section-hero", label: "Signal", number: "00" },
  { id: "section-about", label: "Origin", number: "01" },
  { id: "section-work", label: "Proof", number: "02" },
  { id: "section-research", label: "Research", number: "03" },
  { id: "section-arc", label: "Arc", number: "04" },
  { id: "section-education", label: "Study", number: "05" },
  { id: "section-skills", label: "Toolkit", number: "06" },
  { id: "section-contact", label: "Transmit", number: "07" },
];

export default function SignalRail({ variant = "a" }: { variant?: "a" | "b" }) {
  const [active, setActive] = useState("section-hero");
  const [pastHero, setPastHero] = useState(false);
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.02, 0.2, 0.6] }
    );
    CHAPTERS.forEach(({ id }) => document.getElementById(id) && observer.observe(document.getElementById(id)!));

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        fill.current?.style.setProperty("transform", `scaleY(${max > 0 ? window.scrollY / max : 0})`);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", update); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    const update = () => setPastHero(window.scrollY > window.innerHeight * 0.82);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <nav className={`signal-rail ${variant === "b" ? "signal-rail--deferred" : ""} ${pastHero ? "is-revealed" : ""}`} aria-label="Story chapters">
      <div className="signal-rail__line" aria-hidden><span ref={fill} /></div>
      <ol>
        {CHAPTERS.map((chapter) => {
          const current = active === chapter.id;
          return (
            <li key={chapter.id}>
              <button
                onClick={() => document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth" })}
                aria-current={current ? "step" : undefined}
                className={current ? "is-active" : ""}
              >
                <span className="signal-rail__dot" aria-hidden />
                <span className="signal-rail__number">{chapter.number}</span>
                <span className="signal-rail__label">{chapter.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
