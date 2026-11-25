"use client";

// PosterRibbon — the Work section's index of every non-flagship build, as a
// tilted CSS-3D ring of posters (premium pass, config/premiumPass.ts:
// RIBBON_IN_WORK). It replaces the old "decision wall" grid and carries the
// same information: whichever poster faces you is read out beside the ring
// (category, name, proof, the problem, the call, the proof), with
// "Full breakdown" and the code link.
//
//  • The ring turns with scroll while the section is pinned; the arrows (and
//    ←/→ keys when focused) step it one build at a time.
//  • JS writes one CSS variable per frame (--spin), only while on screen; the
//    3D itself is CSS transforms, no WebGL.
//  • Reduced motion: no scroll spin, arrows still step (without easing).

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { projects, projectProof } from "@/config/portfolio";
import { GithubIcon } from "@/components/ui/Icons";

type Project = (typeof projects)[number];

const firstSentence = (t: string) => {
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).trim();
};

// How far the ring turns across the pinned scroll, in degrees.
const SCROLL_TURN = 300;

export default function PosterRibbon({
  items,
  onOpen,
  head,
}: {
  items: Project[];
  onOpen: (id: string) => void;
  /** Header row (title + lens chips), rendered inside the pinned frame. */
  head?: React.ReactNode;
}) {
  const n = Math.max(items.length, 1);
  const step = 360 / n;
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [front, setFront] = useState(0);
  const offset = useRef(0); // manual steps from the arrows, in degrees
  const scrollAngle = useRef(0);

  // Radius from the card count so neighbours sit edge to edge at any n.
  const radius = Math.max(1.05, 0.56 / Math.tan(Math.PI / Math.max(n, 3)) + 0.12);

  const apply = useCallback(() => {
    const angle = scrollAngle.current + offset.current;
    ringRef.current?.style.setProperty("--spin", `${angle}deg`);
    const idx = ((Math.round(-angle / step) % n) + n) % n;
    setFront((f) => (f === idx ? f : idx));
  }, [n, step]);

  // Scroll → angle, only while the section is near the viewport.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let active = false;
    const measure = () => {
      raf = 0;
      if (!reduced) {
        const r = el.getBoundingClientRect();
        const span = r.height - window.innerHeight;
        const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
        scrollAngle.current = -p * SCROLL_TURN;
      }
      apply();
    };
    const onScroll = () => { if (active && !raf) raf = requestAnimationFrame(measure); };
    const io = new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active) onScroll(); }, { rootMargin: "200px 0px" });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    measure();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [apply]);

  // A new lens (different n) starts from the first build again.
  useEffect(() => { offset.current = 0; apply(); }, [items, apply]);

  const turn = (dir: 1 | -1) => { offset.current -= dir * step; apply(); };

  const p = items[front];
  const proof = p ? projectProof[p.id] : undefined;

  return (
    <div ref={rootRef} className="ribbon" style={{ "--n": n, "--rf": radius } as React.CSSProperties}>
      <div className="ribbon__sticky">
        {head && <div className="ribbon__head">{head}</div>}
        <div
          className="ribbon__stage"
          tabIndex={0}
          aria-label="Builds ring. Use the left and right arrow keys to turn it."
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); turn(1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
          }}
        >
          <p className="ribbon__word" aria-hidden>Work</p>
          <div ref={ringRef} className="ribbon__ring">
            {items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                className={`ribbon__card${i === front ? " is-front" : ""}`}
                style={{ "--i": i } as React.CSSProperties}
                onClick={() => onOpen(it.id)}
                aria-label={`Open ${it.name} breakdown`}
                tabIndex={-1}
              >
                <span className="ribbon__face">
                  <Image src={it.poster} alt="" fill sizes="280px" loading="lazy" />
                </span>
                <span className="ribbon__face ribbon__face--back" aria-hidden>
                  <Image src={it.poster} alt="" fill sizes="280px" loading="lazy" />
                </span>
              </button>
            ))}
          </div>
        </div>

        {p && (
          <div className="ribbon__read" aria-live="polite">
            <div className="ribbon__id">
              <p className="ribbon__count">
                <span>{String(front + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")} · {p.category} · {p.year}
              </p>
              <h3 className="ribbon__name">{p.name}</h3>
              {proof && <p className="ribbon__proof">{proof}</p>}
              <div className="ribbon__actions">
                <button type="button" className="ds-btn ds-btn--primary" onClick={() => onOpen(p.id)}>
                  Full breakdown <ArrowUpRight size={15} aria-hidden />
                </button>
                {p.github && (
                  <a className="ribbon__icon" href={p.github} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} source on GitHub`}>
                    <GithubIcon size={16} />
                  </a>
                )}
                <span className="ribbon__arrows">
                  <button type="button" className="ribbon__icon" onClick={() => turn(-1)} aria-label="Previous build"><ArrowLeft size={16} aria-hidden /></button>
                  <button type="button" className="ribbon__icon" onClick={() => turn(1)} aria-label="Next build"><ArrowRight size={16} aria-hidden /></button>
                </span>
              </div>
            </div>
            <dl className="ribbon__dl">
              <div><dt>The problem</dt><dd>{firstSentence(p.breakdown.problem)}</dd></div>
              <div><dt>The call</dt><dd>{firstSentence(p.breakdown.approach)}</dd></div>
              <div><dt>The proof</dt><dd>{p.breakdown.results[0]}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
