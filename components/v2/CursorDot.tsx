"use client";

// CursorDot — the template-grade custom cursor: an amber dot that
// tracks instantly plus a ring that trails on a spring, swelling over
// interactive elements. Desktop fine-pointer only; reduced-motion and
// touch users keep the native cursor untouched.

import { useEffect, useRef, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const wantsCursor = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label, .tilt-card";

export default function CursorDot() {
  const active = useSyncExternalStore(emptySubscribe, wantsCursor, () => false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("custom-cursor");

    let x = -100, y = -100;   // pointer
    let rx = -100, ry = -100; // ring (lerped)
    let hoverScale = 1;
    let visible = false;
    let raf = 0;

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${hoverScale})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };
    const onOver = (e: PointerEvent) => {
      hoverScale = (e.target as Element | null)?.closest?.(INTERACTIVE) ? 1.9 : 1;
    };
    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none rounded-full"
        style={{
          zIndex: 100002,
          width: 6,
          height: 6,
          background: "var(--os-accent)",
          opacity: 0,
          transition: "opacity 0.25s ease",
        }}
        aria-hidden
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none rounded-full"
        style={{
          zIndex: 100001,
          width: 30,
          height: 30,
          border: "1.5px solid color-mix(in srgb, var(--os-accent) 55%, transparent)",
          opacity: 0,
          transition: "opacity 0.25s ease",
        }}
        aria-hidden
      />
    </>
  );
}
