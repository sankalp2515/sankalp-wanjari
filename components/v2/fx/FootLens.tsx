"use client";

// FootLens — the footer's giant name under a lens (FX_LENS).
// A second copy of the letters sits exactly over the first, in amber, and is
// masked to a soft disc that trails the cursor. Outside the footer (or on
// touch / reduced motion) the disc has zero size, so nothing shows.

import { useEffect, useRef } from "react";

export default function FootLens({ letters }: { letters: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
    const cur = { x: 0, y: 0, r: 0 }, tgt = { x: 0, y: 0, r: 0 };
    let raf = 0;
    const tick = () => {
      cur.x += (tgt.x - cur.x) * .14; cur.y += (tgt.y - cur.y) * .14; cur.r += (tgt.r - cur.r) * .12;
      el.style.setProperty("--lx", `${cur.x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${cur.y.toFixed(1)}px`);
      el.style.setProperty("--lr", `${cur.r.toFixed(1)}px`);
      const moving = Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) + Math.abs(tgt.r - cur.r) > .4;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onMove = (e: PointerEvent) => {
      const b = host.getBoundingClientRect();
      if (tgt.r === 0) { cur.x = e.clientX - b.left; cur.y = e.clientY - b.top; }
      tgt.x = e.clientX - b.left; tgt.y = e.clientY - b.top;
      tgt.r = Math.min(220, Math.max(120, b.height * 0.42));
      kick();
    };
    const onLeave = () => { tgt.r = 0; kick(); };
    const foot = host.closest("footer") ?? host;
    foot.addEventListener("pointermove", onMove as EventListener, { passive: true });
    foot.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      foot.removeEventListener("pointermove", onMove as EventListener);
      foot.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <span ref={ref} className="foot3__lens" aria-hidden>
      {letters.map((l, i) => <span key={i} style={{ ["--i" as string]: i }}>{l}</span>)}
    </span>
  );
}
