"use client";

// Should this client mount heavy WebGL / expensive effects right now?
// False on low-tier devices and after a live memory downgrade (perf:lite).
// Null while capability is unknown prevents constructing a temporary fallback
// renderer immediately before the real scene mounts.

import { useEffect, useState } from "react";
import { computeDeviceTier } from "./perf";
import { logEvent } from "./log";

export function useHeavyOk(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    // The WebGL hero now mounts on touch devices too, so the 3D object is
    // consistent with desktop — a phone shows the same object, not a swapped-in
    // CSS stand-in. We only fall back for a genuine capability floor: a `low`
    // tier (data-saver / very slow net / 4-core-or-less / ≤4GB RAM) or a live
    // memory downgrade (perf-lite). Those are about the device being unable to
    // afford WebGL, never about battery.
    const decide = () => {
      const tier = computeDeviceTier();
      const lite = document.documentElement.classList.contains("perf-lite");
      const heavy = tier !== "low" && !lite;
      setOk(heavy);
      logEvent("hero_mode", { mode: heavy ? "webgl" : "proofcore", tier, perfLite: lite });
    };
    decide();
    const onLite = () => setOk(false);
    window.addEventListener("perf:lite", onLite);
    return () => window.removeEventListener("perf:lite", onLite);
  }, []);
  return ok;
}
