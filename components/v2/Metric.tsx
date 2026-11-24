"use client";

// A number that counts up once, just before it scrolls into view.
// Handles "90%", "99.2%", "7th", "0/28", "3+": the first number animates, the
// prefix and suffix stay put, decimals keep their precision.
// The server renders the FINAL value (correct for SEO, no-JS and screenshots);
// the reset-to-zero happens off-screen (rootMargin below the fold), so nobody
// sees the jump. Reduced motion: the final value, no animation.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function Metric({ value, duration = 1400 }: { value: string; duration?: number }) {
  const reduced = useReducedMotion();
  const m = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const prefix = m?.[1] ?? "";
  const target = m ? parseFloat(m[2]) : null;
  const decimals = m?.[2].includes(".") ? m[2].split(".")[1].length : 0;
  const suffix = m?.[3] ?? "";
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null); // null = final value

  useEffect(() => {
    if (reduced || target === null || target === 0) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
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
  }, [reduced, target, duration]);

  if (target === null) return <span>{value}</span>;
  const n = shown === null ? m![2] : shown.toFixed(decimals);
  return (
    <span ref={ref} className="tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden>{prefix}{n}{suffix}</span>
    </span>
  );
}
