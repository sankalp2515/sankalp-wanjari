import { NextRequest, NextResponse } from "next/server";
import { getClientIP } from "@/lib/clientIP";
import { rateLimit } from "@/lib/rateStore";

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
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // Not an error the user should see — the client falls back silently.
    return NextResponse.json({ error: "voice_not_configured" }, { status: 503 });
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
      console.warn("ElevenLabs error:", res.status, reason);
      return NextResponse.json({ error: "tts_failed", status: res.status, reason }, { status: 502 });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    cacheSet(cacheKey, buf);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Voice-Cache": "MISS" },
    });
  } catch (err) {
    console.error("Voice route error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
