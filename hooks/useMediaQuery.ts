"use client";

import { useCallback, useSyncExternalStore } from "react";

// Subscribes to a media query. The server snapshot is `false`, matching the
// previous behaviour (no match until the browser answers).
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
