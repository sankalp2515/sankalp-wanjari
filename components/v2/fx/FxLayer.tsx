"use client";

// FxLayer — mounts the round-3 pointer effects (config/awardPass.ts) once the
// page has loaded and the browser is idle, so none of it competes with first
// paint or hydration. Loaded through next/dynamic, so it is its own chunk.

import { useEffect, useState } from "react";
import { FX_FIELD, FX_DISTORT } from "@/config/awardPass";
import FieldLens from "./FieldLens";
import PosterDistort from "./PosterDistort";

export default function FxLayer() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle = 0, timer = 0;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const go = () => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      else timer = window.setTimeout(() => setReady(true), 800);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
    };
  }, []);
  if (!ready) return null;
  return <>{FX_FIELD && <FieldLens />}{FX_DISTORT && <PosterDistort />}</>;
}
