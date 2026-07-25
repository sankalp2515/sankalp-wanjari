"use client";

// ── ConciergeContext ─────────────────────────────────────────
// Owns conversation, status, persona, and drives the "morph".
// Features: word-by-word streaming reveal, localStorage history,
// persona selection, section focus, stage event dispatch.

import {
  createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, ReactNode,
} from "react";
import { Persona, SectionId } from "@/types";
import { personal } from "@/config/portfolio";
import { staticAnswer, isGreeting, greeting } from "@/lib/staticBrain";
import { track } from "@/lib/behavior";
import { ember } from "@/lib/voice";
import { glideToSection, driftThroughSection } from "@/lib/cinema/camera";
import { TOUR, DIRECTOR_INTRO, DIRECTOR_OUTRO_HANDBACK, CLOSING_LINE } from "@/lib/cinema/tourScript";

export interface ConciergeMessage {
  id: number;
  role: "user" | "agent";
  content: string;
  /** Partial content during streaming reveal */
  streaming?: boolean;
}

// Fast-changing chat state lives in its own context so streaming updates
// (which fire ~many times per reply) only re-render the chat panel, not the
// whole page (hero WebGL, nav, skills, etc.).
interface ConciergeChatValue {
  messages: ConciergeMessage[];
  status: "idle" | "thinking" | "streaming";
  /** Live system telemetry while a request reroutes providers (mono ticker) */
  statusLine: string | null;
}

interface ConciergeValue {
  open: boolean;
  persona: Persona;
  setPersona: (p: Persona) => void;
  ask: (text: string) => Promise<void>;
  setOpen: (v: boolean) => void;
  clear: () => void;
  focusSection: (id: SectionId) => void;
  /** Scripted autonomous tour — the agent drives the page. Zero API cost. */
  tour: () => void;
  /** Abort a running tour. silent=true skips the message; graceful eases the film out. */
  stopTour: (opts?: { silent?: boolean; graceful?: boolean }) => void;
  tourRunning: boolean;
  /** Chapter progress while the tour runs (1-based) */
  tourStep: { index: number; total: number } | null;
  /** True after all LLM providers failed — the dock switches to command deck */
  degraded: boolean;
  /** Seconds until the next automatic health probe (null when not degraded).
   *  A countdown is what turns "we'll be back" into a checkable promise. */
  retryInSec: number | null;
  /** Why we're on reserve power. "unconfigured" = no keys deployed at all,
   *  so we must NOT promise a return. "cooling" = rate-limited, will recover. */
  reserveReason: "cooling" | "unconfigured" | null;
  /** Probe the model channel right now (the "Try now" button). */
  retryNow: () => void;
}

// ── Command deck ───────────────────────────────────────────────
// Slash commands work ALWAYS (power users) and become the primary
// interface when every LLM provider is down — the concierge never dies,
// it just switches from natural language to a deterministic protocol.
export const COMMANDS: { cmd: string; desc: string; event?: { name: string; detail: string } }[] = [
  { cmd: "/work",        desc: "Jump to the projects",        event: { name: "stage:nav", detail: "work" } },
  { cmd: "/research",    desc: "Published papers",            event: { name: "stage:nav", detail: "research" } },
  { cmd: "/career",      desc: "The career arc",              event: { name: "stage:nav", detail: "arc" } },
  { cmd: "/credentials", desc: "Education & certifications",  event: { name: "stage:nav", detail: "education" } },
  { cmd: "/skills",      desc: "Capabilities",                event: { name: "stage:nav", detail: "skills" } },
  { cmd: "/contact",     desc: "Get in touch",                event: { name: "stage:nav", detail: "contact" } },
  { cmd: "/case",        desc: "Open the flagship project breakdown", event: { name: "stage:case", detail: "001" } },
  { cmd: "/resume",      desc: "View the resume",             event: { name: "resume:open", detail: "" } },
  { cmd: "/feedback",    desc: "Leave a note or rating",      event: { name: "feedback:open", detail: "" } },
  { cmd: "/graph",       desc: "Knowledge-graph view",        event: { name: "graph:toggle", detail: "" } },
  { cmd: "/tour",        desc: "45-second guided tour" },
  { cmd: "/help",        desc: "List all commands" },
];

