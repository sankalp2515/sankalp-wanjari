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
import { noteUserSpend } from "@/lib/aiBudget";
import { safeLocal } from "@/lib/safeStorage";
import { helios } from "@/lib/voice";
import { glideToSection, driftThroughSection } from "@/lib/cinema/camera";
import { TOUR, DIRECTOR_INTRO, DIRECTOR_OUTRO_HANDBACK, CLOSING_LINE, type Beat } from "@/lib/cinema/tourScript";

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
  ask: (text: string, opts?: { projectId?: string }) => Promise<void>;
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
  /** Playback speed of the film (1 = natural). Scales pauses, captions AND voice. */
  tourSpeed: number;
  /** Set the film's playback speed live — takes effect immediately mid-tour. */
  setTourSpeed: (speed: number) => void;
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

// ── Tour pacing knob ───────────────────────────────────────────
// Scales EVERY pause in the tour (act-card holds, between-beat breaths,
// between-act silences, and the fixed sleeps) — never the speech itself, and
// never a word of the script. 1 = original cadence; lower = brisker. Tuned
// down so the tour moves without feeling rushed. Set to 1 to restore the
// original timing.
const TOUR_PACE = 0.5;

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
  // ONLY the visitor's own messages can carry a lead email. Scanning agent
  // replies would match the email WE display (Sankalp's own), producing a bogus
  // "lead to himself" that then fails to send — the false "delivery failed"
  // shown on a plain "how do I connect?". We also explicitly drop Sankalp's own
  // address, so it's never mistaken for a visitor's.
  const corpus = [...history.filter((m) => m.role === "user").map((m) => m.content), latest].join("\n");
  const own = personal.email.toLowerCase();
  const email = (corpus.match(new RegExp(EMAIL_RE.source, "gi")) ?? [])
    .find((e) => e.toLowerCase() !== own);
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
  // Start with empty streaming message
  setMessages((prev) => [...prev, { id, role: "agent", content: "", streaming: true }]);

  // Reveal 2 words per tick at ~55ms. Same perceived ~35 words/sec, but half
  // the React state updates — each update re-renders the streaming message.
  const STEP = 2;
  let interval: ReturnType<typeof setInterval> | null = null;
  const beginReveal = () => {
    if (interval) return; // guard against the double-fire (onStart + safety cap)
    interval = setInterval(() => {
      i = Math.min(i + STEP, words.length);
      const partial = words.slice(0, i).join(" ");
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: partial, streaming: i < words.length } : m))
      );
      if (i >= words.length) {
        if (interval) clearInterval(interval);
        onDone();
      }
    }, 55);
  };

  // Helios speaks every streamed line — one-way narration, opt-in. The tour
  // drives voice itself (so it can await audio end), so it opts out here.
  //
  // With voice ON we use Strategy 1: the reply is spoken sentence-by-sentence
  // (helios.speakSequence), each chunk synthesized while the previous plays.
  // The text is revealed one sentence at a time, EXACTLY as that sentence's
  // audio begins (onChunkStart) — so caption and voice stay locked together and
  // the first audio lands as soon as the first sentence is synthesized (not the
  // whole paragraph). A safety timer reveals sentence 1 if audio is slow to
  // start, and the sequence's completion guarantees onDone fires once. With
  // voice OFF we keep the classic word-by-word reveal.
  if (opts?.speak !== false && helios.isEnabled()) {
    const chunks = helios.chunk(fullText);
    let doneCalled = false;
    let firstStarted = false;
    const finishOnce = () => { if (!doneCalled) { doneCalled = true; onDone(); } };
    const revealThrough = (idx: number) => {
      const partial = chunks.slice(0, idx + 1).join(" ");
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: partial, streaming: idx < chunks.length - 1 } : m))
      );
    };
    helios
      .speakSequence(fullText, {
        onChunkStart: (idx) => { if (idx === 0) firstStarted = true; revealThrough(idx); },
      })
      .then(() => { revealThrough(chunks.length - 1); finishOnce(); });
    // If the first sentence's audio is slow to start, show it anyway after a cap
    // so the user is never staring at nothing (audio catches up from there).
    setTimeout(() => { if (!firstStarted) revealThrough(0); }, 3000);
  } else {
    beginReveal();
  }
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
    const raw = safeLocal.get(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(msgs: ConciergeMessage[]) {
  try {
    const toStore = msgs.slice(-MAX_HISTORY);
    safeLocal.set(HISTORY_KEY, JSON.stringify(toStore));
  } catch { /* quota exceeded — ignore */ }
}

export function ConciergeProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [status, setStatus]     = useState<"idle" | "thinking" | "streaming">("idle");
  const [open, setOpen]         = useState(false);
  const [persona, setPersona]   = useState<Persona>(null);
  const [tourRunning, setTourRunning] = useState(false);
  const [tourStep, setTourStep] = useState<{ index: number; total: number } | null>(null);
  const [tourSpeed, setTourSpeedState] = useState(1);
  // The runner reads speed off a ref so a mid-tour change takes effect on the
  // very next pause/beat without restarting the tour or re-creating the closure.
  const tourSpeedRef = useRef(1);
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

  // Live film speed. Updates the ref (read by the running tour), mirrors to state
  // (for the button's label), and re-rates the voice so audio speeds up too.
  const setTourSpeed = useCallback((speed: number) => {
    tourSpeedRef.current = speed;
    setTourSpeedState(speed);
    helios.setRate(speed);
  }, []);
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
      const saved = safeLocal.get("concierge-persona") as Persona;
      if (saved) setPersona(saved);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const setPersonaAndSave = useCallback((p: Persona) => {
    setPersona(p);
    if (p) safeLocal.set("concierge-persona", p);
    else safeLocal.remove("concierge-persona");
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
    helios.stop();
    setMessages([]);
    setStatus("idle");
    safeLocal.remove(HISTORY_KEY);
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
    helios.stop();
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
    // tour() is called synchronously from a tap/click, so the gesture is still
    // active here — bless the shared audio element now so every scripted line
    // that follows can play on mobile (the "voice starts then breaks" fix).
    helios.unlock();
    // Mobile/coarse-pointer devices now get the same continuous dolly as
    // desktop (the old build held every section still, which is why "scrolling
    // motion is not happening" on mobile). The smoothness comes from pausing the
    // section canvases during the dolly (see driftThroughSection → film:drift →
    // useCanvasVisible), not from disabling the motion. We only TUNE the drift
    // on coarse pointers: a slightly slower, gentler travel that low-end phones
    // composite comfortably.
    const isCoarse =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    tourAbortRef.current = false;
    const camera = new AbortController();
    cameraAbortRef.current = camera;
    setTourRunning(true);
    // The dock CLOSES during the film — narration plays as on-screen cinema
    // captions instead, so nothing covers the section (and it works on mobile).
    setOpen(false);
    // Apply the current film speed to the voice up front (the visitor may have
    // left the slider at 1.5×/2× from a prior run).
    helios.setRate(tourSpeedRef.current);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // Every PAUSE goes through pause() so the single TOUR_PACE knob tightens the
    // whole tour at once, and the live speed knob divides it further — a change
    // takes effect on the very next pause. Safety caps deliberately do NOT scale.
    const pause = (ms: number) => sleep(Math.round((ms * TOUR_PACE) / tourSpeedRef.current));

    // A beat renders as an on-screen caption (film:caption → FilmMode) and is
    // done when the voice actually finishes speaking it — synced to the audio,
    // never a guessed duration. With voice OFF the caption holds for a readable
    // duration instead. A generous safety cap guarantees we never hang.
    const narrateBeat = (text: string, voice?: "helios" | "sankalp") =>
      new Promise<void>((resolve) => {
        window.dispatchEvent(new CustomEvent("film:caption", { detail: text }));
        const voiceOn = helios.isEnabled();
        const words = text.split(/\s+/).length;
        let settled = false;
        const finish = () => { if (!settled) { settled = true; resolve(); } };
        if (voiceOn) {
          helios.narrate(text, voice).then(finish);
          setTimeout(finish, words * 800 + 5000);
        } else {
          // ~230 wpm reading pace + a beat to land the line, divided by the
          // live speed so captions-only tours speed up too.
          setTimeout(finish, (words * 240 + 1000) / tourSpeedRef.current);
        }
      });

    // ── Tab-visibility pause/resume ──────────────────────────────
    // Browsers throttle/freeze background tabs: rAF (the camera dolly) stops,
    // and helios refuses to speak while hidden. The old tour kept advancing its
    // beats on the safety timeout, so on return the voice "started" mid-tour and
    // the camera lurched — the reported "voice turns off, then blurts + flickers
    // on return" bug. Now the tour genuinely PAUSES: beats wait while hidden, the
    // in-flight beat replays from the top on return, and the dolly resumes from
    // its frozen position.
    let driftCtrl: AbortController | null = null;
    let restartDrift: (() => void) | null = null;
    const abortDrift = () => { if (driftCtrl) { driftCtrl.abort(); driftCtrl = null; } };
    const waitWhileHidden = () =>
      new Promise<void>((resolve) => {
        if (!document.hidden || tourAbortRef.current) return resolve();
        const on = () => {
          if (!document.hidden || tourAbortRef.current) {
            document.removeEventListener("visibilitychange", on);
            resolve();
          }
        };
        document.addEventListener("visibilitychange", on);
      });
    // Narrate one beat, but if the tab is hidden mid-line (cutting the audio),
    // wait until it's visible again and replay the beat from the start so the
    // visitor never returns to a half-heard sentence.
    const narrateBeatResilient = async (text: string, voice?: "helios" | "sankalp") => {
      for (;;) {
        if (tourAbortRef.current) return;
        await waitWhileHidden();
        if (tourAbortRef.current) return;
        let hidDuring = false;
        const onVis = () => { if (document.hidden) hidDuring = true; };
        document.addEventListener("visibilitychange", onVis);
        await narrateBeat(text, voice);
        document.removeEventListener("visibilitychange", onVis);
        if (tourAbortRef.current) return;
        if (hidDuring || document.hidden) { helios.stop(); continue; } // replay
        return;
      }
    };
    const onVisibility = () => {
      if (tourAbortRef.current) return;
      if (document.hidden) {
        helios.stop();        // silence now; the current beat replays on return
        driftCtrl?.abort();   // freeze the camera cleanly where it is
      } else {
        restartDrift?.();     // resume the dolly from the frozen position
      }
    };

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
    document.addEventListener("visibilitychange", onVisibility);

    (async () => {
      // Lights down: letterbox slides in, the room darkens, nav lifts away.
      window.dispatchEvent(new CustomEvent("film:enter"));
      window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: true }));
      await pause(650); // let the frame close before anyone speaks
      window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: false }));

      // Helios opens the film as the director, third person — its own voice.
      if (!tourAbortRef.current) {
        await narrateBeatResilient(DIRECTOR_INTRO, "helios");
        await pause(300);
      }

      const total = TOUR.length;
      for (let i = 0; i < TOUR.length; i++) {
        if (tourAbortRef.current) break;
        const ch = TOUR[i];
        setTourStep({ index: i + 1, total });

        // 1 — the act announces itself, alone, before anything moves
        window.dispatchEvent(new CustomEvent("film:act", { detail: { act: ch.act, title: ch.title } }));
        await pause(ch.cardHoldMs);
        if (tourAbortRef.current) break;

        // 2 — dim everything but this section (no movement yet)
        if (ch.section) window.dispatchEvent(new CustomEvent("film:spotlight", { detail: ch.section }));

        // 3 — optional stage action (open a case), then let it breathe. Opening
        // a case takes over the whole screen, so those chapters don't scroll.
        const takesOverScreen = ch.event?.name === "stage:case";
        if (ch.event) {
          window.dispatchEvent(new CustomEvent(ch.event.name, { detail: ch.event.detail }));
          await pause(500);
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
        // it. It aborts the instant the visitor takes the wheel or the tab hides,
        // and resumes (from the current position) on return.
        // Mobile/coarse pointers now dolly too (just gentler — see driftMsFrom);
        // the smoothness comes from pausing the section canvases during the move.
        // Every filmed section now dollies — including About and the Experience
        // arc, which used to hold static and made the tour feel "stuck" there.
        // What made those two glitch before was continuous per-frame work
        // fighting the rAF scroll: the About BioScanner's reticle loop and the
        // arc's scroll-linked spring. Both now yield during the dolly — BioScanner
        // pauses on `film:drift`, and the WebGL canvases suspend via
        // useCanvasVisible — so the camera has the main thread to itself and the
        // travel stays smooth. (The arc's timeline spring is cheap enough to ride
        // along, and it draws the line as the camera descends — a feature, not a
        // fight.)
        const canDrift = filmsSection;
        const voiceOn = helios.isEnabled();
        const speed = tourSpeedRef.current;
        const beatMs = (b: Beat) => {
          const w = b.text.split(/\s+/).length;
          // Both speech and reading time shrink with the speed knob (voice plays
          // at `speed`× too), so the dolly that rides the narration shrinks with
          // it — the camera keeps pace with the words instead of lagging behind.
          return (voiceOn ? w * 430 : w * 240 + 1000) / speed + (b.holdMs ?? 120) * TOUR_PACE / speed;
        };
        // Duration for a dolly covering the beats from `from` to the chapter end
        // — used both for the initial move and for resuming after a tab switch.
        const driftMsFrom = (from: number) => {
          const sum = ch.beats.slice(from).reduce((s, b) => s + beatMs(b), 0);
          return isCoarse
            ? Math.min(20000, Math.max(5000, sum * 1.15)) // gentler on phones
            : Math.min(16000, Math.max(3000, sum));
        };
        let beatIndex = 0;
        const runDrift = (from: number) => {
          if (!canDrift || tourAbortRef.current || document.hidden) return;
          driftCtrl?.abort();
          driftCtrl = new AbortController();
          const ctrl = driftCtrl;
          camera.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
          // driftThroughSection travels from the CURRENT scroll position to the
          // section end, so resuming mid-chapter naturally covers only what's left.
          driftThroughSection(ch.section!, driftMsFrom(from), { signal: ctrl.signal });
        };
        restartDrift = () => runDrift(beatIndex);
        runDrift(0);

        // 6 — narration beat by beat; cues fire on their word. Every beat is
        // Sankalp in the first person — his voice, not the director's. Each beat
        // waits out a hidden tab and replays if interrupted (narrateBeatResilient).
        for (beatIndex = 0; beatIndex < ch.beats.length; beatIndex++) {
          if (tourAbortRef.current) break;
          const beat = ch.beats[beatIndex];
          await waitWhileHidden();
          if (tourAbortRef.current) break;
          if (beat.cue) window.dispatchEvent(new CustomEvent("film:cue", { detail: beat.cue }));
          await narrateBeatResilient(beat.text, "sankalp");
          if (tourAbortRef.current) break;
          await pause(beat.holdMs ?? 120);
        }
        restartDrift = null;
        abortDrift();
        if (tourAbortRef.current) break;

        // 7 — the pause between chapters. The breath.
        await pause(ch.holdMs);
      }

      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
      abortDrift();

      if (!tourAbortRef.current) {
        // Natural finish — Act V already delivered Sankalp's closing line, so
        // the film releases (echoing it on the farewell card). Then Helios
        // returns: the dock reopens and the hand-off lands in the chat, where
        // the visitor can start asking — the film's captions are gone by now.
        window.dispatchEvent(new CustomEvent("stage:case-close", { detail: "" }));
        window.dispatchEvent(new CustomEvent("film:exit", { detail: { graceful: false, line: CLOSING_LINE } }));
        // Sankalp's closing line, in his own voice, shown on the farewell card.
        // CRITICAL: AWAIT it. The old code spoke it and then, after a fixed
        // 2.4s, spoke the hand-off — which CANCELLED the closing line whenever
        // it ran long, so the last sentence got cut off and the chat popped
        // open mid-word. Waiting for the audio to actually finish lets the tour
        // end on a complete sentence, every time. A generous cap still guards
        // against a hang if the voice never resolves.
        if (helios.isEnabled()) {
          await Promise.race([
            helios.narrate(CLOSING_LINE, "sankalp"),
            sleep(CLOSING_LINE.split(/\s+/).length * 800 + 5000),
          ]);
        } else {
          await pause(2400); // no voice — just let the farewell card breathe
        }
        await pause(500); // a held beat before the room comes back
        if (!tourAbortRef.current) {
          setOpen(true);
          setMessages((prev) => [
            ...prev,
            { id: ++idRef.current, role: "agent", content: DIRECTOR_OUTRO_HANDBACK },
          ]);
          // Helios returns in its own voice to hand the floor back.
          helios.speak(DIRECTOR_OUTRO_HANDBACK, undefined, { voice: "helios" });
          window.dispatchEvent(new CustomEvent("tour:done"));
        }
      }

      cameraAbortRef.current = null;
      // Reset the VOICE to natural pace so post-tour chat replies aren't sped up.
      // The slider's value (tourSpeedRef/tourSpeed) is kept, so the next tour
      // still honors it — it's re-applied at tour start.
      helios.setRate(1);
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

  const ask = useCallback(async (raw: string, opts?: { projectId?: string }) => {
    const text = raw.trim();
    if (!text) return;
    setOpen(true);

    // Slash commands short-circuit the LLM entirely
    if (runCommand(text)) return;

    push({ role: "user", content: text });
    track("asked", text);
    noteUserSpend(); // user-initiated — proactive nudges pace around this

    setStatus("thinking");
    window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: true }));

    // Try live LLM — NDJSON stream so provider reroutes surface as REAL
    // status events, not invented theater.
    let answer: string | null = null;
    let exhausted = false;

    // ── True token streaming (phase 2) ─────────────────────────
    // The server now emits {e:"token",t} per generated token and {e:"done"} at
    // the end. We append tokens to a LIVE message as they arrive (the real
    // "typing" effect), strip UI tags from the display, and feed completed
    // sentences to the voice queue so audio trails a sentence behind the text.
    const voiceOn = helios.isEnabled();
    let streamedMsgId: number | null = null; // the live message, once tokens flow
    let rawStreamed = "";                    // raw tokens (may contain UI tags)
    let fedChars = 0;                        // cleaned chars already sent to voice

    const stripTags = (t: string): string =>
      t.replace(/\[(SECTION|OPEN|NAV|REEL|HIGHLIGHT|CASE|UI_TOOL):[^\]]*\]?/g, "")
       .replace(/\[(FEEDBACK(?::[^\]]*)?|LEAD|GRAPH)\]?/g, "");
    // Hide a dangling, unclosed "[tag" at the very end so a partial tag never
    // flashes mid-stream; it self-heals as the rest of the token arrives.
    const forDisplay = (t: string): string => stripTags(t).replace(/\s*\[[^\]]*$/, "");

    const startLiveMessage = () => {
      streamedMsgId = ++idRef.current;
      setStatus("streaming");
      window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: false }));
      setMessages((prev) => [...prev, { id: streamedMsgId!, role: "agent", content: "", streaming: true }]);
      if (voiceOn) helios.startStream(); // helios voice; sentences fed as they complete
    };

    const onToken = (t: string) => {
      if (streamedMsgId === null) startLiveMessage();
      rawStreamed += t;
      const shown = forDisplay(rawStreamed);
      setMessages((prev) => prev.map((m) => (m.id === streamedMsgId ? { ...m, content: shown, streaming: true } : m)));
      if (voiceOn) {
        const clean = stripTags(rawStreamed);
        const pending = clean.slice(fedChars);
        const b = Math.max(pending.lastIndexOf(". "), pending.lastIndexOf("! "), pending.lastIndexOf("? "), pending.lastIndexOf("\n"));
        if (b >= 0) {
          const ready = pending.slice(0, b + 1);
          for (const s of helios.chunk(ready)) helios.feedSentence(s);
          fedChars += ready.length;
        }
      }
    };

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
          projectId: opts?.projectId ?? null,
          stream: true,
        }),
        signal: AbortSignal.timeout(45_000),
      });
      // ANY non-ok status is an outage: 429 (IP rate limit), 503 (no keys
      // configured / every provider exhausted).
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
              const ev = JSON.parse(line) as { e: string; n?: number; total?: number; content?: string; t?: string };
              if (ev.e === "attempt" && (ev.n ?? 1) > 1) {
                setStatusLine(
                  ev.n === 2
                    ? "PRIMARY CHANNEL SATURATED — REROUTING…"
                    : `ENGAGING FALLBACK LATTICE ${(ev.n ?? 2) - 1} / ${(ev.total ?? 2) - 1}…`
                );
              } else if (ev.e === "token") {
                if (ev.t) onToken(ev.t);
              } else if (ev.e === "done") {
                answer = ev.content ?? rawStreamed; // authoritative full text
              } else if (ev.e === "content") {
                answer = ev.content ?? null; // legacy single-shot (safety)
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
    // Drain the voice queue with any trailing (unterminated) sentence.
    if (voiceOn && streamedMsgId !== null) {
      const rest = stripTags(rawStreamed).slice(fedChars).trim();
      if (rest) helios.feedSentence(rest);
      helios.endStream();
    }

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
      // Helios gets one line, then stands down for the outage — the most
      // dramatic possible use of a subsystem that still works.
      helios
        .narrate("Losing the model channel. Switching to reserve power — I've still got Sankalp's facts.")
        .then(() => helios.setSuspended(true));
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
        helios.setSuspended(false);
        window.dispatchEvent(new CustomEvent("agent-core-up"));
        push({ role: "agent", content: "● Back on main power — full reasoning restored." });
        helios.speak("Back on main power. Full reasoning restored.");
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
      // Strip tags, then TIDY: models sometimes emit a tag mid-prose (the
      // anti-pattern), e.g. "…hallucinations. [NAV:skills] to explore more of
      // his relevant skills." Removing the tag leaves an orphan directive clause
      // and stray spaces. Collapse whitespace, fix space-before-punctuation, and
      // drop a trailing lowercase directive fragment left behind by the tag.
      answer = stripTags(answer)
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([.,!?;:])/g, "$1")
        .replace(/([.!?])\s+(?:to|click|tap|see|view|explore|check|visit|browse|head)\b[^.!?]*[.!?]?\s*$/i, "$1")
        .trim();
    } else {
      answer = localAnswer(text, persona);
    }

    if (streamedMsgId !== null) {
      // We already streamed this answer live (typing effect + voice queue). Just
      // finalize the message with the clean full text — no second reveal, and no
      // second round of voice (feedSentence already handled it).
      const finalId = streamedMsgId;
      const finalText = answer;
      setMessages((prev) => prev.map((m) => (m.id === finalId ? { ...m, content: finalText, streaming: false } : m)));
      setStatus("idle");
    } else {
      // No live stream (reserve power / local fallback) → classic word reveal.
      setStatus("streaming");
      window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: false }));
      const msgId = ++idRef.current;
      streamWords(answer, msgId, setMessages, () => {
        setStatus("idle");
      });
    }

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
    helios.setSuspended(false);
    window.dispatchEvent(new CustomEvent("agent-core-up"));
    setMessages((prev) => [
      ...prev,
      { id: ++idRef.current, role: "agent", content: "● Back on main power — full reasoning restored." },
    ]);
    helios.speak("Back on main power. Full reasoning restored.");
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
    () => ({ open, persona, setPersona: setPersonaAndSave, ask, setOpen, clear, focusSection, tour, stopTour, tourRunning, tourStep, tourSpeed, setTourSpeed, degraded, retryInSec, reserveReason, retryNow }),
    [open, persona, setPersonaAndSave, ask, setOpen, clear, focusSection, tour, stopTour, tourRunning, tourStep, tourSpeed, setTourSpeed, degraded, retryInSec, reserveReason, retryNow]
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
