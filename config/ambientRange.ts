// ─────────────────────────────────────────────────────────────────────────
//  AMBIENT RANGE — MASTER SWITCH
// ─────────────────────────────────────────────────────────────────────────
//
//  ┌─ TO REVERT THIS PASS ─────────────────────────────────────────────────┐
//  │  Change the line below to:   export const AMBIENT_RANGE = false;      │
//  │  Save. Done. The ambient field returns to its previous uniform look.  │
//  └───────────────────────────────────────────────────────────────────────┘
//
//  WHAT IT DOES
//  The layered field (aurora + horizon + grid + grain + vignette) was
//  uniformly active at every scroll position, which read as wallpaper.
//  With this on, every layer's opacity is driven by --scroll-va (absolute
//  scroll velocity, published once per frame by lib/scrollField): near-black
//  and still while the visitor is stationary — i.e. reading — and surging at
//  chapter transitions and high scroll velocity. The vignette runs the other
//  way: it CLOSES IN when still, darkening the page around what is being
//  read, then opens as travel resumes.
//
//  HOW IT REVERTS CLEANLY
//  When true, .ambient-field carries `ambient-field--range`. Every rule of
//  this pass is scoped under that class and lives in one block at the end of
//  app/globals.css. False → the class disappears, none of those rules match,
//  and the original .ambient-field__* declarations apply untouched.
//
//  NOTE: no opacity transition is declared on these layers. The velocity
//  value is already smoothed in JS; an 800ms CSS transition would fight it
//  and turn every surge into mush. Transitions stay on background/colour.

export const AMBIENT_RANGE = true;
