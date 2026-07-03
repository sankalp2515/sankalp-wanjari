// ── In-Memory Rate Limiting & Provider Health Tracking ──────
// NOTE: This is in-memory — fine for a single-instance Node.js deployment.
// For serverless (Vercel), each cold start resets counters. IP rate limiting
// still provides meaningful protection within a single instance lifecycle.

interface IPRecord {
  count:     number;
  windowStart: number; // Unix ms — start of the current 1-hour window
}

interface ProviderHealth {
  failures: number;
  cooledUntil: number; // Unix ms — skip this provider until this time
}

// Per-IP request counter (rolling 1-hour window)
const ipMap   = new Map<string, IPRecord>();

// Per-provider failure counter
const provHealth = new Map<string, ProviderHealth>();

const MAX_REQUESTS_PER_HOUR = 30;
const FAILURE_THRESHOLD     = 3;   // failures before provider is cooled off
const COOLDOWN_MS           = 5 * 60 * 1000; // 5 minutes

// ── IP rate limiting ───────────────────────────────────────

/** Returns true if this IP has NOT exceeded the hourly limit. */
export function checkIPAllowed(ip: string): boolean {
  const now = Date.now();
  const rec = ipMap.get(ip);

  if (!rec || now - rec.windowStart > 3_600_000) {
    // New or expired window
    ipMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (rec.count >= MAX_REQUESTS_PER_HOUR) return false;

  rec.count++;
  return true;
}

/** Returns remaining requests in the current window. */
export function remainingRequests(ip: string): number {
  const rec = ipMap.get(ip);
  if (!rec) return MAX_REQUESTS_PER_HOUR;
  const now = Date.now();
  if (now - rec.windowStart > 3_600_000) return MAX_REQUESTS_PER_HOUR;
  return Math.max(0, MAX_REQUESTS_PER_HOUR - rec.count);
}

// ── Provider health tracking ───────────────────────────────

/** Record a failure for a provider. Returns true if now in cooldown. */
export function recordProviderFailure(providerId: string): boolean {
  const h = provHealth.get(providerId) ?? { failures: 0, cooledUntil: 0 };
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
