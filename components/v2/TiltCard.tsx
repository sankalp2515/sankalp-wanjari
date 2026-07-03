"use client";

// Pointer-driven 3D tilt. Pure CSS-variable transforms — no library,
// no rAF loop while idle. Disabled on touch and reduced-motion via CSS.

import { ReactNode, useRef } from "react";

const MAX_TILT = 7; // degrees

export default function TiltCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top) / r.height;   // 0..1
    el.style.setProperty("--tilt-y", `${(px - 0.5) * 2 * MAX_TILT}deg`);
    el.style.setProperty("--tilt-x", `${(0.5 - py) * 2 * MAX_TILT}deg`);
    el.style.setProperty("--sheen-x", `${px * 100}%`);
    el.style.setProperty("--sheen-y", `${py * 100}%`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div className="tilt-wrap h-full">
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={onClick}
        className={`tilt-card relative h-full ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
