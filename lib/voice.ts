// ── HELIOS — the voice of the AI assistant ───────────────────
// Named for the site's warm, solar signature: a quiet glow that speaks.
// One-way narration, opt-in, persisted.
//
// Three tiers, chosen automatically per line:
//   1. Pre-generated static asset (/voice/<hash>.{mp3,wav}) — rendered ONCE at
//      build time and served from the CDN. Zero API credits, zero network
//      variance, so the tour's captions and audio stay in perfect sync and
//      never gap mid-line. This is the path the whole scripted tour takes.
//   2. Live TTS (via /api/voice) — for un-pre-generated lines (chat replies).
//      The SERVER owns the provider fallback chain: Helios lines try Google
//      (Gemini) TTS first, then ElevenLabs on a rate-limit; Sankalp lines use
//      ElevenLabs. The client just asks for a voice and plays what comes back.
//   3. Web Speech (built into the browser) — the always-available fallback
//      when the server returns 503 (every provider rate-limited / unconfigured).
//
// Mobile discipline (the reason this file looks the way it does):
// - ONE reusable <audio> element, unlocked inside a user gesture (unlock()).
//   iOS/Android only let audio started from a gesture play; creating a fresh
//   `new Audio()` per line — as the old code did — got the 2nd, 3rd, 4th line
//   BLOCKED by the autoplay policy, so the voice "started then broke". Reusing
//   one blessed element keeps every line playable.
// - OFF by default; enabling is an explicit user action (persisted).
// - One utterance at a time — new speech cancels the previous.
// - Never speaks when the tab is hidden (browsers queue it and then blurt
//   everything at once on refocus — worse than silence).

import {
  cleanForSpeech, voiceHash, assetUrl, MANIFEST_URL,
  DEFAULT_VOICE, type VoiceName, type VoiceManifest,
} from "@/lib/cinema/voiceAssets";

const KEY = "helios-voice";
const LEGACY_KEY = "ember-voice"; // migrate old opt-ins so nobody loses their setting

// Read the persisted on/off, honouring the pre-rename key once so existing
// visitors keep their preference.
function readEnabledPref(): boolean {
  try {
    const v = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    return v === "1";
  } catch { return false; }
}

// Rising counter — every speak()/stop() bumps it, so any in-flight audio
// fetch or queued web-speech chunk from an earlier call knows it is stale
// and bows out instead of talking over the newest line.
let token = 0;

// Whether the ElevenLabs voice is available this session (for LIVE chat only):
//   null  = not yet known (probe not returned)
//   true  = key configured → use the lifelike voice
//   false = no key / probing failed → use the browser voice, immediately
let remoteReady: boolean | null = null;
let probePromise: Promise<boolean> | null = null;

// ── The single, reusable, gesture-unlocked audio element ───────
// Everything that plays an mp3 (static asset OR live blob) goes through this
// one element. Because it was unlocked inside a tap, every later .play() on it
// is allowed on mobile.
let sharedAudio: HTMLAudioElement | null = null;
let blobUrlInUse: string | null = null; // revoked when the next line takes over
// A 1-frame silent MP3 — playing it inside a gesture is enough to "warm" the
// element so later programmatic plays are permitted.
const SILENT_MP3 =
  "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

function getAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = "auto";
  }
  return sharedAudio;
}

// ── End-of-utterance signalling ────────────────────────────────
// The tour narrates beat-by-beat and must wait for the CURRENT line to
// actually finish before the next begins. We resolve a single pending callback
// on every terminal condition: audio ended, speech ended, superseded, stopped,
// failed, or voice disabled. It fires at most once.
let pendingEnd: (() => void) | null = null;
function settleEnd() {
  const p = pendingEnd;
  pendingEnd = null;
  if (p) p();
}

function probeRemote(): Promise<boolean> {
  if (remoteReady !== null) return Promise.resolve(remoteReady);
  if (probePromise) return probePromise;
  probePromise = fetch("/api/voice", { method: "GET", signal: AbortSignal.timeout(4000) })
    .then((r) => (r.ok ? r.json() : { configured: false }))
    .then((d) => { remoteReady = !!d?.configured; return remoteReady; })
    .catch(() => { remoteReady = false; return false; });
  return probePromise;
}

// ── Pre-generated asset manifest ───────────────────────────────
// A tiny JSON list of which hashes were rendered at build time. Loaded once so
// speak() can decide synchronously whether a line is a free static asset or
// needs the live API. Absent manifest (feature not generated yet) → empty set,
// and everything falls through to the live/browser paths exactly as before.
// Maps each rendered line's hash → its file extension ("mp3" | "wav"), since
// the two providers emit different formats.
let manifest: VoiceManifest | null = null;
let manifestPromise: Promise<VoiceManifest> | null = null;
function loadManifest(): Promise<VoiceManifest> {
  if (manifest) return Promise.resolve(manifest);
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch(MANIFEST_URL, { signal: AbortSignal.timeout(4000) })
    .then((r) => (r.ok ? r.json() : {}))
    .then((obj: unknown) => {
      manifest = (obj && typeof obj === "object" && !Array.isArray(obj))
        ? (obj as VoiceManifest) : {};
      return manifest;
    })
    .catch(() => { manifest = {}; return manifest; });
  return manifestPromise;
}

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    (typeof Audio !== "undefined" || "speechSynthesis" in window)
  );
}