const ConciergeContext = createContext<ConciergeValue | null>(null);
const ConciergeChatContext = createContext<ConciergeChatValue | null>(null);

// ── Section → scene mapping ────────────────────────────────────
const SECTION_TO_SCENE: Record<string, number> = {
  hero: 0, studio: 2, arc: 3, projects: 1,
  capabilities: 4, credibility: 4, fit: 4, contact: 4,
};

const SECTION_TO_NAV: Partial<Record<string, string>> = {
  projects: "work", capabilities: "skills", arc: "arc",
  contact: "contact", credibility: "research", studio: "agent",
};

// Only these navigation targets are ever honored. A jailbroken or
// prompt-injected model can emit any tag it likes; this allowlist guarantees
// the client acts on nothing outside the portfolio's own known sections.
const ALLOWED_NAV = new Set([
  "work", "research", "arc", "education", "skills", "contact", "agent",
]);

function dispatchStageTags(text: string) {
  if (typeof window === "undefined") return;
  for (const m of text.matchAll(/\[NAV:(\w+)\]/g)) {
    const target = m[1].toLowerCase();
    if (ALLOWED_NAV.has(target))
      window.dispatchEvent(new CustomEvent("stage:nav", { detail: target }));
  }
  const reel = text.match(/\[REEL:(\d+)\]/);
  if (reel) window.dispatchEvent(new CustomEvent("stage:reel", { detail: parseInt(reel[1], 10) }));
  const hl = text.match(/\[HIGHLIGHT:([^\]]+)\]/);
  if (hl)  window.dispatchEvent(new CustomEvent("stage:highlight", { detail: hl[1].trim() }));
  // CASE ids are short alphanumerics only — reject anything longer/odd.
  const cs = text.match(/\[CASE:(\w{1,8})\]/);
  if (cs)  window.dispatchEvent(new CustomEvent("stage:case", { detail: cs[1] }));
  // Agent opens the knowledge-graph view of the portfolio.
  if (/\[GRAPH\]/.test(text)) window.dispatchEvent(new CustomEvent("graph:toggle"));
  // Agent opens the "leave a note" panel — optionally prefilled: [FEEDBACK:great work]
  const fb = text.match(/\[FEEDBACK(?::([^\]]+))?\]/);
  if (fb)  window.dispatchEvent(new CustomEvent("feedback:open", {
    detail: { message: fb[1]?.trim() ?? "", source: "AI concierge" },
  }));
}

// The concierge sends contact details a visitor shared in chat straight to
// Sankalp's inbox (via the same /api/contact transport). Triggered only when
// the agent emits [LEAD] — i.e. it recognised genuine intent — and only if an
// email is actually present in the conversation.
const EMAIL_RE = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}/;
// Three distinct outcomes, because they need three distinct UI responses:
//   "sent"     → confirm delivery
//   "failed"   → the send genuinely broke (timeout / 5xx / network). We MUST
//                tell the visitor and route them to the contact section — a
//                silent failure here is the worst thing an AI concierge can do.
//   "no_email" → nothing to send; stay quiet (the AI just acknowledged them).
type LeadResult = "sent" | "failed" | "no_email";
async function captureLead(latest: string, history: ConciergeMessage[]): Promise<LeadResult> {
  const corpus = [...history.map((m) => m.content), latest].join("\n");
  const email = corpus.match(EMAIL_RE)?.[0];
  if (!email) return "no_email";
  const nameMatch = corpus.match(/\b(?:my name is|i am|i'm|this is)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
  const name = nameMatch?.[1] ?? "Portfolio visitor (via AI concierge)";
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        subject: "New lead — captured by the AI concierge",
        message: `A visitor shared their details through the chat.\n\nTheir latest message:\n"${latest}"`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[concierge] lead delivery failed:", res.status);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[concierge] lead delivery threw:", err);
    return "failed";
  }
}

