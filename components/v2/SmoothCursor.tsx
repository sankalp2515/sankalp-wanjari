"use client";

// SmoothCursor — replaces CursorDot (dot + lerped ring + a rAF loop that ran
// while the ring caught up). This is one element:
//   • the outer node follows the pointer exactly (one transform write per
//     frame, only on pointermove, so nothing runs while the mouse is still);
//   • the inner node eases its scale on hover over interactive targets, which
//     is the only "smooth" part and runs on the compositor via CSS.
// Fine pointers only. Touch devices and prefers-reduced-motion keep the
// native cursor and mount nothing. Over text fields the native caret returns.

import { useEffect, useRef, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const wanted = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const INTERACTIVE = "a, button, [role='button'], summary, label, select";
const TEXT = "input, textarea, [contenteditable='true']";

export default function SmoothCursor() {
  const active = useSyncExternalStore(subscribe, wanted, () => false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    root.classList.add("has-smooth-cursor");

    let x = 0, y = 0, frame = 0;
    const paint = () => {
      frame = 0;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
      const t = e.target as Element | null;
      const state = t?.closest?.(TEXT) ? "text" : t?.closest?.(INTERACTIVE) ? "link" : "idle";
      if (el.dataset.state !== state) el.dataset.state = state;
      if (el.dataset.visible !== "1") el.dataset.visible = "1";
    };
    const onLeave = () => { el.dataset.visible = "0"; };
    const onDown = () => { el.dataset.down = "1"; };
    const onUp = () => { el.dataset.down = "0"; };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      root.classList.remove("has-smooth-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div ref={ref} className="smooth-cursor" data-state="idle" data-visible="0" aria-hidden>
      <span className="smooth-cursor__dot" />
    </div>
  );
}
