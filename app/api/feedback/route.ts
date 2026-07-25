import { NextRequest, NextResponse } from "next/server";
import { getClientIP } from "@/lib/clientIP";
import { isSameOrigin } from "@/lib/sameOrigin";
import { rateLimit } from "@/lib/rateStore";
import { log, newReqId } from "@/lib/observability/log";

// ── /api/feedback — "leave a note" delivery via Resend ─────────
// Twin of /api/contact, but for ratings + suggestions rather than hiring
// enquiries. Same zero-dependency Resend REST transport and the same
// honest failure contract: in production it NEVER fakes success when the
// email service isn't configured — the client then offers a mailto.
// Name and email are OPTIONAL here: feedback can be anonymous.

const OWNER_EMAIL = "swanjari2515@gmail.com";

export const runtime = "nodejs";

const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 3000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── Per-IP rate limit (5 notes/hour) ───────────────────────────
// Durable across instances via Upstash when configured, in-memory otherwise.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export async function POST(req: NextRequest) {
  const reqId = newReqId();
  try {
    if (!isSameOrigin(req)) {
      log.warn({ event: "feedback.send", route: "/api/feedback", reqId, outcome: "forbidden", status: 403 });
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const ip = getClientIP(req);

    if (!(await rateLimit(`feedback:${ip}`, MAX_PER_WINDOW, WINDOW_MS))) {
      return NextResponse.json(
        { error: "rate_limited", message: "Thanks — that's plenty of feedback for now. Try again in an hour." },
        { status: 429 },
      );
    }

    const { rating, message, name, email, source, botcheck } = await req.json();

    // Honeypot — return fake success so bots learn nothing
    if (typeof botcheck === "string" && botcheck.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    const ratingNum = Number(rating);
    const hasRating = Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5;
    const note = typeof message === "string" ? message.trim() : "";

    // Need at least a rating OR a written note — an empty submission is nothing.
    if (!hasRating && !note) {
      return NextResponse.json({ error: "empty_feedback" }, { status: 400 });
    }
    if (
      note.length > MAX_MESSAGE ||
      (typeof name === "string" && name.length > MAX_NAME) ||
      (typeof email === "string" && email.length > MAX_EMAIL)
    ) {
      return NextResponse.json({ error: "too_long" }, { status: 400 });
    }
    const cleanEmail = typeof email === "string" ? email.trim() : "";
    if (cleanEmail && !EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const cleanName = typeof name === "string" ? name.trim() : "";
    const stars = hasRating ? `${"★".repeat(ratingNum)}${"☆".repeat(5 - ratingNum)} (${ratingNum}/5)` : "(no rating)";

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — feedback cannot deliver.");
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ success: true, dev: true });
      }
      return NextResponse.json(
        { error: "email_not_configured", message: "Feedback isn't wired to an email service yet." },
        { status: 503 },
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Portfolio Feedback <onboarding@resend.dev>",
        to: [OWNER_EMAIL],
        ...(cleanEmail ? { reply_to: cleanEmail } : {}),
        subject: `[Portfolio Feedback] ${stars}`,
        text: [
          `Rating: ${stars}`,
          `From: ${cleanName || "Anonymous"}${cleanEmail ? ` <${cleanEmail}>` : ""}`,
          `Source: ${typeof source === "string" && source ? source : "feedback widget"}`,
          "",
          note || "(no written note)",
          "",
          "— Left via the portfolio's 'leave a note' feature.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      log.error({
        event: "feedback.send", route: "/api/feedback", reqId, outcome: "delivery_failed",
        status: 502, provider: "resend", providerStatus: res.status, error: data?.message ?? "(no body)",
      });
      return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
    }

    log.info({ event: "feedback.send", route: "/api/feedback", reqId, outcome: "ok", provider: "resend" });
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({
      event: "feedback.send", route: "/api/feedback", reqId, outcome: "internal", status: 500,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
