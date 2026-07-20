// ── EMBER — the voice of the concierge ───────────────────────
// Named for the site's amber signature: a warm, quiet glow that
// speaks. One-way narration via the browser's built-in Web Speech
// API — zero cost, zero network, works offline.
//
// Discipline:
// - OFF by default; enabling is an explicit user action (persisted).
// - speak() silently no-ops when disabled or unsupported.
// - One utterance at a time — new speech cancels the previous.
// - Never speaks when the tab is hidden (browsers queue it and then
//   blurt everything at once on refocus — worse than silence).

const KEY = "ember-voice";

function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function cleanForSpeech(text: string): string {
  return text
    .replace(/\[[^\]]*\]/g, "")                    // UI tags
    .replace(/[*_`#>]/g, "")                       // markdown
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // emoji
    .replace(/\s+/g, " ")
    .trim();
}

// Prefer a natural-sounding English voice; cache the pick.
let cachedVoice: SpeechSynthesisVoice | null = null;
function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const ranked = [
    /natural/i, /neural/i, /aria/i, /jenny/i, /libby/i,
    /google (uk|us) english/i, /samantha/i, /zira/i,
  ];
  for (const rx of ranked) {
    const v = voices.find((v) => rx.test(v.name) && v.lang.startsWith("en"));
    if (v) { cachedVoice = v; return v; }
  }
  cachedVoice = voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
  return cachedVoice;
}

export const ember = {
  supported,

  isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return supported() && localStorage.getItem(KEY) === "1";
  },

  setEnabled(v: boolean) {
    localStorage.setItem(KEY, v ? "1" : "0");
    if (!v) this.stop();
    window.dispatchEvent(new CustomEvent("ember-voice-change", { detail: v }));
  },

  speak(text: string) {
    if (!this.isEnabled() || document.hidden) return;
    const clean = cleanForSpeech(text);
    if (!clean) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // one voice, no overlap
    const u = new SpeechSynthesisUtterance(clean);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 1.04;
    u.pitch = 1.0;
    u.volume = 0.9;
    synth.speak(u);
  },

  stop() {
    if (supported()) window.speechSynthesis.cancel();
  },
};

// Voices load asynchronously in some browsers — warm the cache.
if (supported()) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickVoice(); };
}
