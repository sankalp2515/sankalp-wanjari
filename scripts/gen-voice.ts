// ── Pre-generate the tour's voice, once, at build time ──────────
// Golden rule #1 from the cost playbook: never render the same sentence twice.
// This walks every SCRIPTED line the site can speak — the film tour, the graph
// tour, and Helios's framing lines — renders each to an mp3 exactly once, and
// writes them to public/voice/ as static assets. At runtime the browser plays
// those files directly (see lib/voice.ts), so the tour costs ZERO TTS credits
// and never stalls on a network round-trip.
//
// Two voices, two providers (deliberate — it makes the hand-off audible):
//   sankalp → ElevenLabs   (the first-person narrator)      → .mp3
//   helios  → Gemini TTS   (the AI assistant / director)    → .wav
//              (REST, no @google/genai SDK — matches the project's TTS style;
//               Gemini returns raw PCM which we wrap in a WAV header.)
//
// Idempotent: a line whose mp3 already exists is skipped, so re-runs only bill
// for NEW or CHANGED lines. Delete public/voice to force a full re-render.
//
//   Run:  npm run voice:gen
//
// Golden rule #2 (hard billing caps) can't be set from code — set a monthly cap
// in the ElevenLabs and Google Cloud consoles so a spike can never surprise you.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOUR, DIRECTOR_INTRO, DIRECTOR_OUTRO_HANDBACK, CLOSING_LINE } from "../lib/cinema/tourScript";
import { GRAPH_TOUR } from "../lib/cinema/graphTourScript";
import { cleanForSpeech, voiceHash, type VoiceName } from "../lib/cinema/voiceAssets";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "voice");

// ── Minimal .env.local loader (no dotenv dependency) ───────────
async function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = await fs.readFile(path.join(ROOT, file), "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!m) continue;
        const key = m[1];
        let val = m[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
    } catch { /* file absent — fine */ }
  }
}

// ── The full set of scripted lines, each with its voice ────────
interface Line { voice: VoiceName; text: string }
function collectLines(): Line[] {
  const lines: Line[] = [];
  // Helios's framing lines.
  lines.push({ voice: "helios", text: DIRECTOR_INTRO });
  lines.push({ voice: "helios", text: DIRECTOR_OUTRO_HANDBACK });
  // Sankalp's closing line (first person).
  lines.push({ voice: "sankalp", text: CLOSING_LINE });
  // Every film-tour beat is Sankalp.
  for (const chapter of TOUR) {
    for (const beat of chapter.beats) lines.push({ voice: "sankalp", text: beat.text });
  }
  // The graph tour is narrated entirely by Helios.
  for (const step of GRAPH_TOUR) lines.push({ voice: "helios", text: step.say });
  return lines;
}

// ── ElevenLabs (Sankalp) ───────────────────────────────────────
const ELEVEN_MODEL = "eleven_turbo_v2_5";
const ELEVEN_DEFAULT_VOICE = "onwK4e9ZLuTAKqWW03F9"; // "Daniel" fallback
async function renderElevenLabs(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set — needed for the 'sankalp' voice.");
  const voiceId = process.env.ELEVENLABS_SANKALP_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || ELEVEN_DEFAULT_VOICE;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: ELEVEN_MODEL,
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
    signal: AbortSignal.timeout(45_000), // fail a hung socket fast, so retry can kick in
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// ── Gemini TTS (Helios) — REST, returns raw PCM we wrap as WAV ──
// Model + voice come from the Google AI Studio reference the owner supplied.
const GEMINI_TTS_MODEL = "gemini-3.1-flash-tts-preview"; // from the owner's AI Studio reference
const GEMINI_DEFAULT_VOICE = "Schedar";
// A compact, well-formed style prompt in the shape Gemini TTS expects: the
// model reads ONLY the text under "## Transcript:" and applies the note above
// it. This is what gives Ember a warm, composed "director" register.
function geminiPrompt(text: string): string {
  return [
    "Read the following transcript in character.",
    "",
    "# Audio Profile",
    "A warm, composed film narrator and guide — like a thoughtful concierge.",
    "",
    "# Director's note",
    "Style: warm, assured, unhurried. Pace: natural. Accent: neutral English.",
    "",
    "## Transcript:",
    text,
  ].join("\n");
}

function wavHeader(dataLength: number, sampleRate: number, bitsPerSample: number, numChannels: number): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const b = Buffer.alloc(44);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + dataLength, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);            // PCM
  b.writeUInt16LE(numChannels, 22);
  b.writeUInt32LE(sampleRate, 24);
  b.writeUInt32LE(byteRate, 28);
  b.writeUInt16LE(blockAlign, 32);
  b.writeUInt16LE(bitsPerSample, 34);
  b.write("data", 36);
  b.writeUInt32LE(dataLength, 40);
  return b;
}

// Parse "audio/L16;rate=24000" → { sampleRate, bitsPerSample }. Gemini TTS
// currently emits signed 16-bit mono PCM at 24 kHz.
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

