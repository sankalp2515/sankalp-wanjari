// ─────────────────────────────────────────────────────────────────────────
//  EXPERIENCE — MASTER SWITCH  (the "Stage" 3D rebuild)
// ─────────────────────────────────────────────────────────────────────────
//
//  ┌─ TO REVERT THE ENTIRE 3D REDESIGN ────────────────────────────────────┐
//  │  Change the line below to:   export const EXPERIENCE = "a";           │
//  │  Save. Done.                                                          │
//  │  The site returns to the previous variant-A portfolio exactly as it   │
//  │  was. No git, no file deletion, no rebuild of logic.                  │
//  └───────────────────────────────────────────────────────────────────────┘
//
//  WHY A FLAG AND NOT A REWRITE
//  Variant A is NOT modified by this pass. Every new surface lives in
//  components/v3/* and app/stage.css. The only touched pre-existing files
//  are Landing.tsx (one branch) and AmbientBackground.tsx (one gated prop),
//  and both fall through to their original behaviour when this is "a".
//
//  ESCAPE HATCHES (always available regardless of this constant)
//    /?experience=a   → force the classic variant A
//    /?experience=b   → force the film variant B
//    /?experience=c   → force the 3D Stage
//
//  WHAT "c" ADDS
//    • A scroll-driven camera dolly through a 3D world (native scroll kept,
//      so every existing feature — Nav, SignalRail, BehaviorTracker, film
//      mode, the concierge's [NAV:x] tool — keeps working untouched).
//    • The Lab particle Core promoted to a persistent, page-level object
//      that travels the world with the visitor. Geometry never changes.
//    • Scroll-velocity-reactive typography.
//    • Off-grid, non-repeating section layouts.
//    • Ambient background with real dynamic range.

export type ExperienceId = "a" | "b" | "c";

export const EXPERIENCE: ExperienceId = "c";

/** Sub-switches, for tuning without leaving the 3D build. */
export const STAGE = {
  /** Master: the DOM camera dolly (sections flying in from depth). */
  dolly: true,
  /** Master: scroll-velocity-reactive typography. */
  kineticType: true,
  /** Master: the persistent WebGL Core that travels the world. */
  core: true,
  /** Master: ambient background dynamic range (near-black while reading). */
  ambientRange: true,
  /** World depth in CSS pixels a section travels from spawn to camera. */
  depth: 900,
  /** Max blur (px) applied to a section at full distance. */
  farBlur: 7,
} as const;
