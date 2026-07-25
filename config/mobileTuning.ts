// ─────────────────────────────────────────────────────────────────────────
//  MOBILE TUNING — MASTER SWITCH
// ─────────────────────────────────────────────────────────────────────────
//
//  This is the single kill-switch for the mobile UX / performance pass
//  (audit recommendations #1–#6: perf-mid shedding, WebGL fallback on touch,
//  scroll-transform gating, hero card collapse, floating-element stacking,
//  type & tap-target floor).
//
//  ┌─ TO REVERT EVERYTHING ────────────────────────────────────────────────┐
//  │  Change the line below to:   export const MOBILE_TUNING = false;       │
//  │  Save. Done.                                                           │
//  │  No git. No rebuild of logic. The whole pass switches off at once and  │
//  │  the site returns to its previous behaviour.                          │
//  └───────────────────────────────────────────────────────────────────────┘
//
//  HOW IT WORKS
//  • When true, <html> gets the class `mobile-tuned` (applied in Landing).
//  • ALL new CSS lives under `html.mobile-tuned …` and is additionally gated
//    by (pointer: coarse) / max-width, so desktop is never affected either
//    way — flag on or off.
//  • ALL new JS behaviour (WebGL fallback, transform gating) reads this flag,
//    so flipping it to false makes those branches fall through to the
//    original code path.
//
//  Because both layers key off ONE constant, false = a clean, total revert.

export const MOBILE_TUNING = true;
