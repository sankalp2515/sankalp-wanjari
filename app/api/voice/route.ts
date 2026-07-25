import { NextRequest, NextResponse } from "next/server";
import { getClientIP } from "@/lib/clientIP";
import { rateLimit } from "@/lib/rateStore";
import { log, newReqId } from "@/lib/observability/log";

// ── /api/voice — EMBER's real voice via ElevenLabs TTS ─────────
// Why server-side: the ElevenLabs key is a secret and must never reach
// the client. The browser posts text, we return audio/mpeg bytes. If no
// key is configured (or the request fails), we return 503 and the client
// gracefully falls back to the browser's built-in Web Speech voice — so
// the site is never broken, only ever "less lifelike".
//
// Setup: create a free account at https://elevenlabs.io, grab an API key,
// set ELEVENLABS_API_KEY (and optionally ELEVENLABS_VOICE_ID) locally and
// on the host. The free tier's ~10k characters/month comfortably covers a
// portfolio's narration.

export const runtime = "nodejs"; // in-memory rate-limit Map needs a persistent runtime

// Default voice: "Daniel" — a warm, measured British narrator that reads
// like a calm AI assistant rather than a text-to-speech engine. Override
// with ELEVENLABS_VOICE_ID to taste.
const DEFAULT_VOICE_ID = "onwK4e9ZLuTAKqWW03F9";
const MODEL_ID = "eleven_turbo_v2_5"; // low-latency, character-efficient

const MAX_CHARS = 900; // guardrail against burning the monthly quota on one blob

// ── In-memory audio cache (protects ElevenLabs credits) ────────
// The tour and stock narration repeat the same lines constantly; caching the
// rendered MP3 means each distinct line is billed to ElevenLabs at most once
// per server lifetime. Bounded LRU-ish: oldest key evicted past the cap.
const CACHE_MAX = 80;
const audioCache = new Map<string, Buffer>();
function cacheGet(key: string): Buffer | undefined {
  const v = audioCache.get(key);
  if (v) { audioCache.delete(key); audioCache.set(key, v); } // bump recency
  return v;
}
function cacheSet(key: string, buf: Buffer) {
  audioCache.set(key, buf);
  if (audioCache.size > CACHE_MAX) {
    const oldest = audioCache.keys().next().value;
    if (oldest !== undefined) audioCache.delete(oldest);
  }
}

// ── Per-IP rate limit (60 utterances/hour) ─────────────────────
// Durable across instances via Upstash when configured, in-memory otherwise.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 60;

// ── Upstream circuit breaker ───────────────────────────────────
// When ElevenLabs is unreachable (connect timeout / DNS), EMBER narrates
// line after line, each POST eating the full 15s timeout before the client
// falls back to the browser voice. That's a 15s stall PER utterance for an
// outage that isn't going to clear mid-tour. After a couple of connect-level
// failures we "open the circuit": POSTs return 503 instantly (client falls
// back with no stall) until a short cooldown elapses and we probe again.
const BREAKER_THRESHOLD = 2;            // consecutive connect failures to trip
const BREAKER_COOLDOWN_MS = 60 * 1000; // stay open for 1 min, then retry once
let ttsConnectFails = 0;
let ttsCircuitUntil = 0;
// A connect/timeout error means the host was never reached — distinct from a
// 4xx/5xx (which means ElevenLabs answered, so the network is fine).
function isConnectError(err: unknown): boolean {
  const code = (err as { cause?: { code?: string } })?.cause?.code ?? (err as { code?: string })?.code;
  return code === "UND_ERR_CONNECT_TIMEOUT" || code === "ENOTFOUND" ||
         code === "ECONNREFUSED" || code === "ETIMEDOUT" || (err instanceof Error && err.name === "TimeoutError");
}

// Trim to a sentence boundary near the cap so we never cut a word in half.
function clampText(raw: string): string {
  const text = raw.trim();
  if (text.length <= MAX_CHARS) return text;
  const slice = text.slice(0, MAX_CHARS);
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  return (lastStop > MAX_CHARS * 0.5 ? slice.slice(0, lastStop + 1) : slice).trim();
}

// Cheap capability probe — the client calls this once so it knows upfront
// whether to use ElevenLabs or go straight to the browser voice, instead of
// waiting on a slow POST only to fall back mid-sentence.
export async function GET() {
  return NextResponse.json(
    { configured: !!process.env.ELEVENLABS_API_KEY },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const reqId = newReqId();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // Not an error the user should see — the client falls back silently.
    return NextResponse.json({ error: "voice_not_configured" }, { status: 503 });
  }

  // Circuit open → fail fast so the client falls back to the browser voice
  // instantly instead of waiting out another 15s connect timeout.
  if (Date.now() < ttsCircuitUntil) {
    log.warn({ event: "voice.tts", route: "/api/voice", reqId, outcome: "circuit_open", status: 503 });
    return NextResponse.json({ error: "tts_unavailable" }, { status: 503 });
  }

  const ip = getClientIP(req);
  if (!(await rateLimit(`voice:${ip}`, MAX_PER_WINDOW, WINDOW_MS))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let text: string;
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? clampText(body.text) : "";
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const cacheKey = `${voiceId}:${text}`;

  // Cache hit → zero ElevenLabs credits spent.
  const cached = cacheGet(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Voice-Cache": "HIT" },
    });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          // Tuned for an assistant that sounds composed and human, not robotic:
          // moderate stability keeps a steady cadence, style adds warmth, and
          // speaker boost adds presence. These land the "Jarvis" register.
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!res.ok) {
      // Surface the upstream reason — most commonly a free-tier "library voice"
      // block (402 paid_plan_required) or a bad voice id (400). Helps diagnosis
      // without leaking the key.
      const detail = await res.json().catch(() => null);
      const reason = detail?.detail?.message ?? detail?.detail?.status ?? `HTTP ${res.status}`;
      // ElevenLabs answered (just unhappily) — the network is fine, so the
      // breaker stays closed; this is a per-request problem, not an outage.
      ttsConnectFails = 0;
      log.warn({ event: "voice.tts", route: "/api/voice", reqId, outcome: "tts_failed", status: 502, providerStatus: res.status, error: reason });
      return NextResponse.json({ error: "tts_failed", status: res.status, reason }, { status: 502 });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    cacheSet(cacheKey, buf);
    ttsConnectFails = 0; // healthy response — reset the breaker
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Voice-Cache": "MISS" },
    });
  } catch (err) {
    const connect = isConnectError(err);
    if (connect && ++ttsConnectFails >= BREAKER_THRESHOLD) {
      ttsCircuitUntil = Date.now() + BREAKER_COOLDOWN_MS; // trip the breaker
    }
    log.error({
      event: "voice.tts", route: "/api/voice", reqId,
      outcome: connect ? "connect_failed" : "internal", status: 500,
      breakerOpen: Date.now() < ttsCircuitUntil, error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
