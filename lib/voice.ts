// ── EMBER — the voice of the concierge ───────────────────────
// Named for the site's amber signature: a warm, quiet glow that speaks.
// One-way narration, opt-in, persisted.
//
// Two tiers, chosen automatically:
//   1. ElevenLabs (via /api/voice) — a genuinely lifelike, agentic voice
//      with natural cadence and warmth. Used whenever the server has a key.
//   2. Web Speech (built into the browser) — the always-available fallback.
//      Rewritten here to sound deliberate: sentences are chunked and spoken
//      with small breaths between them, at a slower, more composed rate, so
//      it reads like an assistant thinking aloud rather than a screen reader.
//
// Discipline:
// - OFF by default; enabling is an explicit user action (persisted).
// - speak() silently no-ops when disabled or unsupported.
// - One utterance at a time — new speech cancels the previous.
// - Never speaks when the tab is hidden (browsers queue it and then blurt
//   everything at once on refocus — worse than silence).

const KEY = "ember-voice";

// Rising counter — every speak()/stop() bumps it, so any in-flight audio
// fetch or queued web-speech chunk from an earlier call knows it is stale
// and bows out instead of talking over the newest line.
let token = 0;
let currentAudio: HTMLAudioElement | null = null;
// Whether the ElevenLabs voice is available this session:
//   null  = not yet known (probe not returned)
//   true  = key configured → use the lifelike voice
//   false = no key / probing failed → use the browser voice, immediately
// Knowing this UP FRONT is what prevents the fallback from starting
// mid-sentence: we never await a doomed TTS request before speaking.
let remoteReady: boolean | null = null;
let probePromise: Promise<boolean> | null = null;

// ── End-of-utterance signalling ────────────────────────────────
// The tour narrates beat-by-beat and must wait for the CURRENT line to
// actually finish speaking before the next begins — otherwise the next
// speak() cancels the audio mid-sentence (the "cut-off" bug). We resolve a
// single pending callback on every terminal condition: audio ended, speech
// ended, superseded by a new line, stopped, failed, or voice disabled. It
// fires at most once.
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

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    (typeof Audio !== "undefined" || "speechSynthesis" in window)
  );
}

function cleanForSpeech(text: string): string {
  return text
    .replace(/\[[^\]]*\]/g, "")                    // UI tags
    .replace(/https?:\/\/\S+/g, "the link")        // don't read raw URLs
    .replace(/[*_`#>]/g, "")                       // markdown
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, "") // emoji + arrows
    .replace(/\s+/g, " ")
    .trim();
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

// ── ElevenLabs (preferred) ─────────────────────────────────────
async function elevenLabsSpeak(text: string, myToken: number): Promise<boolean> {
  if (typeof Audio === "undefined") return false;
  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(16_000),
    });
    if (res.status === 503) { remoteReady = false; return false; } // key vanished
    if (!res.ok) return false;
    if (myToken !== token || document.hidden) return true; // superseded — swallow, don't fall back
    const blob = await res.blob();
    if (myToken !== token) return true;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 1;
    currentAudio = audio;
    const cleanup = () => { URL.revokeObjectURL(url); if (myToken === token) settleEnd(); };
    audio.onended = cleanup;
    audio.onerror = cleanup;
    await audio.play();
    return true;
  } catch {
    return false; // network/timeout/decode — let Web Speech carry it
  }
}

function hardStop() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ── Reserve-power suspension ───────────────────────────────────
// Voice is a SEPARATE service from the LLMs (Web Speech / ElevenLabs), so an
// LLM outage doesn't technically break it. But an agent that has announced it
// is on reserve power and then keeps cheerfully narrating breaks the fiction
// and reads as broken. So we suspend narration for the duration — WITHOUT
// touching the user's persisted preference, so their setting is intact when
// the models return. The toggle stays visible and explains itself; a control
// that vanishes reads as a bug, a disabled control with a reason reads as trust.
let suspended = false;

export const ember = {
  supported,

  /** Suspend/resume narration for an outage. Does not alter user preference. */
  setSuspended(v: boolean) {
    if (suspended === v) return;
    suspended = v;
    if (v) { token++; hardStop(); settleEnd(); }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ember-voice-change", { detail: !v }));
    }
  },

  isSuspended(): boolean {
    return suspended;
  },

  isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return supported() && localStorage.getItem(KEY) === "1";
  },

  setEnabled(v: boolean) {
    localStorage.setItem(KEY, v ? "1" : "0");
    if (!v) this.stop();
    else probeRemote(); // learn voice availability before the first narration
    window.dispatchEvent(new CustomEvent("ember-voice-change", { detail: v }));
  },

  speak(text: string, onEnd?: () => void) {
    // Resolve any previous pending line before we take over.
    settleEnd();
    pendingEnd = onEnd ?? null;
    if (!this.isEnabled() || suspended || document.hidden) { settleEnd(); return; }
    const clean = cleanForSpeech(text);
    if (!clean) { settleEnd(); return; }
    const myToken = ++token;
    hardStop();

    const speakNow = () => {
      if (myToken !== token || document.hidden) return;
      if (remoteReady) {
        // Lifelike voice; if the request fails at runtime, fall back cleanly.
        elevenLabsSpeak(clean, myToken).then((ok) => {
          if (!ok && myToken === token && "speechSynthesis" in window) {
            webSpeechSpeak(clean, myToken);
          }
        });
      } else if ("speechSynthesis" in window) {
        // Known-unavailable → browser voice starts immediately, in sync with
        // the text. No awaiting a doomed request, no mid-sentence handoff.
        webSpeechSpeak(clean, myToken);
      }
    };

    // If we already know availability, speak this instant. Otherwise wait for
    // the (fast) probe — never for a full TTS round-trip.
    if (remoteReady !== null) speakNow();
    else probeRemote().then(speakNow);
  },

  // Promise that resolves when THIS line finishes speaking (or is stopped /
  // superseded / voice is off). The tour awaits this so a beat never gets cut
  // off — narration is synced to the audio itself, not a guessed duration.
  narrate(text: string): Promise<void> {
    return new Promise<void>((resolve) => this.speak(text, resolve));
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

// Pre-warm the capability probe at load if voice was already enabled in a past
// session. This is what makes the first narration start IN SYNC with the text:
// by the time speak() runs, remoteReady is already known, so we branch to the
// browser voice (or ElevenLabs) instantly instead of awaiting the probe.
if (typeof window !== "undefined") {
  setTimeout(() => {
    try { if (localStorage.getItem(KEY) === "1") probeRemote(); } catch { /* ignore */ }
  }, 0);
}
