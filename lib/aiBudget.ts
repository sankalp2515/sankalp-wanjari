"use client";

// ── Client-side AI budget governor ───────────────────────────
// The server caps /api/ai at 30 requests/hour/IP. That single bucket is shared
// by EVERYTHING — the chat the visitor is actively using AND the proactive,
// behind-the-scenes calls (nudges today; exit-recap etc. later). Without a
// governor, a burst of proactive calls can exhaust the bucket and start
// 503-ing the chat — the one surface that actually converts.
//
// This module gives proactive calls their own, smaller budget that sits well
// under the server cap, so background features can never starve user-initiated
// ones. Two priorities:
//   • user      — chat, "interrogate this project": always allowed (server cap
//                 is the only limit). We only RECORD these, to pace proactive.
//   • proactive — nudges, recap: allowed only if budget + spacing permit.
//
// State is session-scoped (sessionStorage) and best-effort — if storage is
// blocked, proactive simply errs toward staying quiet.

const HOUR = 3_600_000;
const KEY = "ai-budget-v1";

// Deliberately conservative — leaves the lion's share of the server's 30/hr for
// the visitor's own chat.
const PROACTIVE_MAX_PER_HOUR = 8;
// Minimum spacing between two proactive calls, so triggers that fire close
// together (e.g. idle + case-open) can't double-spend.
const PROACTIVE_MIN_GAP_MS = 25_000;
// Stay quiet right after a user-initiated call — a proactive popup landing on
// top of the visitor's own question feels broken.
const YIELD_AFTER_USER_MS = 8_000;

interface Store { proactive: number[]; lastUser: number }

function read(): Store {
  if (typeof window === "undefined") return { proactive: [], lastUser: 0 };
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
    return {
      proactive: Array.isArray(s.proactive) ? s.proactive : [],
      lastUser: typeof s.lastUser === "number" ? s.lastUser : 0,
    };
  } catch {
    return { proactive: [], lastUser: 0 };
  }
}

function write(s: Store): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch { /* best-effort */ }
}

// Single-flight guard — module-scoped, so two proactive triggers firing in the
// same tick can't both slip through the budget check before either records.
let proactiveInFlight = false;

/** Record a user-initiated AI call, so proactive calls pace around it. */
export function noteUserSpend(): void {
  const s = read();
  s.lastUser = Date.now();
  write(s);
}

/** Would a proactive call be allowed right now? (Pure check, no side effects.) */
export function canSpendProactive(): boolean {
  if (proactiveInFlight) return false;
  const now = Date.now();
  const s = read();
  const recent = s.proactive.filter((t) => now - t < HOUR);
  if (recent.length >= PROACTIVE_MAX_PER_HOUR) return false;
  const last = recent[recent.length - 1] ?? 0;
  if (now - last < PROACTIVE_MIN_GAP_MS) return false;
  if (now - s.lastUser < YIELD_AFTER_USER_MS) return false;
  return true;
}

/**
 * Run a proactive AI call only if the budget allows it, single-flighted.
 * Returns the fn's result, or `null` WITHOUT calling fn when the budget says
 * no — callers fall back to their deterministic template in that case.
 */
export async function spendProactive<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!canSpendProactive()) return null;
  proactiveInFlight = true;
  const now = Date.now();
  const s = read();
  s.proactive = s.proactive.filter((t) => now - t < HOUR);
  s.proactive.push(now);
  write(s);
  try {
    return await fn();
  } finally {
    proactiveInFlight = false;
  }
}
