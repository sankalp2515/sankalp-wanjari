import { NextRequest, NextResponse } from "next/server";

// ── Contact delivery via Resend (REST API, no SDK) ─────────────
// Why Resend REST: zero npm dependencies (no supply-chain surface),
// the API key is a proper server-side secret, and the free tier
// delivers to your own verified email with no domain setup
// (from onboarding@resend.dev). Web3Forms was tried first but its
// free tier rejects server-side submissions (403, Pro required).
// Setup: sign up at https://resend.com with the OWNER_EMAIL address,
// create an API key, set RESEND_API_KEY locally and on the host.

const OWNER_EMAIL = "swanjari2515@gmail.com";

export const runtime = "nodejs"; // in-memory rate-limit Map needs a persistent runtime

// ── Validation limits ──────────────────────────────────────────
const MAX_NAME = 100;
const MAX_EMAIL = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
// Deliberately loose — its job is catching typos, not RFC compliance
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── Tiny per-IP rate limit (5 sends/hour) ──────────────────────
// Protects the Web3Forms quota from abuse. In-memory: resets on
// redeploy, which is fine for a portfolio contact form.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic cleanup so the map can't grow unbounded
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "127.0.0.1";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many messages — try again in an hour." },
        { status: 429 },
      );
    }

    const { name, email, subject, message, botcheck } = await req.json();

    // Honeypot: real visitors never fill this hidden field. Bots do.
    // Return fake success so the bot learns nothing.
    if (typeof botcheck === "string" && botcheck.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    // Server-side validation — never trust the client
    if (
      typeof name !== "string" || typeof email !== "string" || typeof message !== "string" ||
      !name.trim() || !email.trim() || !message.trim()
    ) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    if (
      name.length > MAX_NAME || email.length > MAX_EMAIL ||
      (typeof subject === "string" && subject.length > MAX_SUBJECT) ||
      message.length > MAX_MESSAGE
    ) {
      return NextResponse.json({ error: "too_long" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — contact form cannot deliver.");
      // In development, fake success so the UI flow can be tested.
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ success: true, dev: true });
      }
      // In production, NEVER pretend it sent — the client falls back to a
      // pre-filled mailto. A silent "sent" that delivers nothing is the
      // worst possible failure for a contact form.
      return NextResponse.json(
        { error: "email_not_configured", message: "Contact form isn't wired to an email service yet." },
        { status: 503 },
      );
    }

    // Send via Resend's REST API — plain text body, no HTML injection surface
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: [OWNER_EMAIL],
        reply_to: email.trim(), // reply lands with the visitor directly
        subject: `[Portfolio] ${subject?.trim() || `Message from ${name.trim()}`}`,
        text: [
          `From: ${name.trim()} <${email.trim()}>`,
          `Topic: ${subject?.trim() || "(none)"}`,
          "",
          message.trim(),
          "",
          "— Sent via the portfolio contact form. Reply goes straight to the sender.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("Resend error:", res.status, data?.message ?? "(no body)");
      return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
