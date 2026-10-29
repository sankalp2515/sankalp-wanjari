"use client";

import { useSyncExternalStore } from "react";

let preference: MediaQueryList | undefined;
const query = () => preference ??= window.matchMedia("(prefers-reduced-motion: reduce)");
const subscribe = (listener: () => void) => {
  const media = query();
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
const snapshot = () => query().matches;

// Server and first hydration render must agree. CSS already stops motion for
// reduced-motion users before this subscription updates their React layout.
// Reading the preference directly on the first client render regenerated the
// entire SSR tree (notably the static/animated marquee branches).
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
