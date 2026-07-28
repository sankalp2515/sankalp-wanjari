// ── Error alerting via email (zero-dependency, no LLM) ─────────
// The owner can't watch the logs continuously, so when a REAL, flow-breaking
// error happens (a provider 5xx, a network failure, a misconfiguration, an
// unhandled exception) we email them directly. Rate-limits and expected
// degradations are NOT alerts — those are normal operation on free tiers.
//
// Deliberately dumb: reuses the same Resend REST transport as the contact form,
// needs no AI, no queue, no third-party monitoring service. Fire-and-forget —
// reportError never throws and never blocks the response it was called from.
//
// De-duplicated: the same error signature won't re-send for ALERT_COOLDOWN_MS,
// so a sustained outage is ONE email, not a flood. (The dedup map is in-memory,
// so a serverless cold start may allow one extra email per instance — a fine
// trade for having no external state.)

import { log } from "@/lib/observability/log";

// Where alerts go. A dedicated ALERT_EMAIL wins; otherwise the owner's inbox.
const ALERT_TO =
  process.env.ALERT_EMAIL || process.env.OWNER_EMAIL || "swanjari2515@gmail.com";

const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 min per unique error signature
const lastSent = new Map<string, number>();

export interface ErrorReport {
  /** Stable machine name, e.g. "voice.tts", "ai.exhausted", "contact.send". */
  event: string;
  route?: string;
  /** Which upstream failed, if any: "gemini" | "elevenlabs" | "resend" … */
  provider?: string;
  /** HTTP status we returned or received, if relevant. */
  status?: number;
  /** Correlates with the structured log line for the same request. */
  reqId?: string;
  /** The human-readable failure detail. */
  error: string;
  /** Extra context worth putting in the email body. */
  context?: Record<string, unknown>;
}

// Signature intentionally excludes the free-text error + reqId so that N
// identical failures in a row collapse to one alert within the cooldown.
function signatureOf(r: ErrorReport): string {
  return [r.event, r.route ?? "", r.provider ?? "", r.status ?? ""].join("|");
}

/**
 * Email the owner about a real, flow-breaking error. Safe to call from any
 * server route's catch block — it swallows all its own failures (a broken
 * alerter must never break the request that triggered it). Not for warnings,
 * rate-limits, or expected degradations.
 *
 * Call it fire-and-forget: `void reportError({ … })`.
 */
export async function reportError(r: ErrorReport): Promise<void> {
  try {
    const sig = signatureOf(r);
    const now = Date.now();
    const prev = lastSent.get(sig);
    if (prev && now - prev < ALERT_COOLDOWN_MS) {
      log.info({ event: "alert.suppressed", route: r.route, reqId: r.reqId, signature: sig });
      return; // still within cooldown for this signature
    }
    lastSent.set(sig, now);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Can't email — at least leave a loud, queryable log line.
      log.error({ event: "alert.no_transport", route: r.route, reqId: r.reqId, error: r.error });
      return;
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL || "the portfolio";
    const when = new Date(now).toISOString();
    const body = [
      `A real error broke a flow on ${site}.`,
      "",
      `When:     ${when}`,
      `Event:    ${r.event}`,
      `Route:    ${r.route ?? "(n/a)"}`,
      `Provider: ${r.provider ?? "(n/a)"}`,
      `Status:   ${r.status ?? "(n/a)"}`,
      `Req ID:   ${r.reqId ?? "(n/a)"}`,
      "",
      `Error:`,
      r.error,
      ...(r.context ? ["", "Context:", JSON.stringify(r.context, null, 2)] : []),
      "",
      `(You won't get another email for this same error signature for 30 minutes.)`,
    ].join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "Portfolio Alerts <onboarding@resend.dev>",
        to: [ALERT_TO],
        subject: `⚠ ${r.event} failed${r.provider ? ` (${r.provider})` : ""}`,
        text: body,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // The alert itself failed to send — log it, but never throw.
      log.error({
        event: "alert.send_failed", route: r.route, reqId: r.reqId,
        providerStatus: res.status, original: r.error,
      });
      // Allow a retry on the next occurrence rather than staying silent.
      lastSent.delete(sig);
    } else {
      log.info({ event: "alert.sent", route: r.route, reqId: r.reqId, signature: sig });
    }
  } catch (err) {
    log.error({
      event: "alert.threw", route: r.route, reqId: r.reqId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
