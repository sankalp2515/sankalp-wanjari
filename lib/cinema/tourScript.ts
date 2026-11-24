// ── The tour script ──────────────────────────────────────────
// Not a résumé. A story, in five acts, told in the FIRST PERSON.
//
// Helios is the director, not the narrator. Helios opens the film and closes
// it; in between, the voice is mine — "I", "my", "I built". Every fact here
// is verified and lives in config/portfolio (no invented numbers).
//
// A chapter is a scene: an act card, a camera move, a spotlight, then
// narration delivered as BEATS. A beat can carry a `cue` that fires the
// instant it begins speaking — that is how "a hundred and thirty-two" lands
// exactly as the counter starts to climb. Movement always finishes before
// any beat is spoken (the runner awaits the camera). Never speak while
// scrolling.

import type { VoiceName } from "./voiceAssets";

export interface Beat {
  /** One spoken line. Kept short so it feels like talking, not reading. */
  text: string;
  /** Dispatched as `film:cue` the moment this beat starts — for synced visuals. */
  cue?: string;
  /** Extra beat between the end of this line and the next. */
  holdMs?: number;
  /** Before this beat is spoken, glide the chapter's `camera` element to this
   *  scroll progress (0..1). Used to land the decision film on a beat exactly
   *  as it is narrated. A chapter with any `at` beat does not drift. */
  at?: number;
}

// Every beat inside an act is Sankalp speaking in the first person — that's the
// whole conceit. Helios only ever speaks the framing lines below. Rather than
// tag every beat, the voice is derived by position: BEATS = sankalp, framing =
// helios. This constant documents that and is used by the generator and runner.
export const BEAT_VOICE: VoiceName = "sankalp";
export const DIRECTOR_VOICE: VoiceName = "helios";

export interface TourChapter {
  id: string;
  /** "ACT I" — the big label on the chapter card. */
  act: string;
  /** "WHO I AM" — the chapter title. */
  title: string;
  /** DOM section id that is spotlit (kept bright) for this chapter. */
  section?: string;
  /** Element id the camera frames/drifts through, when it is not the whole
   *  section (e.g. one decision-film chapter inside the Work section). */
  camera?: string;
  /** Where the section frames in the viewport (0=top … 0.5=center). */
  align?: number;
  /** Optional stage event fired after the camera settles (e.g. open a case). */
  event?: { name: string; detail: string };
  /** How long the act card holds alone before the camera starts moving. */
  cardHoldMs: number;
  /** The narration, beat by beat. */
  beats: Beat[];
  /** Silence after the last beat, before the next act. The breath. */
  holdMs: number;
}

// Helios's framing lines — spoken from the dock, third person, as the director.
export const DIRECTOR_INTRO =
  "Would you like to hear Sankalp's story? Dim the lights — I'll let him tell it.";
export const DIRECTOR_OUTRO_HANDBACK =
  "And that's the tour. Ask me anything, or take a look around.";

// The closing line is Sankalp's own — first person, then Helios returns. An
// invitation, never a pitch: the tour has already made the case, so the last
// thing the visitor hears just opens a door.
export const CLOSING_LINE =
  "If something here made you curious — that's usually where the best conversations start.";

// Structure follows the redesigned page (design-system/MASTER.md §8) and how
// an APM reviewer processes a candidate: evidence first, then judgement
// (decisions and their costs), then one build told as decisions, then
// awareness of the field, then the meta-proof. Every fact is verified in
// config/portfolio (90% less manual entry, ET AI Hackathon 2nd nationally, 7th of 3,062, the ArthRakshak
// decisions, IntentSeal's published numbers). Nothing invented.
export const TOUR: TourChapter[] = [
  {
    id: "proof",
    act: "ACT I",
    title: "EVIDENCE FIRST",
    section: "section-proof",
    cardHoldMs: 900,
    beats: [
      { text: "I'm Sankalp. I'm an AI product manager who also builds — so let me start with evidence, not claims.", holdMs: 150 },
      { text: "At FIS, I spent three years on banking software. One pipeline I built cut manual data entry by ninety percent.", cue: "proof:fis", holdMs: 150 },
      { text: "The AI security layer I'll show you next placed second in India, at the Economic Times AI Hackathon.", cue: "proof:et", holdMs: 150 },
      { text: "And in a twenty-four-hour build against three thousand and sixty-two teams, I finished seventh.", cue: "proof:rank", holdMs: 250 },
    ],
    holdMs: 300,
  },
  {
    id: "decide",
    act: "ACT II",
    title: "HOW I DECIDE",
    section: "section-decisions",
    cardHoldMs: 900,
    beats: [
      { text: "But numbers aren't the job. Decisions are — and every decision costs something.", holdMs: 150 },
      { text: "On ArthRakshak, a finance tool for people with irregular income, research showed the signup wall was where people dropped off. So we removed it.", cue: "decide:d1", holdMs: 150 },
      { text: "That made the engineering harder. It was still the right trade.", holdMs: 150 },
      { text: "And when our AI credit engine failed internal testing, we shipped simple rules with an honesty notice instead of overpromising.", cue: "decide:d4", holdMs: 250 },
    ],
    holdMs: 300,
  },
  {
    id: "build",
    act: "ACT III",
    title: "WHAT I BUILD",
    section: "section-work",
    camera: "film-007",
    cardHoldMs: 1000,
    beats: [
      { text: "Here's that build, told the same way. AI agents read untrusted pages and files — then act with real permissions.", at: 0.1, holdMs: 200 },
      { text: "So I separated detection from authority: every tool call is checked against what the user actually intended.", at: 0.36, holdMs: 200 },
      { text: "It's strong on documents and weaker on direct chat — and I published both numbers, not just the good one.", at: 0.62, holdMs: 200 },
      { text: "With detection switched off, none of the twenty-eight reference attacks got through.", at: 0.88, holdMs: 300 },
    ],
    holdMs: 300,
  },
  {
    id: "watch",
    act: "ACT IV",
    title: "WHAT I WATCH",
    section: "section-radar",
    cardHoldMs: 900,
    beats: [
      { text: "A product manager has to know where the field is moving.", holdMs: 120 },
      { text: "So this radar pulls what the major AI labs shipped this week, and notes what each change means for teams building products.", cue: "radar:live", holdMs: 250 },
    ],
    holdMs: 300,
  },
  {
    id: "why",
    act: "ACT V",
    title: "WHY THIS PORTFOLIO EXISTS",
    section: "section-contact",
    cardHoldMs: 1000,
    beats: [
      { text: "One last thing.", holdMs: 120 },
      { text: "This site is my work too — the guide, the voice, the reasoning around you. I built all of it.", cue: "why:meta", holdMs: 200 },
      { text: "The work I want more of is exactly this: deciding what AI should do, and making sure it can be trusted to do it.", holdMs: 250 },
      // The closing line is delivered ONLY as the centered farewell card on
      // exit — not as a caption — so it never appears twice.
    ],
    holdMs: 300,
  },
];
