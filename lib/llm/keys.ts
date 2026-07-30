// ── Multi-key rotation ───────────────────────────────────────
// Free API tiers rate-limit per KEY, not per provider. So the same provider can
// be given several keys (from different accounts) and, when one key is quota'd,
// we roll to the next key BEFORE giving up on the provider entirely. This is the
// difference between "Gemini is down" and "Gemini's first key is busy, use the
// second".
//
// Convention: keys live in env vars `BASE`, `BASE_2`, `BASE_3`, `BASE_4`
//   GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, GEMINI_API_KEY_4
//   NVIDIA_API_KEY, NVIDIA_API_KEY_2, NVIDIA_API_KEY_3, NVIDIA_API_KEY_4
// Any provider gets rotation for free just by having numbered keys set. A
// provider with only `BASE` set behaves exactly as before.
//
// Per-key health is in-memory (like lib/llm/rateLimit.ts's provider health):
// a rate-limited key cools briefly; a bad key (4xx auth/model) cools for a long
// stretch so we stop wasting latency on it. Self-heals per instance / on deploy.

// Up to this many numbered keys per provider: BASE, BASE_2 … BASE_8. Bump if you
// need more accounts for one provider (e.g. lots of GROQ_API_KEY_N).
const MAX_KEYS = 8;

/** All configured keys for an env base, in priority order (primary first).
 *  e.g. getKeys("GROQ_API_KEY") → [GROQ_API_KEY, GROQ_API_KEY_2, … _8] (those set). */
export function getKeys(apiKeyEnv: string): string[] {
  const keys: string[] = [];
  const primary = process.env[apiKeyEnv];
  if (primary) keys.push(primary);
  for (let n = 2; n <= MAX_KEYS; n++) {
    const k = process.env[`${apiKeyEnv}_${n}`];
    if (k) keys.push(k);
  }
  return keys;
}

// ── Per-key health ─────────────────────────────────────────────
interface KeyHealth { cooledUntil: number }
const keyHealth = new Map<string, KeyHealth>();

const KEY_RATE_COOLDOWN_MS   = 60_000;        // 429/quota — recovers soon
const KEY_CONFIG_COOLDOWN_MS = 30 * 60_000;   // bad key/model — sideline hard

// Key identity is scoped by env base (unique per provider) + index, so the same
// account's key reused across providers is still tracked independently.
function keyId(apiKeyEnv: string, idx: number): string {
  return `${apiKeyEnv}#${idx}`;
}

export function isKeyHealthy(apiKeyEnv: string, idx: number): boolean {
  const h = keyHealth.get(keyId(apiKeyEnv, idx));
  return !h || Date.now() >= h.cooledUntil;
}

export function recordKeyFailure(apiKeyEnv: string, idx: number, kind: "transient" | "config"): void {
  keyHealth.set(keyId(apiKeyEnv, idx), {
    cooledUntil: Date.now() + (kind === "config" ? KEY_CONFIG_COOLDOWN_MS : KEY_RATE_COOLDOWN_MS),
  });
}

export function recordKeySuccess(apiKeyEnv: string, idx: number): void {
  keyHealth.delete(keyId(apiKeyEnv, idx));
}
