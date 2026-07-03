"use client";

// Count-up number — parses values like "3+", "90%", "132", "10" and
// animates the numeric part when scrolled into view. Falls back to
// static text for reduced-motion.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export default function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
  const reduced = useReducedMotion();
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";

  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (reduced || target === null) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const t0 = performance.now();
        const tick = () => {
          const p = Math.min((performance.now() - t0) / duration, 1);
          setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, target, duration]);

  if (reduced || target === null) return <span>{value}</span>;
  return (
    <span ref={ref} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}