async function renderGemini(text: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_CLOUD_TTS_KEY / GEMINI_API_KEY not set — needed for the 'helios' voice.");
  const voiceName = process.env.GEMINI_TTS_VOICE || GEMINI_DEFAULT_VOICE;
  const model = process.env.GEMINI_TTS_MODEL || GEMINI_TTS_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: geminiPrompt(text) }] }],
        generationConfig: {
          temperature: 0.45,
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }),
      signal: AbortSignal.timeout(60_000), // TTS synth can be slow; still bounded so retry can act
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini TTS ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  const inline = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!inline?.data) throw new Error("Gemini TTS returned no audio inlineData");
  const pcm = Buffer.from(inline.data, "base64");
  const mime = inline.mimeType || "audio/L16;rate=24000";
  // If it already handed us a container (e.g. wav/mp3), pass it through.
  if (!/^audio\/L\d+/i.test(mime)) return pcm;
  const { sampleRate, bitsPerSample } = parsePcmMime(mime);
  return Buffer.concat([wavHeader(pcm.length, sampleRate, bitsPerSample, 1), pcm]);
}

// The file extension each voice's provider produces.
function extFor(voice: VoiceName): "mp3" | "wav" {
  return voice === "sankalp" ? "mp3" : "wav";
}

function render(voice: VoiceName, text: string): Promise<Buffer> {
  return voice === "sankalp" ? renderElevenLabs(text) : renderGemini(text);
}

// Transient failures are the norm when firing many TTS requests in a row:
// Google/undici drop the odd connection ("fetch failed" / ECONNRESET), and
// providers soft-throttle with 429/503. Retry with exponential backoff so a
// single blip doesn't leave a line un-rendered. A genuinely bad request (400 /
// 402 / bad key) still fails after the attempts — it just costs a little wait.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function renderWithRetry(voice: VoiceName, text: string, attempts = 4): Promise<Buffer> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await render(voice, text);
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) break;
      const wait = 1500 * 2 ** i; // 1.5s, 3s, 6s
      console.warn(`    ↻ ${(err as Error).message} — retry ${i + 1}/${attempts - 1} in ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function main() {
  await loadEnv();
  await fs.mkdir(OUT_DIR, { recursive: true });

  // De-duplicate: the same (voice, cleaned text) maps to one file.
  const lines = collectLines();
  const seen = new Map<string, Line & { clean: string }>();
  for (const l of lines) {
    const clean = cleanForSpeech(l.text);
    if (!clean) continue;
    const key = voiceHash(l.voice, clean);
    if (!seen.has(key)) seen.set(key, { ...l, clean });
  }

  console.log(`\n🎙  ${seen.size} unique lines to ensure in ${path.relative(ROOT, OUT_DIR)}\n`);

  let generated = 0, skipped = 0, failed = 0;
  // manifest.json maps hash → extension, so the browser knows the filename.
  const manifest: Record<string, string> = {};

  for (const [key, l] of seen) {
    const ext = extFor(l.voice);
    const file = path.join(OUT_DIR, `${key}.${ext}`);
    try {
      await fs.access(file);
      skipped++;
      manifest[key] = ext;
      continue; // already rendered — don't bill for it again
    } catch { /* needs rendering */ }

    try {
      const buf = await renderWithRetry(l.voice, l.clean);
      await fs.writeFile(file, buf);
      manifest[key] = ext;
      generated++;
      console.log(`  ✓ [${l.voice}] ${key}.${ext}  "${l.clean.slice(0, 52)}${l.clean.length > 52 ? "…" : ""}"`);
    } catch (err) {
      failed++;
      console.error(`  ✗ [${l.voice}] ${key}  ${(err as Error).message}`);
    }
  }

  // The manifest is what lets the browser know, synchronously, which lines are
  // free static assets (and with which extension) vs. which must hit the live API.
  const ordered = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(ordered, null, 0));

  // ── Prune orphans ──────────────────────────────────────────
  // Audio files whose (voice, text) no longer matches ANY current line — left
  // behind when a line's text changes or its voice tag changes (e.g. the
  // ember→helios rename) — are never referenced by the new manifest. Delete
  // them so the folder only ever holds live assets, and you never have to hand-
  // clean it. Pruning is keyed on `seen` (all current lines), not on what got
  // generated this run, so a line that fails to render is never pruned by
  // mistake — only genuine orphans go. Only .mp3/.wav are touched.
  let pruned = 0;
  for (const entry of await fs.readdir(OUT_DIR)) {
    const m = entry.match(/^(.+)\.(mp3|wav)$/);
    if (!m || seen.has(m[1])) continue; // not an audio file, or still a live line
    try { await fs.unlink(path.join(OUT_DIR, entry)); pruned++; } catch { /* ignore */ }
  }

  const n = Object.keys(manifest).length;
  console.log(`\n✔ done — ${generated} generated, ${skipped} already present, ${failed} failed, ${pruned} orphans pruned.`);
  console.log(`  manifest: ${n} entries → ${path.relative(ROOT, path.join(OUT_DIR, "manifest.json"))}\n`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });
