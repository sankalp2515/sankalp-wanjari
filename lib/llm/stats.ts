// ── LLM usage stats (in-memory, per instance) ─────────────────
// Counts how often each provider is HIT and how it fared, so you can decide
// which providers to keep or drop next cycle. Read them at /api/ai/stats.
//
// Caveats (be honest about what these numbers are):
//  • In-memory per serverless instance — they reset on cold start and each
//    instance counts only its own traffic. On a low-traffic portfolio that's
//    usually one warm instance, so the picture is representative but not exact.
//  • "attempts" counts every time a provider was TRIED in the fallback chain
//    (so a provider that's always first accrues the most attempts). "ok" is
//    successful answers; the error buckets show WHY the others fell through.

interface ProviderStat {
  attempts: number;      // times this provider was tried
  ok: number;            // successful answers
  rateLimited: number;   // 429s
  configError: number;   // 4xx (bad key/model/endpoint)
  otherError: number;    // 5xx / timeout / network
  lastOkAt: number | null;
  lastErrAt: number | null;
}

function blank(): ProviderStat {
  return { attempts: 0, ok: 0, rateLimited: 0, configError: 0, otherError: 0, lastOkAt: null, lastErrAt: null };
}

const providers = new Map<string, ProviderStat>();
let requests = 0;     // total /api/ai requests that reached the provider chain
let cacheHits = 0;    // answered from the response cache (zero provider hits)
let routerCalls = 0;  // small-model orchestrator classification calls
const startedAt = Date.now();

function get(id: string): ProviderStat {
  let s = providers.get(id);
  if (!s) { s = blank(); providers.set(id, s); }
  return s;
}

export function noteRequest(): void { requests++; }
export function noteCacheHit(): void { cacheHits++; }
export function noteRouterCall(): void { routerCalls++; }
export function noteAttempt(id: string): void { get(id).attempts++; }
export function noteOk(id: string): void { const s = get(id); s.ok++; s.lastOkAt = Date.now(); }
export function noteFailure(id: string, kind: "rate" | "config" | "other"): void {
  const s = get(id);
  if (kind === "rate") s.rateLimited++;
  else if (kind === "config") s.configError++;
  else s.otherError++;
  s.lastErrAt = Date.now();
}

export function snapshot() {
  const totalAnswers = [...providers.values()].reduce((n, s) => n + s.ok, 0);
  return {
    sinceIso: new Date(startedAt).toISOString(),
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    requests,
    cacheHits,
    routerCalls,
    llmAnswerHits: totalAnswers,
    // Total outbound LLM calls ≈ answer attempts + router calls (cache hits cost 0).
    providers: Object.fromEntries([...providers.entries()].map(([id, s]) => [id, { ...s }])),
  };
}
