// ─────────────────────────────────────────────────────────────────────────
//  AWARD PASS — SWITCHES (Nov 2026)
// ─────────────────────────────────────────────────────────────────────────
//
//  The five gaps from the Awwwards review, one switch each. Set any to
//  false and rebuild; that change disappears completely. Each switch puts a
//  class on <html> (ap-type, ap-unify, ap-perf, ap-motion) that scopes its
//  CSS in the "AWARD PASS" block at the end of app/globals.css, or mounts
//  its component, so nothing leaks when it is off.
//
//  AWARD_TYPE      Typography: Bricolage Grotesque for display, Geist for
//                  body, Geist Mono for the few labels that stay mono.
//                  OFF: Inter Tight / Inter / JetBrains Mono.
//  AWARD_UNIFY     One design language: one card (radius, border, surface),
//                  one hover (2px lift + border, 1.03 image zoom), labels in
//                  sentence-case sans instead of mono capitals, one section
//                  opener (large display numeral + title) on every section.
//  AWARD_PERF      Performance + accessibility: off-screen sections render
//                  lazily (content-visibility), contrast and accessible-name
//                  fixes from the Lighthouse audit.
//  AWARD_FIREWALL  Signature interaction: "Try to break my firewall", a live
//                  miniature of IntentSeal's two layers (detector + intent-
//                  bound action guard) with a model playing the agent
//                  (components/v2/FirewallPlayground.tsx, /api/firewall).
//  AWARD_MOTION    Motion craft: a once-per-session intro sequence on the
//                  hero (transform-only, so it never delays first paint) and
//                  a page transition on every route change (app/template.tsx).
//
//  Round 2 (user: "still static, no VFX, playground is only text, 60-30-10?"):
//  AWARD_COLOR     60-30-10 colour structure in light theme: 60% paper, 30%
//                  deep-ink bands (Firewall, Achievements, Contact + footer),
//                  10% amber for actions and the one word that matters. Ink
//                  bands open from an inset rounded panel as they scroll in.
//  AWARD_VFX       Visual effects: the firewall becomes a particle scene
//                  (FirewallScene.tsx), the first-visit intro is an ink
//                  screen that decodes the name and dissolves into tiles
//                  (IntroShutter.tsx), and the hero's giant name reacts to
//                  the cursor (HeroNameFX.tsx). Canvas 2D, paused off-screen,
//                  replaced by still frames under reduced motion.

//  Round 3 (user picked 1, 2, 3, 5, 6 + "a background that follows"):
//  FX_TYPE         Section titles change weight and width as they scroll in
//                  (Bricolage's variable wght + wdth axes, CSS scroll timeline,
//                  no JS). Loads the variable font file instead of 5 statics.
//  FX_DECODE       Metrics decode out of scrambled glyphs instead of counting
//                  up (the intro's language, reused). Metric.tsx.
//  FX_DISTORT      Project images ripple and split into colour channels under
//                  the cursor: one shared WebGL canvas, created on first hover
//                  (components/v2/fx/PosterDistort.tsx). Mouse only.
//  FX_LENS         The footer's giant name shows in amber inside a soft lens
//                  that follows the cursor (FootLens.tsx, CSS mask).
//  FX_RADAR        AI Radar comes alive: a fading trail behind the sweep, the
//                  signal chain lights node by node and keeps sending packets,
//                  headline rows are scanned as they scroll in. CSS + SVG.
//  FX_FIELD        The background: a faint ink dot grid printed on the paper,
//                  and a lens that trails the cursor and pushes the dots apart
//                  (components/v2/fx/FieldLens.tsx, canvas drawn only near the
//                  cursor and only while something moves). Touch and reduced
//                  motion get the still grid. OFF: the user didn't like it.
//  FX_STUDIO       Replaces the warm "paper" ground with a photo studio: a
//                  neutral grey sweep lit from above (a soft white falloff at
//                  the top that calms as you scroll), white cards that float
//                  by tone instead of borders, neutral ink bands, and a fine
//                  grain so the light never bands. CSS only (globals.css).

export const AWARD_TYPE = true;
export const AWARD_UNIFY = true;
export const AWARD_PERF = true;
export const AWARD_FIREWALL = true;
export const AWARD_MOTION = true;
export const AWARD_COLOR = true;
export const AWARD_VFX = true;

export const FX_TYPE = true;
export const FX_DECODE = true;
export const FX_DISTORT = true;
export const FX_LENS = true;
export const FX_RADAR = true;
export const FX_FIELD = false; // user: "didn't like it" (2026-11-28)
export const FX_STUDIO = true;

/** Classes stamped on <html> by app/layout.tsx. */
export const awardClasses = [
  AWARD_TYPE && "ap-type",
  AWARD_UNIFY && "ap-unify",
  AWARD_PERF && "ap-perf",
  AWARD_MOTION && "ap-motion",
  AWARD_COLOR && "ap-color",
  AWARD_VFX && "ap-vfx",
  FX_TYPE && "fx-type",
  FX_DECODE && "fx-decode",
  FX_DISTORT && "fx-distort",
  FX_LENS && "fx-lens",
  FX_RADAR && "fx-radar",
  FX_FIELD && "fx-field",
  FX_STUDIO && "fx-studio",
].filter(Boolean).join(" ");

// ─────────────────────────────────────────────────────────────────────────
//  PALETTE PREVIEW (2026-11-28): two bolder 60/30/10 palettes from the
//  user's references, both on a near-black ground. CSS only: every rule
//  lives under html[data-pal="…"] in the "PALETTES" block of globals.css.
//
//  "lime"  60 midnight black #0A0A0A · 30 pure white #F5F5F2 (Awards +
//          Contact become white sections, white buttons) · 10 lime #C6F432
//  "blue"  60 midnight #07080C · 30 electric blue #2448FF (Awards +
//          Contact become blue sections, a blue stage light) · 10 sunset
//          orange #FF7A1A (actions and the one word that matters)
//
//  PALETTE          the palette everyone gets ("" = the current site).
//  PALETTE_PREVIEW  shows a small switcher (bottom-left) to flip between
//                   Current / Lime / Blue live; the choice is remembered in
//                   this browser only. ?pal=lime|blue|off also works.
//  To revert completely: PALETTE = "" and PALETTE_PREVIEW = false.
// ─────────────────────────────────────────────────────────────────────────
export const PALETTE: "" | "lime" | "blue" = "";
export const PALETTE_PREVIEW = false;
