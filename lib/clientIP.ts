// ── Trusted client-IP extraction ──────────────────────────────
// Every rate limit in the app keys off this, so it MUST return a value the
// client cannot forge. The naive `x-forwarded-for.split(",")[0]` trusts the
// LEFTMOST entry — which is whatever the client sent — so anyone can rotate it
// and defeat the limiter. Instead we trust only what the platform proxy sets:
//   • x-real-ip           — Vercel/most proxies set this to the true client IP
//   • rightmost XFF entry — appended by the trusted proxy closest to us
// The leftmost XFF is never trusted for rate-limiting decisions.

import type { NextRequest } from "next/server";

export function getClientIP(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    // Rightmost = added by the proxy nearest us, not client-controlled.
    if (parts.length) return parts[parts.length - 1];
  }
  return "0.0.0.0";
}
