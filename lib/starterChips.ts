"use client";

// ── Starter chips: the most-seen AI surface, un-frozen ────────
// The chips above the chat input used to be four hardcoded strings — the one
// place the "AI portfolio" looked scripted. This makes them behavior- AND
// persona-aware, and genuinely varied:
//
//   1. Preferred: the LLM writes 3–4 questions grounded in what THIS visitor
//      just did (budget-gated, so it never starves the visitor's own chat).
//   2. Fallback (offline / on localhost / budget spent): a behavior-aware,
//      STOCHASTIC pool — it still references the exact project they lingered on
//      and shuffles per call, so it never reads as a frozen menu.
//
// A chip is a question the visitor SENDS, so every candidate here is a real,
// answerable question — clicking it just types it for them.

import { projects } from "@/config/portfolio";
import type { BehaviorSnapshot } from "@/lib/behavior";

export const STATIC_CHIPS = [
  "What's his best work?",
  "When can he start?",
  "What makes him different?",
  "Paste a JD for a fit check",
];

const caseName = (id: string | null) => (id ? projects.find((p) => p.id === id)?.name ?? null : null);

// Fisher–Yates — a fresh order every call is what keeps the fallback from
// looking static across dock opens.
function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const dedupe = (xs: string[]) => [...new Set(xs.map((s) => s.trim()))].filter(Boolean);

// Persona-flavoured staples — the "what this role cares about" questions.
const PERSONA_POOL: Record<string, string[]> = {
  recruiter: ["When can he start?", "What makes him different?", "Is he open to relocation or remote?", "Give me the 30-second summary"],
  cto: ["How does his flagship architecture work?", "How does he handle evaluation and guardrails?", "Where has a system of his broken, and how did he fix it?", "Single agent vs orchestration — why did he choose it?"],
  developer: ["What's his actual stack?", "Which of his repos should I look at first?", "How does this site's agent drive the UI?", "What has he published?"],
  explorer: ["What's the one thing he's proudest of?", "Give me the 45-second highlight reel", "What's the most unexpected thing he's built?", "Where should I start?"],
};

// Turn the behavior snapshot into questions that reference the SPECIFIC thing
// the visitor did — these get priority so at least one chip feels "watched".
function behaviorCandidates(s: BehaviorSnapshot): string[] {
  const out: string[] = [];
  const lastCase = caseName(s.lastCase);
  if (lastCase) {
    out.push(`How does ${lastCase} actually work?`);
    out.push(`What was the hardest trade-off in ${lastCase}?`);
  }
  if (s.cases.length >= 2) out.push("Compare the architectures I've been reading");
  switch (s.topSection) {
    case null: break;
    default:
      if (s.topSection.id === "arc") out.push("Why did he leave banking for AI?");
      else if (s.topSection.id.startsWith("research")) out.push("What did his research papers actually prove?");
      else if (s.topSection.id === "skills") out.push("Which of his skills are the real strengths?");
      else if (s.topSection.id === "education") out.push("Which certifications actually mattered?");
  }
  if (s.tourDone) out.push("What didn't the tour cover that I should know?");
  if (s.resumeOpened) out.push("What's not on the resume that I should ask about?");
  return out;
}

/** A behavior-aware, stochastic chip set — always available, zero network. */
export function fallbackChips(persona: string | null, s: BehaviorSnapshot): string[] {
  const behavior = shuffle(behaviorCandidates(s));
  const staples = shuffle(PERSONA_POOL[persona ?? "explorer"] ?? PERSONA_POOL.explorer);
  // Lead with 1–2 behavior questions (the "watched" hook), fill with persona
  // staples. If there's no behavior yet, it's just a shuffled persona set —
  // still varied, still role-appropriate, never the same four every time.
  const picked = dedupe([...behavior.slice(0, 2), ...staples]).slice(0, 4);
  return picked.length >= 3 ? picked : dedupe([...picked, ...STATIC_CHIPS]).slice(0, 4);
}

/**
 * Ask the LLM for chips grounded in the real behavior log. Returns null on any
 * failure so the caller uses `fallbackChips`. A `nonce` is included so the
 * server's response cache can't collapse every visitor to one frozen set — the
 * chips vary run to run (stochastic), as the feature is meant to.
 */
export async function generateChips(
  persona: string | null,
  behaviorSummary: string,
  nonce: number,
): Promise<string[] | null> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content:
            `INTERNAL CHIP REQUEST (not a visitor message; variation seed ${nonce}). ` +
            `Write starter questions for a ${persona ?? "general"} visitor to tap in Sankalp's portfolio chat.\n` +
            `WHAT THEY ACTUALLY DID THIS SESSION: ${behaviorSummary}\n` +
            `Each chip is a SHORT question the visitor would ask (first person, ≤48 chars, no quotes). ` +
            `At least one MUST reference the specific thing they just did (the exact section or project) so it ` +
            `reads as written for them right now. Keep them answerable by a concierge that knows his work. ` +
            `Vary the phrasing from any obvious default. Reply with STRICT JSON only: an array of 4 strings.`,
        }],
        visitorType: persona,
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = (data.content as string) ?? "";
    const json = raw.match(/\[[\s\S]*\]/)?.[0];
    if (!json) return null;
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;
    const chips = dedupe(
      parsed.filter((c): c is string => typeof c === "string" && c.length >= 6 && c.length <= 60),
    ).slice(0, 4);
    return chips.length >= 3 ? chips : null;
  } catch {
    return null;
  }
}
