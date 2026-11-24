"use client";

// True once the visitor has scrolled past most of the hero. Overlays (Helios
// intro, sound prompt) wait for it so the first screen stays one clean
// impression (design-system/MASTER.md §1). Sticky: once true, stays true.

import { useEffect, useState } from "react";

export function usePastHero(fraction = 0.75): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    if (past) return;
    const check = () => {
      if (window.scrollY > window.innerHeight * fraction) setPast(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [past, fraction]);
  return past;
}
