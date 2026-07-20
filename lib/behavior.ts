// ── Visitor behavior log ─────────────────────────────────────
// Every meaningful action lands here (section views, case studies,
// questions asked, skills highlighted, tour, resume). The nudge engine
// sends a summary of THIS log to the LLM so suggestions are grounded in
// what the visitor actually did — never pre-decided copy.
//
// Session-scoped, capped, client-only. No PII beyond what the visitor
// typed into the concierge on this device.

export type BehaviorEntry = { t: number; e: string; d?: string };

const KEY = "behavior-log";
const CAP = 60;

function read(): BehaviorEntry[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as BehaviorEntry[];
  } catch {
    return [];
  }
}

export function track(e: string, d?: string) {
  if (typeof window === "undefined") return;
  try {
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

export function getLog(): BehaviorEntry[] {
  return typeof window === "undefined" ? [] : read();
}

// Compact, LLM-readable summary of the session so far.
export function summarize(): string {
  const log = getLog();
  if (log.length === 0) return "No actions yet — the visitor just arrived.";

  const mins = Math.round((Date.now() - log[0].t) / 60000);
  const pick = (e: string) => log.filter((x) => x.e === e);
  const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean))] as string[];

  const parts: string[] = [`~${Math.max(mins, 1)} min on site`];
  const views = uniq(pick("view").map((x) => x.d)).map((s) => s.replace("section-", ""));
  if (views.length) parts.push(`sections viewed: ${views.join(" → ")}`);
  const cases = uniq(pick("case-open").map((x) => x.d));
  if (cases.length) parts.push(`case studies opened: ${cases.join(", ")}`);
  const skills = uniq(pick("skill").map((x) => x.d));
  if (skills.length) parts.push(`skills highlighted: ${skills.join(", ")}`);
  const asked = pick("asked").slice(-3).map((x) => `"${(x.d ?? "").slice(0, 80)}"`);
  if (asked.length) parts.push(`asked the AI: ${asked.join("; ")}`);
  if (pick("tour-done").length) parts.push("completed the guided tour");
  if (pick("resume-open").length) parts.push("opened the resume");

  return parts.join(" · ");
}
