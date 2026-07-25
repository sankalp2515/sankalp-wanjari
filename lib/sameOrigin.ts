// ── Lightweight same-origin check for state-changing POSTs ─────
// The email-sending routes (contact, feedback) have no auth and no CSRF token.
// A JSON content-type already blocks the classic cross-site <form> attack
// (it forces a CORS preflight our server never approves), but verifying the
// Origin/Referer host matches ours adds a cheap, explicit second layer.
//
// Returns true when the request looks same-origin OR when we can't tell
// (no Origin/Referer AND no known host) — we fail OPEN in that ambiguous case
// so legitimate non-browser callers and edge cases are never wrongly blocked;
// the honeypot + rate limit remain the primary abuse defenses.

import type { NextRequest } from "next/server";

export function isSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return true; // can't determine our own host — don't block

  const candidate = req.headers.get("origin") ?? req.headers.get("referer");
  if (!candidate) return true; // no Origin/Referer to compare — don't block

  try {
    return new URL(candidate).host === host;
  } catch {
    return false; // malformed Origin/Referer → treat as cross-origin
  }
}
