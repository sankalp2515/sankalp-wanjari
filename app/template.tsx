// Route template (AWARD_MOTION, config/awardPass.ts). A template re-mounts on
// every navigation, so the veil inside it plays once per page change: a paper
// panel with an amber line that wipes upward to reveal the new page. It is a
// separate fixed layer, never a transform on the page itself, so fixed UI
// (nav, Helios) stays put and first paint is not held back. CSS lives in the
// AWARD PASS block of app/globals.css; reduced motion hides it.
import type { ReactNode } from "react";
import { AWARD_MOTION, AWARD_VFX } from "@/config/awardPass";
import IntroShutter from "@/components/v2/IntroShutter";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      {AWARD_MOTION && <div className="ap-veil" aria-hidden />}
      {AWARD_VFX && <IntroShutter />}
      {children}
    </>
  );
}
