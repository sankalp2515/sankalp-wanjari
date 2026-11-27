"use client";

// HeroNameFX — the hero's giant background name, made alive (AWARD_VFX).
// Each letter is its own span; as the cursor moves across the hero, letters
// near it rise, stretch and darken, falling back with a spring when it
// leaves. One rAF per pointer move (throttled), only while the hero is on
// screen. Touch and reduced motion get the still name.
//
// LCP: the giant name is the page's largest paint, so the first paint is the
// plain one-piece name (the ::before text in globals.css). The per-letter
// spans are only swapped in after the window has loaded and the browser is
// idle; the swap hides the ::before (.is-fx on the parent). Each letter is
// smaller than the whole name, so the swap never becomes a new LCP candidate.

import { useEffect, useRef, useState } from "react";

export default function HeroNameFX({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  // Wait for load + idle before rendering the letters at all.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
    let idle = 0, timer = 0;
    const go = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) idle = ric(() => setReady(true), { timeout: 2500 });
      else timer = window.setTimeout(() => setReady(true), 1200);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      const cic = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idle && cic) cic(idle);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    el.parentElement?.classList.add("is-fx");
    const letters = Array.from(el.querySelectorAll<HTMLElement>("[data-l]"));
    const cur = letters.map(() => 0);
    let target = letters.map(() => 0);
    let raf = 0, visible = true;
    const centres = () => letters.map((l) => { const r = l.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; });
    let pts = centres();

    const tick = () => {
      let moving = false;
      letters.forEach((l, i) => {
        cur[i] += (target[i] - cur[i]) * 0.12;
        if (Math.abs(target[i] - cur[i]) > 0.002) moving = true;
        l.style.setProperty("--k", cur[i].toFixed(3));
      });
      raf = moving && visible ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!visible) return;
      target = pts.map((p) => {
        const d = Math.hypot(e.clientX - p.x, (e.clientY - p.y) * 0.6);
        return Math.max(0, 1 - d / (p.w * 2.2));
      });
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => { target = letters.map(() => 0); if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => { pts = centres(); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pts = centres(); });
    io.observe(el);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onResize, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
      if (raf) cancelAnimationFrame(raf);
      el.parentElement?.classList.remove("is-fx");
    };
  }, [ready]);

  if (!ready) return null;
  return (
    <span ref={ref} className="hero3__fxname">
      {name.split("").map((ch, i) => <span key={i} data-l>{ch}</span>)}
    </span>
  );
}
