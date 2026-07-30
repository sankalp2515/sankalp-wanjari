"use client";

import { useEffect, useRef, useState } from "react";

// ── Offscreen render-loop pause + FAR-offscreen teardown for R3F canvases ──
// A <Canvas> with the default frameloop="always" keeps running rAF + a full
// WebGL draw every frame even when scrolled far off-screen — wasted GPU, CPU,
// and battery. But pausing the loop (frameloop="never") does NOT free a single
// byte: the GL context, geometries, textures and framebuffers stay resident.
// On a long-scroll page with 5-6 canvases that is what pins the tab above 1GB
// of GPU/native memory (invisible to performance.memory, which sees the JS
// heap only).
//
// So this hook manages TWO stages:
//
//   visible  → feed to `frameloop={visible ? "always" : "never"}`. Pauses the
//              loop for a canvas just off-screen — instant, dead-frame-free
//              resume because the context is still live. Cheap CPU lever.
//
//   mounted  → gate the <Canvas> itself: `{mounted && <Canvas/>}`. When a
//              canvas has been FAR off-screen for `dwellMs`, React unmounts it
//              and (with a <CanvasLifecycle/> disposer inside) the GL context
//              is released — the only lever that moves native/GPU bytes. A
//              dwell timer means a fast scroll-through never thrashes context
//              creation (the genuinely expensive path this used to fear).
//
// Net effect: only the canvases near the viewport hold contexts, instead of
// every canvas on the page at once.
export function useCanvasVisible(opts?: {
  /** Pause the loop when outside this band (cheap, keeps context). */
  pauseMargin?: string;
  /** Keep the canvas MOUNTED within this band; unmount beyond it. */
  unmountMargin?: string;
  /** Must stay far-offscreen this long before we tear the context down. */
  dwellMs?: number;
}) {
  const { pauseMargin = "300px", unmountMargin = "150%", dwellMs = 1200 } = opts ?? {};
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);
  // True while the cinematic tour is running a camera dolly. During a drift the
  // scroll rAF and the WebGL draw loops compete for the main thread, which is
  // what made the tour stutter/flicker. We suspend the render loop for the drift
  // (the compositor still moves the already-rendered canvas), then resume.
  // Initialized lazily from any dolly already in flight when this canvas mounts.
  const [drifting, setDrifting] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("film-drifting"),
  );
  const unmountTimer = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    // Stage 1 — pause/resume the render loop around the viewport.
    const pauseIO = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01, rootMargin: pauseMargin },
    );

    // Stage 2 — debounced mount/unmount much further out. Entering cancels any
    // pending teardown; leaving schedules one after a dwell so a scroll-past
    // never rebuilds the context.
    const mountIO = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (unmountTimer.current !== null) {
            clearTimeout(unmountTimer.current);
            unmountTimer.current = null;
          }
          setMounted(true);
        } else if (unmountTimer.current === null) {
          unmountTimer.current = window.setTimeout(() => {
            unmountTimer.current = null;
            setMounted(false);
          }, dwellMs);
        }
      },
      { threshold: 0, rootMargin: unmountMargin },
    );

    pauseIO.observe(el);
    mountIO.observe(el);
    return () => {
      pauseIO.disconnect();
      mountIO.disconnect();
      if (unmountTimer.current !== null) clearTimeout(unmountTimer.current);
    };
  }, [pauseMargin, unmountMargin, dwellMs]);

  useEffect(() => {
    const onDrift = (e: Event) => setDrifting(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener("film:drift", onDrift);
    return () => window.removeEventListener("film:drift", onDrift);
  }, []);

  return { ref, visible: visible && !drifting, mounted };
}
