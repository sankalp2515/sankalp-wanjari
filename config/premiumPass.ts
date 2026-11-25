// ─────────────────────────────────────────────────────────────────────────
//  PREMIUM PASS — SWITCHES (Nov 2026)
// ─────────────────────────────────────────────────────────────────────────
//
//  One switch per change, so each can be kept or reverted on its own.
//  Set any of them to false and save; that change disappears completely.
//
//  CLUTTER_OFF       Feedback pill, sound prompt, Helios first-touch intro,
//                    exit recap and nudges are not mounted. Helios stays
//                    (Ctrl+K + the "Ask Helios" pill).
//  RIBBON_IN_WORK    In the Work section, the "decision wall" grid becomes a
//                    CSS-3D ring of posters with a live readout of the build
//                    facing you (components/v2/PosterRibbon.tsx).
//  MERGE_RECORD      Reliability, Research, Education and Skills collapse
//                    into one "Record" section. OFF: the user preferred the
//                    original four sections.
//  EDITORIAL_PORTRAIT  Monochrome hero portrait. OFF: the user preferred the
//                    colour original.
//
//  Round 2 (closing sections):
//  MARQUEE_BACK      The strip under the hero returns as a logo marquee:
//                    organisations with their one fact, then the tool stack;
//                    it leans into the scroll (components/v2/LogoMarquee.tsx).
//  ABOUT_SCREEN      About text becomes "the 30-second screen": five
//                    recruiter questions answered with evidence and logos;
//                    the bio moves behind "In his own words".
//  RADAR_VISUAL      AI Radar's right column becomes a signal chain
//                    (lab logo → product question → Sankalp's related build)
//                    plus a logo list; the dial gains lab logos.
//  CASES_SPREAD      Case studies become editorial spreads with a clickable
//                    decision path instead of plain cards.
//  CONTACT_LETTER    Contact becomes a fill-in-the-blanks note that composes
//                    itself, a ladder of three ways to reach out, and a live
//                    India-time clock; sending folds the note away.
//
//  Round 3 (user: About "looks AI slop", re-think Contact):
//  ABOUT_STORY       About = portrait + three true stories of how Sankalp
//                    works + practical facts (components/v2/AboutStory.tsx).
//                    Replaces ABOUT_SCREEN (now off) and the reel layout.
//  CONTACT_BRIEF     Contact = email as the headline + a forwardable,
//                    role-specific candidate brief (copy / email a colleague)
//                    + a one-line note form (ContactBrief.tsx). Replaces
//                    CONTACT_LETTER (now off); the footer's duplicate
//                    "Hiring for an AI product role?" line is hidden.
//
//  CSS for these lives in the "PREMIUM PASS" block at the end of
//  app/globals.css, scoped to classes that only render while a switch is on.

export const CLUTTER_OFF = true;
export const RIBBON_IN_WORK = true;
export const MERGE_RECORD = false;
export const EDITORIAL_PORTRAIT = false;
export const MARQUEE_BACK = true;
export const ABOUT_SCREEN = false;
export const RADAR_VISUAL = true;
export const CASES_SPREAD = true;
export const CONTACT_LETTER = false;
export const ABOUT_STORY = true;
export const CONTACT_BRIEF = true;