// Reserve-power answering. Delegates to the scored retriever in
// lib/staticBrain.ts — see the note there on why this is no longer a chain of
// substring checks (it used to answer cloud questions with the flagship
// project because "worked" contains "work").
function localAnswer(q: string, persona: Persona): string {
  if (isGreeting(q)) {
    return greeting() + (persona === "recruiter" ? ` (He's ${personal.availability.toLowerCase()}.)` : "");
  }
  return staticAnswer(q).text;
}

// ── Word-by-word streaming reveal ─────────────────────────────
function streamWords(
  fullText: string,
  id: number,
  setMessages: React.Dispatch<React.SetStateAction<ConciergeMessage[]>>,
  onDone: () => void,
  opts?: { speak?: boolean },
) {
  const words = fullText.split(" ");
  let i = 0;
  // EMBER speaks every streamed line — one-way narration, opt-in. The tour
  // drives voice itself (so it can await audio end), so it opts out here.
  if (opts?.speak !== false) ember.speak(fullText);
  // Start with empty streaming message
  setMessages((prev) => [...prev, { id, role: "agent", content: "", streaming: true }]);

  // Reveal 2 words per tick at ~55ms. Same perceived ~35 words/sec, but half
  // the React state updates — each update re-renders the streaming message.
  const STEP = 2;
  const interval = setInterval(() => {
    i = Math.min(i + STEP, words.length);
    const partial = words.slice(0, i).join(" ");
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: partial, streaming: i < words.length } : m))
    );
    if (i >= words.length) {
      clearInterval(interval);
      onDone();
    }
  }, 55);
}

// Backoff ladder for the reserve-power health probe: 30s → 60s → 2m → 5m,
// then hold. Aggressive at first (most free-tier rate limits clear in under a
// minute), then patient, so a long outage doesn't hammer the endpoint.
const BACKOFF = [30, 60, 120, 300];

const HISTORY_KEY = "concierge-history";
const MAX_HISTORY  = 20;

function loadHistory(): ConciergeMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(msgs: ConciergeMessage[]) {
  try {
    const toStore = msgs.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(toStore));
  } catch { /* quota exceeded — ignore */ }
}

