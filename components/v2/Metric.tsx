"use client";

// A number that counts up once, just before it scrolls into view.
// Handles "90%", "99.2%", "7th", "0/28", "3+": the first number animates, the
// prefix and suffix stay put, decimals keep their precision.
// The server renders the FINAL value (correct for SEO, no-JS and screenshots);
// the reset-to-zero happens off-screen (rootMargin below the fold), so nobody
// sees the jump. Reduced motion: the final value, no animation.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { FX_DECODE } from "@/config/awardPass";

// FX_DECODE: instead of counting, every letter and digit cycles through
// glyphs and settles left to right (digits through digits, so the width
// barely moves). Punctuation (%, ., /, +) stays put.
const DIGITS = "0123456789";
const GLYPHS = "ABCDEFGHJKLMNPRSTUVXYZ#%&$";
function scramble(text: string, settled: number) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (i < settled || !/[0-9A-Za-z]/.test(ch)) out += ch;
    else if (/[0-9]/.test(ch)) out += DIGITS[(Math.random() * 10) | 0];
    else { const g = GLYPHS[(Math.random() * GLYPHS.length) | 0]; out += ch === ch.toLowerCase() ? g.toLowerCase() : g; }
  }
  return out;
}

export default function Metric({ value, duration = 1400 }: { value: string; duration?: number }) {
  const reduced = useReducedMotion();
  const m = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const prefix = m?.[1] ?? "";
  const target = m ? parseFloat(m[2]) : null;
  const decimals = m?.[2].includes(".") ? m[2].split(".")[1].length : 0;
  const suffix = m?.[3] ?? "";
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null); // null = final value
  const [decoded, setDecoded] = useState<string | null>(null); // FX_DECODE frame

  useEffect(() => {
    if (reduced || target === null || target === 0) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      if (FX_DECODE) {
        const total = Math.max(700, duration * 0.8);
        let last = 0;
        const step = (now: number) => {
          const p = Math.min((now - t0) / total, 1);
          if (p >= 1) { setDecoded(null); return; }
          // ~22 fps for the glyph churn reads as a decoder, not a blur.
          if (now - last > 45) { last = now; setDecoded(scramble(value, Math.floor(Math.max(0, p * 1.25 - 0.2) * value.length))); }
          raf = requestAnimationFrame(step);
        };
        setDecoded(scramble(value, 0));
        raf = requestAnimationFrame(step);
        return;
      }
      const tick = () => {
        const p = Math.min((performance.now() - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        setShown(p >= 1 ? null : target * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
    }, { rootMargin: "0px 0px 12% 0px" });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [reduced, target, duration, value]);

  if (target === null) return <span>{value}</span>;
  const n = shown === null ? m![2] : shown.toFixed(decimals);
  return (
    <span ref={ref} className="tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden>{decoded ?? `${prefix}${n}${suffix}`}</span>
    </span>
  );
}
