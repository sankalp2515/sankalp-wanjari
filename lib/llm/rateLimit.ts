// ── Provider Health Tracking ────────────────────────────────
// IP rate limiting now lives in lib/rateStore (durable via Upstash). This
// module tracks per-provider health only — which is intentionally in-memory:
// health self-corrects per instance (a failing provider is retried after a
// short cooldown), so cross-instance sharing buys nothing here.

interface ProviderHealth {
  failures: number;
  cooledUntil: number; // Unix ms — skip this provider until this time
}

// Per-provider failure counter
const provHealth = new Map<string, ProviderHealth>();

const FAILURE_THRESHOLD     = 3;   // transient failures before a provider is cooled off
const COOLDOWN_MS           = 5 * 60 * 1000;  // 5 min — for transient trouble (429/5xx/timeout)
const CONFIG_COOLDOWN_MS    = 30 * 60 * 1000; // 30 min — for misconfiguration (4xx that won't self-heal)

// Why two classes: a 429 or a network timeout is worth retrying soon — the
// provider is fine, just busy. A 400/401/403/404 means the endpoint, model
// slug, or key is WRONG; retrying it every few minutes just burns latency on
// every visitor (see the openrouter/ollama 404s in the logs). Sideline those
// hard, so a dead provider costs the chain one strike, not one per request.
export type FailureKind = "transient" | "config";

// ── Provider health tracking ───────────────────────────────

/** Record a failure for a provider. Returns true if now in cooldown. */
export function recordProviderFailure(
  providerId: string,
  kind: FailureKind = "transient",
): boolean {
  const h = provHealth.get(providerId) ?? { failures: 0, cooledUntil: 0 };

  if (kind === "config") {
    // One strike is enough — a misconfig won't fix itself mid-session. Cools
    // for a long stretch; clears on process restart / redeploy (where a config
    // change would actually land).
    h.cooledUntil = Date.now() + CONFIG_COOLDOWN_MS;
    h.failures    = 0;
    provHealth.set(providerId, h);
    return true;
  }

  h.failures++;
  if (h.failures >= FAILURE_THRESHOLD) {
    h.cooledUntil = Date.now() + COOLDOWN_MS;
    h.failures    = 0; // reset counter so it can fail again after cooldown
  }

  provHealth.set(providerId, h);
  return h.cooledUntil > Date.now();
}

/** Returns true if the provider is currently healthy (not in cooldown). */
export function isProviderHealthy(providerId: string): boolean {
  const h = provHealth.get(providerId);
  if (!h) return true;
  return Date.now() >= h.cooledUntil;
}

/**
 * Every provider in the chain just failed in a single request. Cool them all
 * at once, briefly.
 *
 * Without this, /api/ai/health lies: a keyless provider (Ollama) needs
 * FAILURE_THRESHOLD strikes before it looks unhealthy, so a deployment where
 * localhost:11434 is unreachable would report ok=true forever — and the dock
 * would power up, re-ask, fail, and power down again in a loop. A chain that
 * exhausted is direct evidence nothing is answering; say so.
 *
 * The window is short (not COOLDOWN_MS) so the client's 30s backoff can
 * actually observe recovery instead of waiting out a 5-minute penalty.
 */
const CHAIN_COOLDOWN_MS = 45 * 1000;

export function markChainExhausted(providerIds: string[]): void {
  const until = Date.now() + CHAIN_COOLDOWN_MS;
  for (const id of providerIds) {
    const h = provHealth.get(id) ?? { failures: 0, cooledUntil: 0 };
    h.cooledUntil = Math.max(h.cooledUntil, until);
    provHealth.set(id, h);
  }
}

/** Reset cooldown for a provider (e.g. after a successful call). */
export function recordProviderSuccess(providerId: string): void {
  const h = provHealth.get(providerId);
  if (h) { h.failures = 0; h.cooledUntil = 0; }
}

// ── IP → Provider hash assignment ─────────────────────────

/**
 * Deterministically maps an IP string to a starting index in the provider list.
 * Same IP always starts from the same provider (session affinity).
 */
export function hashIPToProviderIndex(ip: string, providerCount: number): number {
  if (providerCount === 0) return 0;
  let hash = 5381;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) + hash) + ip.charCodeAt(i);
    hash = hash & hash; // convert to 32-bit int
  }
  return Math.abs(hash) % providerCount;
}