export function ConciergeProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [status, setStatus]     = useState<"idle" | "thinking" | "streaming">("idle");
  const [open, setOpen]         = useState(false);
  const [persona, setPersona]   = useState<Persona>(null);
  const [tourRunning, setTourRunning] = useState(false);
  const [tourStep, setTourStep] = useState<{ index: number; total: number } | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [retryInSec, setRetryInSec] = useState<number | null>(null);
  const [reserveReason, setReserveReason] = useState<"cooling" | "unconfigured" | null>(null);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const idRef = useRef(0);
  const backoffIdxRef = useRef(0);
  /** The question the models couldn't answer — replayed for real on recovery. */
  const pendingQuestionRef = useRef<string | null>(null);
  const askRef = useRef<((t: string) => Promise<void>) | null>(null);
  const tourAbortRef = useRef(false);
  const cameraAbortRef = useRef<AbortController | null>(null);
  const degradedRef = useRef(false);
  useEffect(() => { degradedRef.current = degraded; }, [degraded]);
  // Mirror messages into a ref so `ask` can read recent history WITHOUT
  // listing `messages` in its deps — that would give `ask` a new identity on
  // every streamed word and re-render every page-control consumer.
  const messagesRef = useRef<ConciergeMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Restore conversation history from localStorage on mount.
  // Deferred past paint so hydration compares against the SSR default.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const history = loadHistory();
      if (history.length > 0) {
        setMessages(history);
        idRef.current = Math.max(...history.map((m) => m.id), 0);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Persist history when messages change — DEBOUNCED. Word-by-word streaming
  // mutates `messages` roughly every 55ms; without debouncing that fires a
  // synchronous JSON.stringify + localStorage.setItem (a main-thread blocking
  // write) ~18× per answer, causing scroll/typing jank. Collapsing the burst
  // into a single trailing write keeps persistence correct while removing the
  // per-word cost. Streaming settles well within a session, so the trailing
  // write always lands after the answer finishes.
  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => saveHistory(messages), 400);
    return () => clearTimeout(t);
  }, [messages]);

  // Restore persona preference (deferred, same reason as above)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const saved = localStorage.getItem("concierge-persona") as Persona;
      if (saved) setPersona(saved);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const setPersonaAndSave = useCallback((p: Persona) => {
    setPersona(p);
    if (p) localStorage.setItem("concierge-persona", p);
    else localStorage.removeItem("concierge-persona");
  }, []);

  const push = useCallback((m: Omit<ConciergeMessage, "id">) => {
    setMessages((prev) => [...prev, { ...m, id: ++idRef.current }]);
  }, []);

  // Reset clears the conversation but keeps the window open —
  // closing it too made the reset feel like a crash.
  const clear = useCallback(() => {
    tourAbortRef.current = true; // stop a running tour with the reset
    cameraAbortRef.current?.abort();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("film:exit", { detail: { graceful: false } }));
      window.dispatchEvent(new CustomEvent("stage:case-close", { detail: "" }));
    }
    ember.stop();
    setMessages([]);
    setStatus("idle");
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  // ── Cinematic tour ─────────────────────────────────────────
  // The visitor doesn't scroll — the camera travels. Movement always
  // finishes before a word is spoken. Interruption is graceful: the camera
  // eases to a stop, the voice fades, the film releases the frame.
  const stopTour = useCallback((opts?: { silent?: boolean; graceful?: boolean }) => {
    if (tourAbortRef.current) return;
    tourAbortRef.current = true;
    // Let the camera coast to a soft stop instead of freezing.
    cameraAbortRef.current?.abort();
    ember.stop();
    if (opts?.graceful) {
      // The film lets go: voice fades, letterbox retracts, a warm sign-off.
      window.dispatchEvent(new CustomEvent("film:exit", {
        detail: { graceful: true, line: "Enjoy exploring." },
      }));
      window.dispatchEvent(new CustomEvent("stage:case-close", { detail: "" }));
    }
    if (!opts?.silent) {
      // The dock was closed for the film — reopen it so the hand-off is seen.
      setOpen(true);
      setMessages((prev) => [
        ...prev,
        { id: ++idRef.current, role: "agent", content: "You took the wheel — the floor is yours. Ask me anything whenever you like." },
      ]);
    }
  }, []);

  const tour = useCallback(() => {
    if (tourRunning) return;
    tourAbortRef.current = false;
    const camera = new AbortController();
    cameraAbortRef.current = camera;
    setTourRunning(true);
    // The dock CLOSES during the film — narration plays as on-screen cinema
    // captions instead, so nothing covers the section (and it works on mobile).
    setOpen(false);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // A beat renders as an on-screen caption (film:caption → FilmMode) and is
    // done when the voice actually finishes speaking it — synced to the audio,
    // never a guessed duration. With voice OFF the caption holds for a readable
    // duration instead. A generous safety cap guarantees we never hang.
    const narrateBeat = (text: string) =>
      new Promise<void>((resolve) => {
        window.dispatchEvent(new CustomEvent("film:caption", { detail: text }));
        const voiceOn = ember.isEnabled();
        const words = text.split(/\s+/).length;
        let settled = false;
        const finish = () => { if (!settled) { settled = true; resolve(); } };
        if (voiceOn) {
          ember.narrate(text).then(finish);
          setTimeout(finish, words * 800 + 5000);
        } else {
          // ~230 wpm reading pace + a beat to land the line.
          setTimeout(finish, words * 240 + 1000);
        }
      });

    // "Take the wheel": any manual scroll outside the dock ends the film —
    // gracefully. The visitor always outranks the director.
    const isInsideDock = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("[data-agent-dock]");
    const takeWheel = (t: EventTarget | null) => { if (!isInsideDock(t)) stopTour({ graceful: true }); };
    const onWheel = (e: WheelEvent) => takeWheel(e.target);
    const onTouchMove = (e: TouchEvent) => takeWheel(e.target);
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) takeWheel(e.target);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);

    (async () => {
      // Lights down: letterbox slides in, the room darkens, nav lifts away.
      window.dispatchEvent(new CustomEvent("film:enter"));
      window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: true }));
      await sleep(650); // let the frame close before anyone speaks
      window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: false }));

      // Ember opens the film as the director, third person.
      if (!tourAbortRef.current) {
        await narrateBeat(DIRECTOR_INTRO);
        await sleep(300);
      }

      const total = TOUR.length;
      for (let i = 0; i < TOUR.length; i++) {
        if (tourAbortRef.current) break;
        const ch = TOUR[i];
        setTourStep({ index: i + 1, total });

        // 1 — the act announces itself, alone, before anything moves
        window.dispatchEvent(new CustomEvent("film:act", { detail: { act: ch.act, title: ch.title } }));
        await sleep(ch.cardHoldMs);
        if (tourAbortRef.current) break;

        // 2 — dim everything but this section (no movement yet)
        if (ch.section) window.dispatchEvent(new CustomEvent("film:spotlight", { detail: ch.section }));

        // 3 — optional stage action (open a case), then let it breathe. Opening
        // a case takes over the whole screen, so those chapters don't scroll.
        const takesOverScreen = ch.event?.name === "stage:case";
        if (ch.event) {
          window.dispatchEvent(new CustomEvent(ch.event.name, { detail: ch.event.detail }));
          await sleep(500);
        }
        if (tourAbortRef.current) break;

        const filmsSection = !!ch.section && !takesOverScreen;

        // 4 — frame the section header FIRST (native smooth scroll, masked by
        // the act card that's still fading), and wait for it to settle before
        // the first word. No snap, no half-framed section.
        if (filmsSection) {
          await glideToSection(ch.section!, 0, { signal: camera.signal });
          if (tourAbortRef.current) break;
        }

        // 5 — start ONE slow, continuous dolly through the section that runs for
        // the whole chapter's narration — a single unbroken camera move, not a
        // series of scroll hops. Fired here (not awaited); the beats play over
        // it. It aborts the instant the visitor takes the wheel.
        if (filmsSection) {
          const voiceOn = ember.isEnabled();
          const driftMs = ch.beats.reduce((sum, b) => {
            const w = b.text.split(/\s+/).length;
            return sum + (voiceOn ? w * 430 : w * 240 + 1000) + (b.holdMs ?? 120);
          }, 0);
          driftThroughSection(ch.section!, Math.min(16000, Math.max(3000, driftMs)), { signal: camera.signal });
        }

        // 6 — narration beat by beat; cues fire on their word.
        for (const beat of ch.beats) {
          if (tourAbortRef.current) break;
          if (beat.cue) window.dispatchEvent(new CustomEvent("film:cue", { detail: beat.cue }));
          await narrateBeat(beat.text);
          if (tourAbortRef.current) break;
          await sleep(beat.holdMs ?? 120);
        }
        if (tourAbortRef.current) break;

        // 7 — the pause between chapters. The breath.
        await sleep(ch.holdMs);
      }

      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);

      if (!tourAbortRef.current) {
        // Natural finish — Act V already delivered Sankalp's closing line, so
        // the film releases (echoing it on the farewell card). Then Ember
        // returns: the dock reopens and the hand-off lands in the chat, where
        // the visitor can start asking — the film's captions are gone by now.
        window.dispatchEvent(new CustomEvent("stage:case-close", { detail: "" }));
        window.dispatchEvent(new CustomEvent("film:exit", { detail: { graceful: false, line: CLOSING_LINE } }));
        // Speak the closing line as the card shows it (the beat that used to
        // say it was removed so it never appears twice).
        ember.speak(CLOSING_LINE);
        await sleep(2400); // let the farewell card breathe and retract
        if (!tourAbortRef.current) {
          setOpen(true);
          setMessages((prev) => [
            ...prev,
            { id: ++idRef.current, role: "agent", content: DIRECTOR_OUTRO_HANDBACK },
          ]);
          ember.speak(DIRECTOR_OUTRO_HANDBACK);
          window.dispatchEvent(new CustomEvent("tour:done"));
        }
      }

      cameraAbortRef.current = null;
      setStatus("idle");
      setTourRunning(false);
      setTourStep(null);
    })();
  }, [tourRunning, stopTour]);

  // ── Command deck: deterministic slash commands ───────────────
  const runCommand = useCallback((raw: string): boolean => {
    const text = raw.trim().toLowerCase();
    if (!text.startsWith("/")) return false;
    const word = text.split(/\s+/)[0];
    const found = COMMANDS.find((c) => c.cmd === word);

    push({ role: "user", content: raw.trim() });
    if (!found) {
      push({ role: "agent", content: `Unknown command. Try: ${COMMANDS.map((c) => c.cmd).join("  ")}` });
      return true;
    }
    if (found.cmd === "/help") {
      push({ role: "agent", content: COMMANDS.map((c) => `${c.cmd} — ${c.desc}`).join("\n") });
      return true;
    }
    if (found.cmd === "/tour") {
      push({ role: "agent", content: "Starting the tour — buckle up." });
      setTimeout(() => tour(), 400);
      return true;
    }
    if (found.event) {
      window.dispatchEvent(new CustomEvent(found.event.name, { detail: found.event.detail }));
      push({ role: "agent", content: `→ ${found.desc}` });
    }
    return true;
  }, [push, tour]);

  const focusSection = useCallback((id: SectionId) => {
    window.dispatchEvent(new CustomEvent("concierge-focus", { detail: id }));
    const sceneIdx = SECTION_TO_SCENE[id];
    if (sceneIdx !== undefined)
      window.dispatchEvent(new CustomEvent("navigate-scene", { detail: sceneIdx }));
    const nav = SECTION_TO_NAV[id];
    if (nav) window.dispatchEvent(new CustomEvent("stage:nav", { detail: nav }));
  }, []);

  const ask = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setOpen(true);

    // Slash commands short-circuit the LLM entirely
    if (runCommand(text)) return;

    push({ role: "user", content: text });
    track("asked", text);

    setStatus("thinking");
    window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: true }));

    // Try live LLM — NDJSON stream so provider reroutes surface as REAL
    // status events, not invented theater.
    let answer: string | null = null;
    let exhausted = false;
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messagesRef.current.slice(-6).map((m) => ({
              role: m.role === "agent" ? "assistant" : "user",
              content: m.content,
            })),
            { role: "user", content: text },
          ],
          visitorType: persona,
          stream: true,
        }),
        signal: AbortSignal.timeout(45_000),
      });
      // ANY non-ok status is an outage: 429 (IP rate limit), 503 (no keys
      // configured / every provider exhausted). The old code only recognised
      // 429, so a 503 fell through with exhausted=false and the power-down
      // sequence never played — the dock silently showed "static mode".
      if (!res.ok) {
        exhausted = true;
      } else if (res.body) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            try {
              const ev = JSON.parse(line) as { e: string; n?: number; total?: number; content?: string };
              if (ev.e === "attempt" && (ev.n ?? 1) > 1) {
                setStatusLine(
                  ev.n === 2
                    ? "PRIMARY CHANNEL SATURATED — REROUTING…"
                    : `ENGAGING FALLBACK LATTICE ${(ev.n ?? 2) - 1} / ${(ev.total ?? 2) - 1}…`
                );
              } else if (ev.e === "content") {
                answer = ev.content ?? null;
              } else if (ev.e === "exhausted") {
                exhausted = true;
              }
            } catch { /* partial line noise */ }
          }
        }
      } else {
        const data = await res.json();
        answer = (data.content as string) ?? null;
        if (!answer) exhausted = true;
      }
    } catch {
      // Network failure / timeout — from the visitor's side the model channel
      // is unreachable, which is exactly reserve power.
      exhausted = true;
    }
    setStatusLine(null);

    // ── Degradation choreography ──────────────────────────────
    // Exhausted = every provider rate-limited. The core "powers down"
    // once, cinematically, and the site keeps working from verified
    // facts. Recovery announces itself the same way.
    // ── Reserve power choreography ────────────────────────────
    // `exhausted` is now the SINGLE source of truth (it used to be computed
    // twice — `exhausted` gated the narration while `answer === null` drove
    // the banner, so the two could and did disagree).
    const wasDegraded = degradedRef.current;
    if (exhausted && !wasDegraded) {
      setDegraded(true);
      setRetryInSec(BACKOFF[0]); // seed the countdown with the transition
      // Remember what we couldn't answer, so recovery can finish the job.
      pendingQuestionRef.current = text;
      backoffIdxRef.current = 0;
      // Fired BEFORE the notice streams: the dock plays its CRT collapse
      // while the line types out underneath it.
      window.dispatchEvent(new CustomEvent("agent-core-down"));
      // Ember gets one line, then stands down for the outage — the most
      // dramatic possible use of a subsystem that still works.
      ember
        .narrate("Losing the model channel. Switching to reserve power — I've still got Sankalp's facts.")
        .then(() => ember.setSuspended(true));
      await new Promise((r) => setTimeout(r, 900)); // let the collapse land
      const notice =
        "⏻ Reserve power. Every model provider is rate-limited right now — this portfolio runs on free API tiers, " +
        "which is a deliberate cost choice, not an outage.\n\n" +
        "I'm still answering from Sankalp's verified facts, I can still run the tour and take /commands, " +
        "and anything you send through the contact section reaches him directly — he replies personally within 24 hours.\n\n" +
        "I'm retrying the model channel automatically. You'll see it the moment I'm back.";
      const noticeId = ++idRef.current;
      await new Promise<void>((r) => streamWords(notice, noticeId, setMessages, r, { speak: false }));
    } else if (!exhausted && answer) {
      pendingQuestionRef.current = null;
      if (wasDegraded) {
        setDegraded(false);
        setRetryInSec(null);
        setReserveReason(null);
        ember.setSuspended(false);
        window.dispatchEvent(new CustomEvent("agent-core-up"));
        push({ role: "agent", content: "● Back on main power — full reasoning restored." });
        ember.speak("Back on main power. Full reasoning restored.");
      }
    }

    let sectionFromAI: SectionId | null = null;
    if (answer) {
      const m = answer.match(/\[SECTION:(\w+)\]/);
      if (m) sectionFromAI = m[1] as SectionId;
      // Contact details shared in chat → deliver them, then confirm honestly.
      if (/\[LEAD\]/.test(answer)) {
        captureLead(text, messagesRef.current).then((result) => {
          if (result === "sent") {
            push({ role: "agent", content: "✓ Passed your details to Sankalp — he replies within 24 hours." });
          } else if (result === "failed") {
            // Honest failure — never let the AI's acknowledgement stand as a lie.
            // Tell the visitor plainly and hand them a channel that provably works.
            push({
              role: "agent",
              content:
                "⚠ I couldn't get that through to Sankalp just now — the delivery failed on my end, so please don't assume he received it. " +
                "Drop it in the contact section instead and it'll reach him for certain. Opening it for you.",
            });
            window.dispatchEvent(new CustomEvent("stage:nav", { detail: "contact" }));
          }
          // "no_email" → nothing was promised, stay silent.
        });
      }
      dispatchStageTags(answer);
      answer = answer
        .replace(/\[(SECTION|OPEN|NAV|REEL|HIGHLIGHT|CASE|UI_TOOL):[^\]]+\]/g, "")
        .replace(/\[(FEEDBACK(?::[^\]]+)?|LEAD|GRAPH)\]/g, "")
        .trim();
    } else {
      answer = localAnswer(text, persona);
    }

    // Switch to streaming mode — reveal words one by one
    setStatus("streaming");
    window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: false }));

    const msgId = ++idRef.current;
    streamWords(answer, msgId, setMessages, () => {
      setStatus("idle");
    });

    // Navigation is the AI's explicit decision, never automatic: we only move
    // the page when the model deliberately emits [SECTION:x] / [NAV:x] / [CASE:x].
    // A visitor asking "what is the graph feature?" should get an answer, not a
    // surprise scroll to an unrelated section.
    if (sectionFromAI) setTimeout(() => focusSection(sectionFromAI), 250);
  }, [persona, push, focusSection, runCommand]);

  useEffect(() => { askRef.current = ask; }, [ask]);

  // ── Coming back from reserve power ─────────────────────────
  // The promise "I'll be back" needs a mechanism, not just copy. While
  // degraded we tick a visible countdown and poll the zero-token health
  // endpoint on a backoff ladder. On recovery the dock powers up AND the
  // question the models couldn't answer is silently re-asked for real —
  // the agent finishing what it started, unprompted, is the moment that
  // sells the whole thing.
  const restore = useCallback(() => {
    setDegraded(false);
    setRetryInSec(null);
    setReserveReason(null);
    backoffIdxRef.current = 0;
    ember.setSuspended(false);
    window.dispatchEvent(new CustomEvent("agent-core-up"));
    setMessages((prev) => [
      ...prev,
      { id: ++idRef.current, role: "agent", content: "● Back on main power — full reasoning restored." },
    ]);
    ember.speak("Back on main power. Full reasoning restored.");
    const pending = pendingQuestionRef.current;
    pendingQuestionRef.current = null;
    if (pending) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: ++idRef.current, role: "agent", content: `Picking up where we left off — you asked: "${pending}"` },
        ]);
        setTimeout(() => askRef.current?.(pending), 700);
      }, 1400);
    }
  }, []);

  const probeHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/ai/health", { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (!res.ok) return false;
      const d = (await res.json()) as { ok: boolean; reason: "cooling" | "unconfigured" | "ok" };
      setReserveReason(d.reason === "ok" ? null : d.reason);
      return d.ok;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!degraded) return;
    let cancelled = false;
    let inFlight = false;
    backoffIdxRef.current = 0;
    // The first countdown value is seeded at the moment we go degraded (in
    // `ask`), not here — setting state synchronously in an effect body would
    // cascade a render for no reason.
    let deadline = Date.now() + BACKOFF[0] * 1000;

    const id = setInterval(async () => {
      if (cancelled || inFlight) return;
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left > 0) { setRetryInSec(left); return; }

      setRetryInSec(0);
      inFlight = true;
      const ok = await probeHealth();
      inFlight = false;
      if (cancelled) return;
      if (ok) { restore(); return; }

      backoffIdxRef.current = Math.min(backoffIdxRef.current + 1, BACKOFF.length - 1);
      const wait = BACKOFF[backoffIdxRef.current];
      deadline = Date.now() + wait * 1000;
      setRetryInSec(wait);
    }, 1000);

    return () => { cancelled = true; clearInterval(id); };
  }, [degraded, probeHealth, restore]);

  const retryNow = useCallback(() => {
    setRetryInSec(0);
    probeHealth().then((ok) => {
      if (ok) restore();
      else { backoffIdxRef.current = 0; setRetryInSec(BACKOFF[0]); }
    });
  }, [probeHealth, restore]);

  // Stable page-control value: only changes when non-chat state changes
  // (open/persona/tour/degraded), NOT while the AI streams words. This is
  // what keeps the hero WebGL, nav, and skills from re-rendering per word.
  const controlValue = useMemo<ConciergeValue>(
    () => ({ open, persona, setPersona: setPersonaAndSave, ask, setOpen, clear, focusSection, tour, stopTour, tourRunning, tourStep, degraded, retryInSec, reserveReason, retryNow }),
    [open, persona, setPersonaAndSave, ask, setOpen, clear, focusSection, tour, stopTour, tourRunning, tourStep, degraded, retryInSec, reserveReason, retryNow]
  );
  // Fast-changing chat value: consumed only by the chat panel (AgentDock).
  const chatValue = useMemo<ConciergeChatValue>(
    () => ({ messages, status, statusLine }),
    [messages, status, statusLine]
  );

  return (
    <ConciergeContext.Provider value={controlValue}>
      <ConciergeChatContext.Provider value={chatValue}>
        {children}
      </ConciergeChatContext.Provider>
    </ConciergeContext.Provider>
  );
}

export function useConcierge() {
  const ctx = useContext(ConciergeContext);
  if (!ctx) throw new Error("useConcierge must be used within ConciergeProvider");
  return ctx;
}

/** Chat panel state (messages/status/statusLine). Separated so streaming
 *  reveals don't re-render the rest of the page. */
export function useConciergeChat() {
  const ctx = useContext(ConciergeChatContext);
  if (!ctx) throw new Error("useConciergeChat must be used within ConciergeProvider");
  return ctx;
}
