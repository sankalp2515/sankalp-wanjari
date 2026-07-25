"use client";

import { useEffect, useRef, useState } from "react";

// ── Offscreen render-loop pause for R3F canvases ───────────────
// A <Canvas> with the default frameloop="always" keeps running rAF + a full
// WebGL draw every frame even when scrolled far off-screen — pure wasted GPU,
// CPU, and battery. On a long-scroll page with several canvases that's most of
// them burning cycles at any moment.
//
// This returns a wrapper ref + a `visible` flag. Feed the flag to the Canvas as
// `frameloop={visible ? "always" : "never"}` — the loop pauses when off-screen
// WITHOUT tearing down the GL context (unmount/remount churns GPU memory and is
// far more expensive than a paused-but-live context). Mirrors NeuralField.
//
// `rootMargin` pre-warms the loop slightly before the canvas scrolls into view
// so there's never a visible "dead frame" on entry.
export function useCanvasVisible(rootMargin = "200px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, visible };
}
