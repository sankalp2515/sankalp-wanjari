// ── Durable rate limiting (Upstash Redis REST, in-memory fallback) ──
// The in-memory limiter is per-instance: on serverless (Vercel) every cold
// start and every concurrent instance gets its own counter, so the effective
// limit is MAX × instances — largely decorative under load. This module keeps
// counters in Upstash Redis (shared across all instances) via its REST API —
// no SDK, matching the zero-dependency Resend/ElevenLabs transport style.
//
// Setup (free tier is plenty for a portfolio):
//   1. Create a database at https://upstash.com (or Vercel KV, which is Upstash).
//   2. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN locally and on
//      the host.
// If those env vars are absent, it transparently falls back to the in-memory
// limiter below — so local dev and unconfigured deploys still work, just
// per-instance.

const REST_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function isDurableStoreConfigured(): boolean {
  return !!(REST_URL && REST_TOKEN);
}

// ── In-memory fallback (fixed window, matches the Redis semantics) ──
interface Window { count: number; resetAt: number }
const memMap = new Map<string, Window>();

function memRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = memMap.get(key);
  if (!rec || now >= rec.resetAt) {
    memMap.set(key, { count: 1, resetAt: now + windowMs });
    if (memMap.size > 2000) {
      for (const [k, v] of memMap) if (now >= v.resetAt) memMap.delete(k);
    }
    return true;
  }
  if (rec.count >= max) return false;
  rec.count++;
  return true;
}

// ── Upstash Redis path ─────────────────────────────────────────
// Atomic fixed window: INCR the key, and on the first hit set its TTL. The two
// commands are pipelined in one round trip. Returns the post-increment count.
async function redisIncrWithExpire(key: string, windowSec: number): Promise<number> {
  const res = await fetch(`${REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(windowSec), "NX"], // set TTL only if none exists
    ]),
    signal: AbortSignal.timeout(3_000),
  });
  if (!res.ok) throw new Error(`upstash: HTTP ${res.status}`);
  // Pipeline returns [{result: <incr>}, {result: <expire>}]
  const data = (await res.json()) as Array<{ result?: number; error?: string }>;
  const incr = data?.[0]?.result;
  if (typeof incr !== "number") throw new Error("upstash: bad pipeline response");
  return incr;
}

/**
 * Returns true if this key is still WITHIN its allowance (request permitted),
 * false if the limit is exceeded. Durable across instances when Upstash is
 * configured; otherwise per-instance in-memory. On any Redis error it FAILS
 * OPEN to the in-memory limiter so a transient store outage never takes the
 * whole site down — abuse protection degrades, availability does not.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  if (!isDurableStoreConfigured()) return memRateLimit(key, max, windowMs);
  try {
    const count = await redisIncrWithExpire(key, Math.ceil(windowMs / 1000));
    return count <= max;
  } catch (err) {
    console.warn("rateLimit: durable store unavailable, falling back to memory:", err instanceof Error ? err.message : err);
    return memRateLimit(key, max, windowMs);
  }
}