// ── Web Speech fallback ────────────────────────────────────────
let cachedVoice: SpeechSynthesisVoice | null = null;
function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const ranked = [
    /natural/i, /neural/i, /aria/i, /jenny/i, /libby/i, /daniel/i, /guy/i,
    /google (uk|us) english/i, /samantha/i, /zira/i,
  ];
  for (const rx of ranked) {
    const v = voices.find((v) => rx.test(v.name) && v.lang.startsWith("en"));
    if (v) { cachedVoice = v; return v; }
  }
  cachedVoice = voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
  return cachedVoice;
}

// Split into speakable clauses so we can breathe between them — the single
// biggest difference between "reading" and "talking".
function toClauses(text: string): string[] {
  return text
    .split(/(?<=[.!?…:])\s+|(?<=,)\s+(?=(?:and|but|so|which|because|then)\b)/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function webSpeechSpeak(text: string, myToken: number) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = pickVoice();
  const clauses = toClauses(text);
  let i = 0;

  const next = () => {
    if (myToken !== token || i >= clauses.length || document.hidden) {
      if (myToken === token) settleEnd(); // finished (or nothing left to say)
      return;
    }
    const clause = clauses[i++];
    const u = new SpeechSynthesisUtterance(clause);
    if (voice) u.voice = voice;
    u.rate = 0.94;   // composed, unhurried
    u.pitch = 0.96;  // a touch lower — calm and grounded
    u.volume = 1;
    u.onend = () => {
      if (myToken !== token) return;
      // A short breath between clauses — the pause that makes it feel human.
      const gap = /[.!?…:]$/.test(clause) ? 240 : 90;
      window.setTimeout(next, gap);
    };
    u.onerror = () => { if (myToken === token) window.setTimeout(next, 60); };
    synth.speak(u);
  };
  next();
}

// ── Play an mp3 URL through the shared, unlocked element ───────
// Used by BOTH the static-asset path and the live-blob path. onMissing lets a
// static asset that 404s (or fails to decode) fall through to the live/browser
// voice instead of silently ending the line.
function playUrl(
  url: string,
  myToken: number,
  opts: { revoke?: boolean; onFail?: () => void } = {},
) {
  if (typeof Audio === "undefined") { opts.onFail?.(); return; }
  const a = getAudio();
  // Tear down whatever was playing before, and revoke a stale blob URL.
  a.pause();
  a.onended = null;
  a.onerror = null;
  if (blobUrlInUse) { URL.revokeObjectURL(blobUrlInUse); blobUrlInUse = null; }
  if (opts.revoke) blobUrlInUse = url;

  a.src = url;
  a.muted = false;
  a.volume = 1;

  const cleanup = () => {
    if (blobUrlInUse === url) { URL.revokeObjectURL(url); blobUrlInUse = null; }
    if (myToken === token) settleEnd();
  };
  a.onended = cleanup;
  a.onerror = () => {
    a.onended = null;
    a.onerror = null;
    if (blobUrlInUse === url) { URL.revokeObjectURL(url); blobUrlInUse = null; }
    if (myToken !== token) return;
    // The asset couldn't load/decode — let the caller decide the fallback.
    if (opts.onFail) opts.onFail();
    else settleEnd();
  };

  const p = a.play();
  if (p && typeof p.catch === "function") {
    p.catch(() => {
      // Interrupted (a newer line took over) or blocked despite unlock.
      if (myToken !== token) return;
      if (opts.onFail) opts.onFail();
      else settleEnd();
    });
  }
}

// ── Live TTS (un-pre-generated lines only) ─────────────────────
// The server picks the provider from `voice` and handles the Google→ElevenLabs
// fallback; we just send the voice tag and play whatever audio comes back.
// A 503 means every provider is rate-limited or unconfigured → browser voice.
async function remoteSpeak(text: string, voice: VoiceName, myToken: number): Promise<boolean> {
  if (typeof Audio === "undefined") return false;
  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
      signal: AbortSignal.timeout(16_000),
    });
    if (res.status === 503) return false; // all providers down → browser voice
    if (!res.ok) return false;
    if (myToken !== token || document.hidden) return true; // superseded — swallow
    const blob = await res.blob();
    if (myToken !== token) return true;
    const url = URL.createObjectURL(blob);
    // Reuse the shared, unlocked element (the whole point of the mobile fix).
    playUrl(url, myToken, { revoke: true, onFail: () => {
      if (myToken === token && "speechSynthesis" in window) webSpeechSpeak(text, myToken);
    }});
    return true;
  } catch {
    return false; // network/timeout/decode — let Web Speech carry it
  }
}

