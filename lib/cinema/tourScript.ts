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
  /** DOM section id the camera travels to before narration begins. */
  section?: string;
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

// Structure follows how a recruiter actually processes a candidate: credibility
// before identity, problem before architecture, evidence before philosophy.
// ACT I earns the claims the rest of the tour makes — so we open on the three
// years at FIS, not on a title. Every number here is verified in
// config/portfolio (90% less manual entry, 50+ layouts, 132 tests, the
// research system's CI-enforced zero fabricated citations). Nothing invented.
export const TOUR: TourChapter[] = [
  {
    id: "reliability",
    act: "ACT I",
    title: "WHERE I LEARNED RELIABILITY",
    section: "section-arc",
    align: 0.18,
    cardHoldMs: 1000,
    beats: [
      { text: "Before I ever built AI, I spent three years building banking software — the kind where a wrong number has real consequences.", cue: "arc:fis", holdMs: 150 },
      { text: "Bank data migrations, across U.S. and U.K. systems. You don't hand-wave there. It works every single day, or it doesn't ship.", holdMs: 150 },
      { text: "So I automated the part everyone dreaded — one pipeline that read more than fifty different document layouts.", holdMs: 150 },
      { text: "It cut the manual data entry by ninety percent.", cue: "arc:impact", holdMs: 200 },
      { text: "And that's what stuck with me: nobody cares how clever a system is if they can't trust it. Reliability isn't a feature — it's the whole job.", holdMs: 250 },
    ],
    holdMs: 350,
  },
  {
    id: "who",
    act: "ACT II",
    title: "WHO I AM",
    section: "section-about",
    align: 0.16,
    cardHoldMs: 1000,
    beats: [
      { text: "I'm Sankalp. I build AI systems people can depend on — and I think like a product person.", holdMs: 150 },
      { text: "Because the impressive part of AI is easy now. The dependable part is still the real work.", holdMs: 200 },
    ],
    holdMs: 350,
  },
  {
    id: "build",
    act: "ACT III",
    title: "WHAT I BUILD",
    section: "section-work",
    align: 0.14,
    event: { name: "stage:case", detail: "001" },
    cardHoldMs: 1100,
    beats: [
      { text: "Let me show you the one I'm proudest of.", holdMs: 150 },
      { text: "Training a machine-learning model is hours of expert, repetitive decisions. I wanted that to run itself — without losing the quality.", holdMs: 180 },
      { text: "So I built it as ten agents. Give it a spreadsheet and describe the goal in plain English. A deployed, evaluated model comes out.", cue: "flagship:agents", holdMs: 180 },
      { text: "But autonomy without safety is just a faster way to fail. So the guardrails came first.", holdMs: 150 },
      { text: "A hundred and thirty-two automated tests stand behind it.", cue: "flagship:tests", holdMs: 350 },
      { text: "When its own code breaks, it rewrites and re-runs it in a locked-down sandbox — and keeps going.", cue: "flagship:recover", holdMs: 150 },
      { text: "And it never ships a number it can't defend. Every result clears an evaluation gate first.", cue: "flagship:eval", holdMs: 350 },
      { text: "That's not a demo. That's engineering.", holdMs: 200 },
    ],
    holdMs: 350,
  },
  {
    id: "think",
    act: "ACT IV",
    title: "HOW I THINK",
    section: "section-skills",
    align: 0.16,
    event: { name: "stage:case-close", detail: "" },
    cardHoldMs: 1000,
    beats: [
      { text: "That same instinct shows up in everything I build.", holdMs: 120 },
      { text: "In my research assistant, every claim is checked against its source before it ships — so a fabricated citation can't even leave the pipeline.", cue: "think:verify", holdMs: 180 },
      { text: "So every tool I reach for has to earn its place: does it make the result more trustworthy? If not, I don't use it.", cue: "think:stack", holdMs: 150 },
      { text: "I'm not chasing the newest model. I'm chasing the one that survives contact with reality.", holdMs: 200 },
    ],
    holdMs: 350,
  },
  {
    id: "why",
    act: "ACT V",
    title: "WHY THIS PORTFOLIO EXISTS",
    section: "section-contact",
    align: 0.2,
    cardHoldMs: 1100,
    beats: [
      { text: "One last thing — and it's the most important.", holdMs: 120 },
      { text: "This isn't a page about my work. It is my work — the guide, the voice, the system reasoning around you. I built all of it.", cue: "why:meta", holdMs: 200 },
      { text: "So you don't have to take my word for any of it. You're standing inside the proof.", holdMs: 250 },
      { text: "The work I want more of is exactly this: AI where reliability matters as much as intelligence.", holdMs: 250 },
      // The closing line is delivered ONLY as the centered farewell card on
      // exit — not as a caption — so it never appears twice.
    ],
    holdMs: 300,
  },
];
