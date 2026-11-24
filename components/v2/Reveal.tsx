"use client";

// Scroll-reveal wrapper — CSS + ONE shared IntersectionObserver (no Framer).
//
// The server HTML is fully visible (SEO, no-JS, LCP). On mount, a block that is
// still below the fold gets `is-pending` (hidden, lowered); when it nears the
// viewport the observer swaps it to `is-in` and a CSS transition plays.
// Blocks already on screen at mount are never hidden, so nothing flashes.
// Transform + opacity only. Reduced motion: nothing is ever hidden.
//
// Was a framer-motion component with blur + 3D tilt on every block; this keeps
// the look (rise + fade) at a fraction of the hydration and paint cost.

import { ReactNode, useEffect, useRef } from "react";

let io: IntersectionObserver | null = null;
function observer(): IntersectionObserver {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add("is-in");
        el.classList.remove("is-pending");
        io!.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -60px 0px" },
  );
  return io;
}

export default function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  depth,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  /** Kept for API compatibility; the 3D tilt was removed for performance. */
  depth?: number;
}) {
  void depth;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already seen
    el.classList.add("is-pending");
    const o = observer();
    o.observe(el);
    return () => o.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${className ? ` ${className}` : ""}`}
      style={{ "--reveal-delay": `${delay}s`, "--reveal-y": `${y}px` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