function hardStop() {
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.onended = null;
    sharedAudio.onerror = null;
  }
  if (blobUrlInUse) { URL.revokeObjectURL(blobUrlInUse); blobUrlInUse = null; }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ── Reserve-power suspension ───────────────────────────────────
// Voice is a SEPARATE service from the LLMs, so an LLM outage doesn't break it.
// But an agent that announced reserve power and then keeps narrating reads as
// broken — so we suspend narration WITHOUT touching the user's preference.
let suspended = false;

export const helios = {
  supported,

  /** Bless the shared audio element from inside a user gesture (a tap/click),
   *  so every later programmatic play() is allowed on mobile. Idempotent and
   *  safe to call on every tour/voice tap. */
  unlock() {
    if (typeof Audio === "undefined") return;
    // Warm the manifest too while we have the chance.
    loadManifest();
    try {
      const a = getAudio();
      a.muted = true;
      a.src = SILENT_MP3;
      const p = a.play();
      const done = () => { try { a.pause(); a.currentTime = 0; } catch { /* noop */ } a.muted = false; };
      if (p && typeof p.then === "function") p.then(done).catch(() => { a.muted = false; });
      else done();
    } catch { /* ignore */ }
  },

  /** Suspend/resume narration for an outage. Does not alter user preference. */
  setSuspended(v: boolean) {
    if (suspended === v) return;
    suspended = v;
    if (v) { token++; hardStop(); settleEnd(); }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("helios-voice-change", { detail: !v }));
    }
  },

  isSuspended(): boolean {
    return suspended;
  },

  isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return supported() && readEnabledPref();
  },

  setEnabled(v: boolean) {
    localStorage.setItem(KEY, v ? "1" : "0");
    try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ } // migrated
    if (!v) this.stop();
    else { this.unlock(); probeRemote(); } // gesture: unlock + learn availability
    window.dispatchEvent(new CustomEvent("helios-voice-change", { detail: v }));
  },

  speak(text: string, onEnd?: () => void, opts?: { voice?: VoiceName }) {
    // Resolve any previous pending line before we take over.
    settleEnd();
    pendingEnd = onEnd ?? null;
    if (!this.isEnabled() || suspended || document.hidden) { settleEnd(); return; }
    const clean = cleanForSpeech(text);
    if (!clean) { settleEnd(); return; }
    const voice = opts?.voice ?? DEFAULT_VOICE;
    const myToken = ++token;
    hardStop();

    const key = voiceHash(voice, clean);

    // Live/browser fallback path — used when there's no pre-generated asset.
    const speakLive = () => {
      if (myToken !== token || document.hidden) return;
      if (remoteReady) {
        remoteSpeak(clean, voice, myToken).then((ok) => {
          if (!ok && myToken === token && "speechSynthesis" in window) {
            webSpeechSpeak(clean, myToken);
          }
        });
      } else if ("speechSynthesis" in window) {
        webSpeechSpeak(clean, myToken);
      } else {
        settleEnd();
      }
    };

    const go = () => {
      if (myToken !== token || document.hidden) return;
      // 1 — a pre-generated static asset? Play it free and in perfect sync.
      const ext = manifest?.[key];
      if (ext) {
        playUrl(assetUrl(key, ext), myToken, { onFail: speakLive });
        return;
      }
      // 2 — no asset (live chat line, or assets not generated yet) → live.
      if (remoteReady !== null) speakLive();
      else probeRemote().then(speakLive);
    };

    // Manifest is normally warm (loaded at unlock/enable). If not, wait for it
    // — it's a tiny same-origin JSON, far faster than any TTS round-trip.
    if (manifest) go();
    else loadManifest().then(go);
  },

  /** Promise that resolves when THIS line finishes speaking (or is stopped /
   *  superseded / voice is off). The tour awaits this so a beat is never cut
   *  off — narration is synced to the audio itself, not a guessed duration. */
  narrate(text: string, voice?: VoiceName): Promise<void> {
    return new Promise<void>((resolve) => this.speak(text, resolve, { voice }));
  },

  stop() {
    token++; // invalidate anything in flight
    hardStop();
    settleEnd(); // release any awaiter so the tour never hangs
  },
};

// Voices load asynchronously in some browsers — warm the cache.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickVoice(); };
}

// Pre-warm the manifest and (if voice was enabled before) the capability probe,
// so the first narration branches instantly instead of awaiting a round-trip.
if (typeof window !== "undefined") {
  setTimeout(() => {
    loadManifest();
    try { if (readEnabledPref()) probeRemote(); } catch { /* ignore */ }
  }, 0);
}
