// ── Visitor behavior log ─────────────────────────────────────
// Every meaningful action lands here (section views, case studies,
// questions asked, skills highlighted, tour, resume). The nudge engine
// AND the dock's starter chips send a summary of THIS log to the LLM so
// suggestions are grounded in what the visitor actually did — never
// pre-decided copy.
//
// Beyond the raw event list we also keep two derived, intent-grade signals
// that turn "they opened X" into "they LINGERED on X" — the difference between
// a generic tip and something only an AI watching them would say:
//   • dwell     — accumulated ms of attention per section (from view enter/exit)
//   • scroll    — deepest scroll reached, as a % of the page
//
// Session-scoped, capped, client-only. No PII beyond what the visitor
// typed into the concierge on this device.

export type BehaviorEntry = { t: number; e: string; d?: string };

const KEY = "behavior-log";
const DWELL_KEY = "behavior-dwell";
const SCROLL_KEY = "behavior-scroll";
const CAP = 60;

function read(): BehaviorEntry[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as BehaviorEntry[];
  } catch {
    return [];
  }
}

// ── Dwell accounting ─────────────────────────────────────────
// The section the visitor is "in" right now, and since when. When attention
// moves to a different section we flush the elapsed time into the dwell totals.
// Kept in a module variable (survives an SPA session; a reload resets it, which
// is fine — dwell only ever sharpens a suggestion, never gates correctness).
let viewState: { id: string; since: number } | null = null;

function readDwell(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(DWELL_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}
function writeDwell(d: Record<string, number>) {
  try { sessionStorage.setItem(DWELL_KEY, JSON.stringify(d)); } catch { /* best-effort */ }
}
function flushDwell(now: number) {
  if (!viewState) return;
  const d = readDwell();
  d[viewState.id] = (d[viewState.id] ?? 0) + (now - viewState.since);
  writeDwell(d);
}

/** Dwell totals in ms including the section currently being looked at. */
function liveDwell(): Record<string, number> {
  const d = { ...readDwell() };
  if (viewState) d[viewState.id] = (d[viewState.id] ?? 0) + (Date.now() - viewState.since);
  return d;
}

export function track(e: string, d?: string) {
  if (typeof window === "undefined") return;
  try {
    // Attention moved to a new section → bank the time spent on the previous one.
    if (e === "view" && d) {
      const now = Date.now();
      if (!viewState || viewState.id !== d) {
        flushDwell(now);
        viewState = { id: d, since: now };
      }
    }
    const log = read();
    // collapse immediate repeats (e.g. re-entering the same section)
    const last = log[log.length - 1];
    if (last && last.e === e && last.d === d) return;
    log.push({ t: Date.now(), e, ...(d ? { d } : {}) });
    sessionStorage.setItem(KEY, JSON.stringify(log.slice(-CAP)));
  } catch {
    /* storage unavailable — tracking is best-effort */
  }
}

/** Record the deepest scroll reached (0–100). Cheap; call from a scroll handler. */
export function noteScroll(pct: number) {
  if (typeof window === "undefined") return;
  try {
    const prev = Number(sessionStorage.getItem(SCROLL_KEY) ?? "0");
    if (pct > prev) sessionStorage.setItem(SCROLL_KEY, String(Math.min(100, Math.round(pct))));
  } catch { /* best-effort */ }
}
function readScroll(): number {
  try { return Number(sessionStorage.getItem(SCROLL_KEY) ?? "0"); } catch { return 0; }
}

export function getLog(): BehaviorEntry[] {
  return typeof window === "undefined" ? [] : read();
}

// ── Structured snapshot ──────────────────────────────────────
// A machine-readable view of the session used to GROUND both the nudge copy and
// the starter chips (and to pick a stochastic-but-relevant fallback when the LLM
// is unavailable). Where `summarize()` is prose for the model, this is data for
// the client.
export interface BehaviorSnapshot {
  minutes: number;
  sectionsViewed: string[];       // short names, in order first seen (e.g. "about", "work")
  cases: string[];                // case ids opened
  skills: string[];               // skills highlighted
  asked: string[];                // last few genuine questions
  tourDone: boolean;
  resumeOpened: boolean;
  scrollDepthPct: number;         // deepest scroll reached
  /** The section they've paid the MOST attention to, with rounded seconds. */
  topSection: { id: string; secs: number } | null;
  /** The most-recently opened case id, if any. */
  lastCase: string | null;
  /** The section they're looking at right now, if known. */
  lookingAt: string | null;
}

export function behaviorSnapshot(): BehaviorSnapshot {
  const log = getLog();
  const pick = (e: string) => log.filter((x) => x.e === e);
  const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean))] as string[];
  const short = (s: string) => s.replace("section-", "");

  const minutes = log.length ? Math.max(1, Math.round((Date.now() - log[0].t) / 60000)) : 0;
  const dwell = liveDwell();
  const top = Object.entries(dwell).sort((a, b) => b[1] - a[1])[0];
  const cases = uniq(pick("case-open").map((x) => x.d));

  return {
    minutes,
    sectionsViewed: uniq(pick("view").map((x) => x.d)).map(short),
    cases,
    skills: uniq(pick("skill").map((x) => x.d)),
    asked: pick("asked").slice(-3).map((x) => (x.d ?? "").slice(0, 80)),
    tourDone: pick("tour-done").length > 0,
    resumeOpened: pick("resume-open").length > 0,
    scrollDepthPct: readScroll(),
    topSection: top && top[1] > 3000 ? { id: short(top[0]), secs: Math.round(top[1] / 1000) } : null,
    lastCase: cases.length ? cases[cases.length - 1] : null,
    lookingAt: viewState ? short(viewState.id) : null,
  };
}

// Compact, LLM-readable summary of the session so far.
export function summarize(): string {
  const s = behaviorSnapshot();
  if (s.minutes === 0) return "No actions yet — the visitor just arrived.";

  const parts: string[] = [`~${s.minutes} min on site`];
  if (s.sectionsViewed.length) parts.push(`sections viewed: ${s.sectionsViewed.join(" → ")}`);
  if (s.cases.length) parts.push(`case studies opened: ${s.cases.join(", ")}`);
  if (s.skills.length) parts.push(`skills highlighted: ${s.skills.join(", ")}`);
  if (s.asked.length) parts.push(`asked the AI: ${s.asked.map((a) => `"${a}"`).join("; ")}`);
  if (s.tourDone) parts.push("completed the guided tour");
  if (s.resumeOpened) parts.push("opened the resume");
  // The intent-grade signals — this is what makes a suggestion feel "watched".
  if (s.topSection) parts.push(`spent the most time on the ${s.topSection.id} section (~${s.topSection.secs}s)`);
  if (s.lookingAt) parts.push(`looking at the ${s.lookingAt} section right now`);
  if (s.scrollDepthPct >= 25) parts.push(`scrolled ~${s.scrollDepthPct}% down the page`);

  return parts.join(" · ");
}
