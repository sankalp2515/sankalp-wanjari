// ── LLM Orchestrator ─────────────────────────────────────────
// Two deterministic jobs. Deterministic on purpose: a real LLM "planner" call
// would add a whole extra round-trip to every message and wreck latency on a
// portfolio, so planning is a cheap heuristic, never a model call.
//
//  1. PLAN  — pick the ordered provider list for THIS request:
//     • Small/normal chat → fast tier first (Groq): lowest latency, best for
//       short Q&A. Big-context providers are NOT used, so latency never regresses.
//     • Genuinely large input (e.g. a pasted long document) → escalate to
//       providers that can hold it, NVIDIA (1M) first, then Gemini (1M).
//
//  2. ADAPT — remember what's working. On a rate-limit/error a provider is
//     demoted to the BACK immediately (no waiting for it to recover); the next
//     healthy provider becomes first and stays first while it keeps answering.
//     State is in-memory per instance and self-heals — same philosophy as the
//     provider-health tracker in rateLimit.ts.
//
// When every provider is demoted/exhausted, the route's markChainExhausted →
// reserve-power path takes over, unchanged.

import { LLMProvider } from "./providers";

// Rough token estimate — ~4 chars/token for English. Only needs to be good
// enough to decide "small vs large"; exactness is unnecessary here.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Above this many INPUT tokens we treat the request as large-context and
// escalate. Below it, the small fast models answer better AND faster.
const LARGE_INPUT_TOKENS = 24_000;
// Reserve headroom for the model's own reply when checking context fit.
const OUTPUT_HEADROOM_TOKENS = 2_000;

// Demotion windows. Transient trouble (429/5xx/timeout) → short, so a busy
// provider steps aside and returns quickly. Config errors (wrong key/slug) →
// long, since they won't self-heal mid-session.
const SOFT_DEMOTE_MS   = 60_000;
const CONFIG_DEMOTE_MS = 30 * 60_000;

interface ProviderState {
  lastSuccess: number;    // Unix ms of the last good answer (recency = ranking boost)
  penalizedUntil: number; // Unix ms — sorted to the back until this passes
}
const state = new Map<string, ProviderState>();

/** A provider just answered — clear any penalty and mark it freshly good. */
export function noteSuccess(id: string): void {
  state.set(id, { lastSuccess: Date.now(), penalizedUntil: 0 });
}

/** A provider just failed — demote it to the back of the queue immediately. */
export function notePenalty(id: string, kind: "transient" | "config"): void {
  const s = state.get(id) ?? { lastSuccess: 0, penalizedUntil: 0 };
  s.penalizedUntil = Date.now() + (kind === "config" ? CONFIG_DEMOTE_MS : SOFT_DEMOTE_MS);
  state.set(id, s);
}

const roleRank: Record<LLMProvider["role"], number> = { fast: 0, balanced: 1, large: 2 };

export interface Plan {
  providers: LLMProvider[];
  estTokens: number;
  large: boolean;
}

/**
 * Order `available` providers for this request. `promptText` is the full text
 * that will be sent (system prompt + messages) — used only to size the request.
 */
export function planProviders(available: LLMProvider[], promptText: string): Plan {
  const estTokens = estimateTokens(promptText);
  const needed = estTokens + OUTPUT_HEADROOM_TOKENS;
  const large = estTokens >= LARGE_INPUT_TOKENS;

  // Fit filter — never send a prompt to a provider that can't hold it. If
  // nothing fits (extreme input), fall back to the largest-context providers.
  let candidates = available.filter((p) => p.contextWindow >= needed);
  if (candidates.length === 0) {
    candidates = [...available].sort((a, b) => b.contextWindow - a.contextWindow);
  }

  const now = Date.now();
  const ranked = [...candidates].sort((a, b) => {
    const sa = state.get(a.id);
    const sb = state.get(b.id);
    const da = (sa?.penalizedUntil ?? 0) > now;
    const db = (sb?.penalizedUntil ?? 0) > now;

    // 1. Non-demoted before demoted — the heart of "don't wait on a failed one".
    if (da !== db) return da ? 1 : -1;
    // Among demoted providers: whichever recovers soonest goes first.
    if (da && db) return (sa!.penalizedUntil) - (sb!.penalizedUntil);

    // 2. Task-appropriate base order. Large tasks want the big-context
    //    specialist (NVIDIA, role "large") first, then by raw context size.
    //    Small tasks want the fast tier first.
    if (large) {
      const la = a.role === "large" ? 0 : 1;
      const lb = b.role === "large" ? 0 : 1;
      if (la !== lb) return la - lb;
      if (a.contextWindow !== b.contextWindow) return b.contextWindow - a.contextWindow;
    } else {
      const ra = roleRank[a.role];
      const rb = roleRank[b.role];
      if (ra !== rb) return ra - rb;
    }

    // 3. Recent winners first — keeps a currently-working provider pinned at the
    //    front across requests until it stumbles.
    return (sb?.lastSuccess ?? 0) - (sa?.lastSuccess ?? 0);
  });

  return { providers: ranked, estTokens, large };
}
