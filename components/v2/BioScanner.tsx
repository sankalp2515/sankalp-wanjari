"use client";

// Renders the bio as paragraph bullets, then flies a SINGLE detection scanner
// continuously from keyword to keyword. Flow per keyword:
//   1. the reticle glides to the (still-normal-size) phrase,
//   2. once it has ARRIVED, the phrase magnifies + glows and the reticle
//      re-frames snugly around the enlarged word (object-detection / magnifier),
//   3. the reticle moves on to the next phrase. Loops forever.
//
// Perf: the whole loop (interval, measuring, animation) only runs while the
// card is actually on screen — see `inView` below.

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";

const DWELL_MS = 1600; // total time spent per keyword
const TRAVEL_MS = 420; // reticle travel time before the word is allowed to grow
// Modest magnify: with no neighbour-push, a large scale would overlap
// adjacent words, so keep it subtle — the reticle + colour carry the emphasis.
const SCALE = 1.07;

export default function BioScanner({ bio, keywords }: { bio: string; keywords: string[] }) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const inView = useInView(containerRef, { margin: "-10% 0px" });
  const [active, setActive] = useState(0); // where the reticle is headed
  const [arrived, setArrived] = useState(0); // -1 while travelling; == active once locked on
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const running = inView && !reduced;

  const paragraphs = bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const splitRe = new RegExp(`(${escaped.join("|")})`, "g");
  const total = paragraphs.reduce((acc, p) => acc + (p.match(splitRe)?.length ?? 0), 0);
  let renderIdx = 0;

  // Advance the reticle in a continuous loop — only while on screen.
  useEffect(() => {
    if (!running || total <= 1) return;
    const t = setInterval(() => setActive((i) => (i + 1) % total), DWELL_MS);
    return () => clearInterval(t);
  }, [running, total]);

  // Gate the magnify: clear the highlight the moment we start travelling, then
  // lock on (grow the word) only after the reticle has had time to arrive.
  useEffect(() => {
    if (!running) return;
    setArrived(-1);
    const id = window.setTimeout(() => setArrived(active), TRAVEL_MS);
    return () => window.clearTimeout(id);
  }, [active, running]);

  // Position the reticle around the active phrase. We measure the inner span
  // whose transform IS reflected in getBoundingClientRect, so once the word
  // magnifies the box re-frames around the enlarged glyphs. Skipped entirely
  // when off screen so we never touch layout on hidden content.
  useLayoutEffect(() => {
    if (!running) return;
    const measure = () => {
      const c = containerRef.current;
      const el = spanRefs.current[active];
      if (!c || !el) return;
      const cr = c.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      setBox({ x: er.left - cr.left, y: er.top - cr.top, w: er.width, h: er.height });
    };
    measure();
    // One extra measure after the scale/margin animation settles.
    const id = window.setTimeout(measure, 480);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [active, arrived, running]);

  const renderParagraph = (text: string) => {
    const parts = text.split(splitRe);
    return parts.map((part, i) => {
      if (keywords.includes(part)) {
        const idx = renderIdx++;
        const isActive = running && idx === arrived;
        // No layout shift: the scale is a centered transform, so the phrase
        // grows in place. Keywords read as normal body text until the scanner
        // locks on — then they turn bold + cyan. The scanner IS the highlight,
        // so there's no permanent bold competing with it.
        return (
          <span key={i} className="relative inline-block align-baseline">
            <motion.span
              ref={(el) => {
                spanRefs.current[idx] = el;
              }}
              className="inline-block"
              animate={{
                scale: isActive ? SCALE : 1,
                color: isActive ? "var(--os-accent-cyan)" : "var(--os-text-secondary)",
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                transformOrigin: "center center",
                fontWeight: isActive ? 600 : 400,
                textShadow: isActive
                  ? "0 0 16px color-mix(in srgb, var(--os-accent-cyan) 55%, transparent)"
                  : "none",
                position: "relative",
                zIndex: isActive ? 2 : 1,
              }}
            >
              {part}
            </motion.span>
          </span>
        );
      }
      return <Fragment key={i}>{part}</Fragment>;
    });
  };

  return (
    <div ref={containerRef} className="relative">
      {/* The single roaming scanner reticle */}
      {running && box && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute rounded-md"
          initial={false}
          animate={{ left: box.x - 7, top: box.y - 5, width: box.w + 14, height: box.h + 10 }}
          transition={{ type: "spring", stiffness: 130, damping: 22, mass: 0.9 }}
          style={{
            border: "1px solid color-mix(in srgb, var(--os-accent-cyan) 45%, transparent)",
            background: "color-mix(in srgb, var(--os-accent-cyan) 7%, transparent)",
            boxShadow: "0 0 18px color-mix(in srgb, var(--os-accent-cyan) 28%, transparent)",
            zIndex: 1,
          }}
        >
          {/* Corner brackets — the object-detection frame */}
          {[
            "top-0 left-0 border-t-2 border-l-2 rounded-tl-md",
            "top-0 right-0 border-t-2 border-r-2 rounded-tr-md",
            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-md",
            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-md",
          ].map((c, i) => (
            <span
              key={i}
              className={`absolute w-2.5 h-2.5 ${c}`}
              style={{ borderColor: "var(--os-accent-cyan)" }}
            />
          ))}
        </motion.span>
      )}

      <ul className="flex flex-col gap-2.5">
        {paragraphs.map((para, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              aria-hidden
              className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--os-accent)" }}
            />
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
              {renderParagraph(para)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
