// ── The tour script ──────────────────────────────────────────
// Not a résumé. A story, in five acts, told in the FIRST PERSON.
//
// Ember is the director, not the narrator. Ember opens the film and closes
// it; in between, the voice is mine — "I", "my", "I built". Every fact here
// is verified and lives in config/portfolio (no invented numbers).
//
// A chapter is a scene: an act card, a camera move, a spotlight, then
// narration delivered as BEATS. A beat can carry a `cue` that fires the
// instant it begins speaking — that is how "a hundred and thirty-two" lands
// exactly as the counter starts to climb. Movement always finishes before
// any beat is spoken (the runner awaits the camera). Never speak while
// scrolling.

export interface Beat {
  /** One spoken line. Kept short so it feels like talking, not reading. */
  text: string;
  /** Dispatched as `film:cue` the moment this beat starts — for synced visuals. */
  cue?: string;
  /** Extra beat between the end of this line and the next. */
  holdMs?: number;
}

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

// Ember's framing lines — spoken from the dock, third person, as the director.
export const DIRECTOR_INTRO =
  "Would you like to hear Sankalp's story? Dim the lights — I'll let him tell it.";
export const DIRECTOR_OUTRO_HANDBACK =
  "And that's the tour. Ask me anything, or take a look around.";

// The closing line is Sankalp's own — first person, then Ember returns.
export const CLOSING_LINE =
  "That's my story. Now I'd love to hear yours.";

export const TOUR: TourChapter[] = [
  {
    id: "who",
    act: "ACT I",
    title: "WHO I AM",
    section: "section-about",
    align: 0.16,
    cardHoldMs: 1000,
    beats: [
      { text: "I'm Sankalp.", holdMs: 120 },
      { text: "I'm an AI engineer — but I think like a product person.", holdMs: 120 },
      { text: "That combination is the whole point of me.", holdMs: 120 },
      { text: "I don't build models to win a demo. I build systems people can actually depend on.", holdMs: 120 },
      { text: "Because the impressive part of AI is easy. The dependable part is the real work.", holdMs: 200 },
    ],
    holdMs: 350,
  },
  {
    id: "reliability",
    act: "ACT II",
    title: "WHERE I LEARNED RELIABILITY",
    section: "section-arc",
    align: 0.18,
    cardHoldMs: 1000,
    beats: [
      { text: "Reliability isn't a buzzword to me. I earned it the hard way.", holdMs: 120 },
      { text: "Three years at FIS Global — financial systems, where a wrong number has real consequences.", cue: "arc:fis", holdMs: 150 },
      { text: "You don't get to hand-wave there. It either works, every single day, or it doesn't ship.", holdMs: 150 },
      { text: "So I automated the parts people dreaded, and cut ninety percent of the manual work.", cue: "arc:impact", holdMs: 150 },
      { text: "That discipline is something you can't fake. It's in everything I build now.", holdMs: 200 },
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
      { text: "Ten agents take a raw spreadsheet and turn it into a deployed model — on their own.", cue: "flagship:agents", holdMs: 180 },
      { text: "But autonomy without safety is just a liability. So I built the guardrails first.", holdMs: 150 },
      { text: "A hundred and thirty-two automated tests stand behind it.", cue: "flagship:tests", holdMs: 350 },
      { text: "When something breaks, it recovers — it repairs its own code and keeps going.", cue: "flagship:recover", holdMs: 300 },
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
      { text: "So here's how I actually think.", holdMs: 120 },
      { text: "Every tool I reach for — LangGraph, retrieval, evaluation — has to earn its place.", cue: "think:stack", holdMs: 150 },
      { text: "The test is simple: does it make the result more trustworthy? If not, I don't use it.", holdMs: 150 },
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
      { text: "This portfolio isn't a page about my work.", holdMs: 120 },
      { text: "It is my work. The guide, the voice, the system reasoning around you — I built all of it.", cue: "why:meta", holdMs: 200 },
      { text: "So everything I just told you, you can see for yourself. You're standing inside the proof.", holdMs: 250 },
      // The closing line ("That's my story…") is delivered ONLY as the centered
      // farewell card on exit — not as a caption — so it never appears twice.
    ],
    holdMs: 300,
  },
];
