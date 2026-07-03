"use client";

// ── AmbientBackground ────────────────────────────────────────
// Cursor-reactive aurora. GPU-cheap by design: the glow comes from
// radial gradients whose transparent falloff is *naturally* soft —
// NO blur filters (those allocate huge offscreen buffers and were the
// site's biggest GPU-memory cost). Grid + vignette + noise layer above.

import { useEffect, useRef, useState } from "react";

export default function AmbientBackground() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = (e: Event) => setActive((e as CustomEvent<boolean>).detail);
    window.addEventListener("agent-typing-change", on);
    return () => window.removeEventListener("agent-typing-change", on);
  }, []);

  // Cursor parallax — throttled to one rAF per move, writes CSS vars only
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--cx", String(e.clientX / window.innerWidth));
        el.style.setProperty("--cy", String(e.clientY / window.innerHeight));
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const glow = active ? 1 : 0.72;

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
      style={{ background: "var(--os-bg)", "--cx": "0.5", "--cy": "0.5" } as React.CSSProperties}
    >
      {/* Aurora — layered radial gradients, NO blur filter.
          Positions track the cursor via the CSS vars; the gradients'
          soft transparent falloff gives the dreamy glow for free. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: glow,
          transition: "opacity 1.2s ease",
          backgroundImage: `
            radial-gradient(closest-side at calc(30% + (var(--cx) - 0.5) * 22%) calc(28% + (var(--cy) - 0.5) * 18%),
              color-mix(in srgb, var(--os-accent) 42%, transparent), transparent 72%),
            radial-gradient(closest-side at calc(72% - (var(--cx) - 0.5) * 18%) calc(58% + (var(--cy) - 0.5) * 14%),
              color-mix(in srgb, var(--os-accent-cyan) 34%, transparent), transparent 70%),
            radial-gradient(closest-side at 45% 90%,
              color-mix(in srgb, var(--os-accent) 26%, transparent), transparent 68%),
            radial-gradient(closest-side at 88% 10%,
              color-mix(in srgb, var(--os-accent-green) 20%, transparent), transparent 66%)
          `,
          backgroundRepeat: "no-repeat",
          backgroundSize: "82% 82%, 72% 72%, 76% 76%, 46% 46%",
        }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--os-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--os-grid-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: "calc(var(--os-grid-opacity) * 2.5)",
          maskImage: "radial-gradient(ellipse at 50% 35%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 35%, black 20%, transparent 75%)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 28%, transparent 35%, color-mix(in srgb, var(--os-bg) 75%, transparent) 100%)",
        }}
      />

      {/* Noise — kills gradient banding */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}
