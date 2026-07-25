"use client";

// Should this client mount heavy WebGL / expensive effects right now?
// False on low-tier devices and after a live memory downgrade (perf:lite).
// Starts pessimistic during SSR/first paint so we never hydrate a canvas the
// device can't afford, then upgrades once the governor confirms capacity.

import { useEffect, useState } from "react";
import { computeDeviceTier } from "./perf";
import { MOBILE_TUNING } from "@/config/mobileTuning";

export function useHeavyOk(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    // #2 — on touch devices, skip the hero WebGL point cloud and use the
    // CSS ProofCore instead. Same silhouette, no GPU context / rAF. Gated by
    // the master switch, so MOBILE_TUNING=false restores the old behaviour.
    const coarse =
      MOBILE_TUNING &&
      typeof matchMedia !== "undefined" &&
      matchMedia("(pointer: coarse)").matches;
    const decide = () =>
      setOk(
        !coarse &&
        computeDeviceTier() !== "low" &&
        !document.documentElement.classList.contains("perf-lite"),
      );
    decide();
    const onLite = () => setOk(false);
    window.addEventListener("perf:lite", onLite);
    return () => window.removeEventListener("perf:lite", onLite);
  }, []);
  return ok;
}
