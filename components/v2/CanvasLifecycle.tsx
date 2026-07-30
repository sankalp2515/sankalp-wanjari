"use client";

// ── WebGL context disposer ───────────────────────────────────
// Drop <CanvasLifecycle/> inside any <Canvas>. On unmount (which now happens
// when useCanvasVisible reports the canvas far off-screen) it forces the GL
// context to be released instead of lingering — the step that actually returns
// GPU/native memory to the OS. It also reports the live-context count to the
// perf governor so a budget breach can be judged on the real memory driver,
// not the JS heap (which never sees WebGL bytes).
//
// forceContextLoss() is the documented way to make a browser drop a context's
// backing store immediately rather than on GC; gl.dispose() releases the
// renderer's own programs/buffers. Doing both on unmount keeps concurrent
// contexts to the 1-2 near the viewport.

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { onContextCreate, onContextDispose } from "@/lib/perf";

export default function CanvasLifecycle() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    onContextCreate();
    // Swallow the synthetic loss we trigger ourselves so it never surfaces as
    // a console error or a "context lost" overlay.
    const canvas = gl.domElement;
    const swallow = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", swallow, false);
    return () => {
      canvas.removeEventListener("webglcontextlost", swallow, false);
      onContextDispose();
      try {
        gl.dispose();
        gl.forceContextLoss();
      } catch {
        /* context already gone — nothing to reclaim */
      }
    };
  }, [gl]);
  return null;
}
