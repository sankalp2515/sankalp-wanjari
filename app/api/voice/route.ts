import { NextRequest, NextResponse } from "next/server";
import { getClientIP } from "@/lib/clientIP";
import { rateLimit } from "@/lib/rateStore";
import { log, newReqId } from "@/lib/observability/log";
import { reportError } from "@/lib/observability/alert";

// ── /api/voice — live TTS with a provider fallback chain ───────
// The scripted tour plays PRE-GENERATED static files (see scripts/gen-voice.ts
// + lib/voice.ts), so this route only serves LIVE, un-pre-generated lines:
// chat replies and one-off confirmations. Two characters, two providers, with
// graceful fallback so a single provider's rate-limit never silences Helios:
//
//   voice "helios"  → Gemini TTS  →(429)→ ElevenLabs →(429)→ 503 (browser voice)
//   voice "sankalp" → ElevenLabs  →(429)→ 503 (browser voice)
//
// A 429 (rate-limit) is EXPECTED on free tiers — we just fall to the next
// provider, silently. A real error (5xx / network / misconfig) also falls
// through, but additionally emails the owner via lib/observability/alert, since
// that's a break they'd want to know about and can't watch the logs for.

export const runtime = "nodejs"; // in-memory rate-limit + cache need a persistent runtime

type Voice = "helios" | "sankalp";

// ── Providers ──────────────────────────────────────────────────
const GEMINI_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const GEMINI_VOICE = process.env.GEMINI_TTS_VOICE || "Schedar";
const EL_MODEL = "eleven_turbo_v2_5";
const EL_HELIOS_VOICE = process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9"; // fallback register for Helios
const EL_SANKALP_VOICE = process.env.ELEVENLABS_SANKALP_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9";

const MAX_CHARS = 900;

// ── In-memory audio cache (protects credits across a warm instance) ──
const CACHE_MAX = 80;
const audioCache = new Map<string, { buf: Buffer; contentType: string }>();
function cacheGet(key: string) {
  const v = audioCache.get(key);
  if (v) { audioCache.delete(key); audioCache.set(key, v); }
  return v;
}
function cacheSet(key: string, v: { buf: Buffer; contentType: string }) {
  audioCache.set(key, v);
  if (audioCache.size > CACHE_MAX) {
    const oldest = audioCache.keys().next().value;
    if (oldest !== undefined) audioCache.delete(oldest);
  }
}

// ── Per-IP rate limit (60 utterances/hour) ─────────────────────
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 60;

function clampText(raw: string): string {
  const text = raw.trim();
  if (text.length <= MAX_CHARS) return text;
  const slice = text.slice(0, MAX_CHARS);
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  return (lastStop > MAX_CHARS * 0.5 ? slice.slice(0, lastStop + 1) : slice).trim();
}

function isConfigured(): boolean {
  return !!(process.env.GOOGLE_CLOUD_TTS_KEY || process.env.GEMINI_API_KEY || process.env.ELEVENLABS_API_KEY);
}

// Result of one provider attempt.
type Synth =
  | { ok: true; buf: Buffer; contentType: string }
  | { ok: false; rateLimited: boolean; status: number; reason: string };

function isConnErr(err: unknown): boolean {
  const code = (err as { cause?: { code?: string } })?.cause?.code ?? (err as { code?: string })?.code;
  return code === "UND_ERR_CONNECT_TIMEOUT" || code === "ENOTFOUND" || code === "ECONNREFUSED" ||
         code === "ETIMEDOUT" || (err instanceof Error && err.name === "TimeoutError");
}

// ── Gemini TTS → raw PCM wrapped as WAV ────────────────────────
function wavHeader(dataLength: number, sampleRate: number, bitsPerSample: number, numChannels: number): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const b = Buffer.alloc(44);
  b.write("RIFF", 0); b.writeUInt32LE(36 + dataLength, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(numChannels, 22); b.writeUInt32LE(sampleRate, 24);
  b.writeUInt32LE(byteRate, 28); b.writeUInt16LE(blockAlign, 32);
  b.writeUInt16LE(bitsPerSample, 34); b.write("data", 36); b.writeUInt32LE(dataLength, 40);
  return b;
}
function parsePcmMime(mime: string): { sampleRate: number; bitsPerSample: number } {
  let bitsPerSample = 16, sampleRate = 24000;
  const [fileType, ...params] = mime.split(";").map((s) => s.trim());
  const fmt = fileType.split("/")[1];
  if (fmt && /^L\d+$/i.test(fmt)) bitsPerSample = parseInt(fmt.slice(1), 10) || 16;
  for (const p of params) {
    const [k, v] = p.split("=").map((s) => s.trim());
    if (k === "rate") sampleRate = parseInt(v, 10) || sampleRate;
  }
  return { sampleRate, bitsPerSample };
}
function geminiPrompt(text: string): string {
  return [
    "Read the following transcript in character.", "",
    "# Audio Profile",
    "A warm, composed AI assistant and guide — like a thoughtful concierge.", "",
    "# Director's note",
    "Style: warm, assured, unhurried. Pace: natural. Accent: neutral English.", "",
    "## Transcript:", text,
  ].join("\n");
}
async function synthGemini(text: string): Promise<Synth> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, rateLimited: false, status: 0, reason: "gemini_unconfigured" };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: geminiPrompt(text) }] }],
          generationConfig: {
            temperature: 0.45,
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } } },
          },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, rateLimited: res.status === 429, status: res.status, reason: detail.slice(0, 200) || `HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
    };
    const inline = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!inline?.data) return { ok: false, rateLimited: false, status: 502, reason: "gemini_no_audio" };
    const pcm = Buffer.from(inline.data, "base64");
    const mime = inline.mimeType || "audio/L16;rate=24000";
    if (!/^audio\/L\d+/i.test(mime)) return { ok: true, buf: pcm, contentType: mime };
    const { sampleRate, bitsPerSample } = parsePcmMime(mime);
    return { ok: true, buf: Buffer.concat([wavHeader(pcm.length, sampleRate, bitsPerSample, 1), pcm]), contentType: "audio/wav" };
  } catch (err) {
    return { ok: false, rateLimited: false, status: isConnErr(err) ? 504 : 500, reason: err instanceof Error ? err.message : String(err) };
  }
}

// ── ElevenLabs ─────────────────────────────────────────────────
async function synthElevenLabs(text: string, voiceId: string): Promise<Synth> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { ok: false, rateLimited: false, status: 0, reason: "elevenlabs_unconfigured" };
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: EL_MODEL,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      const reason = detail?.detail?.message ?? detail?.detail?.status ?? `HTTP ${res.status}`;
      return { ok: false, rateLimited: res.status === 429, status: res.status, reason };
    }
    return { ok: true, buf: Buffer.from(await res.arrayBuffer()), contentType: "audio/mpeg" };
  } catch (err) {
    return { ok: false, rateLimited: false, status: isConnErr(err) ? 504 : 500, reason: err instanceof Error ? err.message : String(err) };
  }
}

// Capability probe — the client learns upfront whether ANY provider exists.
export async function GET() {
  return NextResponse.json(
    { configured: isConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const reqId = newReqId();
  if (!isConfigured()) {
    return NextResponse.json({ error: "voice_not_configured" }, { status: 503 });
  }

  const ip = getClientIP(req);
  if (!(await rateLimit(`voice:${ip}`, MAX_PER_WINDOW, WINDOW_MS))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let text: string;
  let voice: Voice;
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? clampText(body.text) : "";
    voice = body?.voice === "sankalp" ? "sankalp" : "helios";
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const cacheKey = `${voice}:${text}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buf), {
      headers: { "Content-Type": cached.contentType, "Cache-Control": "no-store", "X-Voice-Cache": "HIT" },
    });
  }

  // Ordered fallback chain. Helios prefers Google (Gemini); Sankalp is ElevenLabs.
  const chain: { name: string; run: () => Promise<Synth> }[] =
    voice === "helios"
      ? [
          { name: "gemini", run: () => synthGemini(text) },
          { name: "elevenlabs", run: () => synthElevenLabs(text, EL_HELIOS_VOICE) },
        ]
      : [
          { name: "elevenlabs", run: () => synthElevenLabs(text, EL_SANKALP_VOICE) },
        ];

  let anyRealError = false;
  for (const provider of chain) {
    const r = await provider.run();
    if (r.ok) {
      cacheSet(cacheKey, { buf: r.buf, contentType: r.contentType });
      log.info({ event: "voice.tts", route: "/api/voice", reqId, outcome: "ok", provider: provider.name, voice });
      return new NextResponse(new Uint8Array(r.buf), {
        headers: { "Content-Type": r.contentType, "Cache-Control": "no-store", "X-Voice-Cache": "MISS", "X-Voice-Provider": provider.name },
      });
    }
    // Provider failed. A 429 is expected on free tiers → fall through quietly.
    // A real error (5xx / network / misconfig-that-isn't-just-missing-key) is
    // a break the owner should hear about.
    if (r.rateLimited) {
      log.warn({ event: "voice.tts", route: "/api/voice", reqId, outcome: "rate_limited", provider: provider.name, voice, status: r.status });
    } else if (r.status !== 0) { // status 0 = provider simply not configured; not an error
      anyRealError = true;
      log.error({ event: "voice.tts", route: "/api/voice", reqId, outcome: "provider_error", provider: provider.name, voice, status: r.status, error: r.reason });
      void reportError({
        event: "voice.tts", route: "/api/voice", reqId, provider: provider.name, status: r.status,
        error: r.reason, context: { voice, textPreview: text.slice(0, 80) },
      });
    }
  }

  // Every provider is rate-limited, unconfigured, or errored → the client
  // falls back to the browser's built-in Web Speech voice.
  log.warn({ event: "voice.tts", route: "/api/voice", reqId, outcome: anyRealError ? "all_failed" : "all_rate_limited", voice, status: 503 });
  return NextResponse.json({ error: "tts_unavailable" }, { status: 503 });
}
