"use client";

// ── ConciergeContext ─────────────────────────────────────────
// Owns conversation, status, persona, and drives the "morph".
// Features: word-by-word streaming reveal, localStorage history,
// persona selection, section focus, stage event dispatch.

import {
  createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode,
} from "react";
import { Persona, SectionId } from "@/types";
import { agentFAQ, personal, projects, skills } from "@/config/portfolio";
import { track, summarize } from "@/lib/behavior";
import { ember } from "@/lib/voice";

export interface ConciergeMessage {
  id: number;
  role: "user" | "agent";
  content: string;
  /** Partial content during streaming reveal */
  streaming?: boolean;
}

interface ConciergeValue {
  messages: ConciergeMessage[];
  status: "idle" | "thinking" | "streaming";
  open: boolean;
  persona: Persona;
  setPersona: (p: Persona) => void;
  ask: (text: string) => Promise<void>;
  setOpen: (v: boolean) => void;
  clear: () => void;
  focusSection: (id: SectionId) => void;
  /** Scripted autonomous tour — the agent drives the page. Zero API cost. */
  tour: () => void;
  /** Abort a running tour. silent=true skips the "paused" message. */
  stopTour: (opts?: { silent?: boolean }) => void;
  tourRunning: boolean;
  /** Chapter progress while the tour runs (1-based) */
  tourStep: { index: number; total: number } | null;
  /** True after all LLM providers failed — the dock switches to command deck */
  degraded: boolean;
  /** Live system telemetry while a request reroutes providers (mono ticker) */
  statusLine: string | null;
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
  { cmd: "/case",        desc: "Open the flagship case study", event: { name: "stage:case", detail: "001" } },
  { cmd: "/resume",      desc: "View the resume",             event: { name: "resume:open", detail: "" } },
  { cmd: "/graph",       desc: "Knowledge-graph view",        event: { name: "graph:toggle", detail: "" } },
  { cmd: "/tour",        desc: "45-second guided tour" },
  { cmd: "/help",        desc: "List all commands" },
];

const ConciergeContext = createContext<ConciergeValue | null>(null);

// ── Section → scene mapping ────────────────────────────────────
const SECTION_TO_SCENE: Record<string, number> = {
  hero: 0, studio: 2, arc: 3, projects: 1,
  capabilities: 4, credibility: 4, fit: 4, contact: 4,
};

const SECTION_TO_NAV: Partial<Record<string, string>> = {
  projects: "work", capabilities: "skills", arc: "arc",
  contact: "contact", credibility: "research", studio: "agent",
};

function sectionFor(q: string): SectionId | null {
  const t = q.toLowerCase();
  if (/\b(project|work|built|build|portfolio|case stud|shipped)\b/.test(t)) return "projects";
  if (/\b(skill|stack|tech|language|tool|framework|proficien)\b/.test(t)) return "capabilities";
  if (/\b(experience|background|career|journey|history|story)\b/.test(t)) return "arc";
  if (/\b(research|paper|publication|academ|cert)\b/.test(t)) return "credibility";
  if (/\b(contact|email|reach|hire|available|availab|start|notice|fit|role|position|match)\b/.test(t)) return "contact";
  if (/\b(agent|run|demo|studio|watch|think)\b/.test(t)) return "studio";
  return null;
}

function dispatchStageTags(text: string) {
  if (typeof window === "undefined") return;
  for (const m of text.matchAll(/\[NAV:(\w+)\]/g))
    window.dispatchEvent(new CustomEvent("stage:nav", { detail: m[1].toLowerCase() }));
  const reel = text.match(/\[REEL:(\d+)\]/);
  if (reel) window.dispatchEvent(new CustomEvent("stage:reel", { detail: parseInt(reel[1], 10) }));
  const hl = text.match(/\[HIGHLIGHT:([^\]]+)\]/);
  if (hl)  window.dispatchEvent(new CustomEvent("stage:highlight", { detail: hl[1].trim() }));
  const cs = text.match(/\[CASE:(\w+)\]/);
  if (cs)  window.dispatchEvent(new CustomEvent("stage:case", { detail: cs[1] }));
}

function localAnswer(q: string, persona: Persona): string {
  const t = q.toLowerCase().trim();
  if (t.includes("availab") || t.includes("start") || t.includes("notice")) return agentFAQ.availability;
  if (t.includes("locat") || t.includes("remote")) return agentFAQ.location;
  if (t.includes("salary") || t.includes("compensation") || t.includes("ctc")) return agentFAQ.salary;
  if (t.includes("stack") || t.includes("tech")) return agentFAQ.stack;
  if (t.includes("skill")) return agentFAQ.skills;
  if (t.includes("research") || t.includes("paper")) return agentFAQ.research;
  if (t.includes("experience") || t.includes("background")) return agentFAQ.experience;
  if (t.includes("contact") || t.includes("email") || t.includes("reach")) return agentFAQ.contact;

  const pm = projects.find((p) =>
    t.includes(p.shortName.toLowerCase()) || t.includes(p.name.toLowerCase().split(" ")[0])
  );
  if (pm) return `${pm.name} — ${pm.description} Stack: ${pm.stack.join(", ")}.`;

  if (t.includes("project") || t.includes("work") || t.includes("best")) {
    const top = projects[0];
    return `${personal.shortName}'s flagship is ${top.name}: ${top.description} There are ${projects.length} case studies — scroll or ask about any of them.`;
  }
  if (t.match(/^(hi|hello|hey)\b/)) {
    return `Hi — I'm ${personal.shortName}'s AI concierge. Ask about his work, skills, or availability, or paste a job description for a fit check.${persona === "recruiter" ? ` He's ${personal.availability.toLowerCase()}.` : ""}`;
  }
  const topSkills = skills.filter((s) => s.core).map((s) => s.name).slice(0, 5).join(", ");
  return `${personal.shortName} is an ${personal.title} — ${personal.focus}. Core strengths: ${topSkills}. Ask me anything specific, or paste a JD for a fit check.`;
}

// ── Word-by-word streaming reveal ─────────────────────────────
function streamWords(
  fullText: string,
  id: number,
  setMessages: React.Dispatch<React.SetStateAction<ConciergeMessage[]>>,
  onDone: () => void,
) {
  const words = fullText.split(" ");
  let i = 0;
  // EMBER speaks every streamed line — one-way narration, opt-in
  ember.speak(fullText);
  // Start with empty streaming message
  setMessages((prev) => [...prev, { id, role: "agent", content: "", streaming: true }]);

  const interval = setInterval(() => {
    i++;
    const partial = words.slice(0, i).join(" ");
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: partial, streaming: i < words.length } : m))
    );
    if (i >= words.length) {
      clearInterval(interval);
      onDone();
    }
  }, 28); // ~35 words/sec
}

// ── Scripted tour: the agent operates the page, narrating as it goes ──
// Chapters make it a story, not a scroll: each chapter shows a cinematic
// title card (ChapterTitle component listens for "tour:step").
const TOUR_STEPS: {
  say: string;
  event?: { name: string; detail: string };
  chapter?: string;
  holdMs: number;
}[] = [
  {
    say: "Hi — I'm Sankalp's AI concierge, and I can operate this site. Let me give you the 45-second version. Buckle up.",
    chapter: "HELLO 👋",
    holdMs: 3200,
  },
  {
    say: "This is his selected work — three production systems. The flagship is a 10-agent LangGraph pipeline that turns a CSV into a deployed ML model.",
    event: { name: "stage:nav", detail: "work" },
    chapter: "CH. 1 — THE WORK",
    holdMs: 4200,
  },
  {
    say: "Here's the full case study — note the sandboxed self-repair and the 6-provider LLM fallback. 132 automated tests behind it.",
    event: { name: "stage:case", detail: "001" },
    holdMs: 5200,
  },
  {
    say: "He's also published — two peer-reviewed papers from 2023, on LSTM music generation and sketch-to-HTML with YOLOv5.",
    event: { name: "stage:case-close", detail: "" },
    holdMs: 1000,
  },
  {
    say: "",
    event: { name: "stage:nav", detail: "research" },
    chapter: "CH. 2 — PUBLISHED RESEARCH",
    holdMs: 3800,
  },
  {
    say: "Three years shipping at FIS Global — from IT Trainee to Implementation Conversion Analyst — plus a data-analysis internship before that.",
    event: { name: "stage:nav", detail: "arc" },
    chapter: "CH. 3 — THE ARC",
    holdMs: 4200,
  },
  {
    say: "The toolkit: deep in LangGraph and RAG, grounded in FastAPI, Docker, and Postgres, with an AI-PM certification from BITSoM on top.",
    event: { name: "stage:nav", detail: "skills" },
    chapter: "CH. 4 — CAPABILITIES",
    holdMs: 2400,
  },
  {
    say: "",
    event: { name: "stage:highlight", detail: "LangGraph" },
    holdMs: 2200,
  },
  {
    say: "And that's the tour. He's available now — notice period two weeks max. Ask me anything, paste a JD for a fit check, or just email him. I'll hand the controls back.",
    event: { name: "stage:nav", detail: "contact" },
    chapter: "FINALE — LET'S TALK",
    holdMs: 1500,
  },
];

// ── Stochastic tour script ─────────────────────────────────────
// The choreography (events, holds, chapters) is deterministic; the
// NARRATION is written fresh by the LLM each run — the "tell me about
// yourself" moment as storytelling, tailored to who's watching and
// what they've already seen. Falls back to the scripted lines.
const TOUR_BEATS = [
  "Hook: EMBER introduces itself and promises the 45-second version of Sankalp's story.",
  "Selected work: three production systems; flagship is a 10-agent LangGraph pipeline turning a CSV into a deployed ML model.",
  "Inside the flagship case study: sandboxed self-repair, 6-provider LLM fallback, 132 automated tests.",
  "Published research: two peer-reviewed 2023 papers — LSTM music generation, and sketch-to-HTML with YOLOv5.",
  "The arc: three years at FIS Global, IT Trainee to Implementation Conversion Analyst, data internship before that.",
  "The toolkit: LangGraph and RAG depth on FastAPI/Docker/Postgres foundations, plus a BITSoM AI-PM certification.",
  "Finale: available now, notice two weeks max — invite a JD fit check or a direct email.",
];

async function generateTourSays(persona: Persona): Promise<string[] | null> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content:
            `INTERNAL TOUR SCRIPT REQUEST (not a visitor message): Write EMBER's spoken guided tour of Sankalp's portfolio ` +
            `for a ${persona ?? "general"} visitor. Their session so far: ${summarize()}. ` +
            `This is the "tell me about yourself" interview moment — tell it as a STORY with momentum, don't read the page back. ` +
            `Third person about Sankalp, only verified facts, no emoji. Exactly 7 lines, one per beat:\n` +
            TOUR_BEATS.map((b, i) => `${i + 1}. ${b}`).join("\n") +
            `\nEach line under 28 words, natural spoken rhythm. Reply with a STRICT JSON array of exactly 7 strings.`,
        }],
        visitorType: persona,
      }),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    const m = ((d.content as string) ?? "").match(/\[[\s\S]*\]/)?.[0];
    if (!m) return null;
    const arr = JSON.parse(m) as unknown;
    if (
      Array.isArray(arr) && arr.length === 7 &&
      arr.every((s) => typeof s === "string" && s.length > 12 && s.length < 260)
    ) {
      return arr as string[];
    }
  } catch { /* deterministic script remains the floor */ }
  return null;
}

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
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const idRef = useRef(0);
  const tourAbortRef = useRef(false);
  const degradedRef = useRef(false);
  useEffect(() => { degradedRef.current = degraded; }, [degraded]);

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

  // Persist history whenever messages change
  useEffect(() => {
    if (messages.length > 0) saveHistory(messages);
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
    setMessages([]);
    setStatus("idle");
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  // ── Autonomous tour: streams narration + fires UI tools ─────
  const stopTour = useCallback((opts?: { silent?: boolean }) => {
    if (!tourAbortRef.current) {
      tourAbortRef.current = true;
      if (!opts?.silent) {
        setMessages((prev) => [
          ...prev,
          { id: ++idRef.current, role: "agent", content: "⏸ You took the wheel — tour paused. Ask me anything, or scroll on." },
        ]);
      }
    }
  }, []);

  const tour = useCallback(() => {
    if (tourRunning) return;
    tourAbortRef.current = false;
    setTourRunning(true);
    setOpen(true);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const streamOne = (text: string) =>
      new Promise<void>((resolve) => {
        const msgId = ++idRef.current;
        setStatus("streaming");
        streamWords(text, msgId, setMessages, () => resolve());
      });

    // "Take the wheel" detection: manual scroll input outside the dock
    // aborts the tour — the visitor always outranks the agent.
    const isInsideDock = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("[data-agent-dock]");
    const onWheel = (e: WheelEvent) => { if (!isInsideDock(e.target)) stopTour(); };
    const onTouchMove = (e: TouchEvent) => { if (!isInsideDock(e.target)) stopTour(); };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key) && !isInsideDock(e.target)) {
        stopTour();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);

    const chapterTotal = TOUR_STEPS.filter((s) => s.chapter).length;

    (async () => {
      // pulse the ambient layers like a real "thinking" moment
      window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: true }));

      // EMBER writes tonight's script — same choreography, fresh voice.
      setStatusLine("EMBER IS WRITING YOUR TOUR…");
      const says = await generateTourSays(persona);
      setStatusLine(null);
      let si = 0;
      const steps = TOUR_STEPS.map((s) =>
        s.say && says ? { ...s, say: says[si++] ?? s.say } : s
      );

      await sleep(400);
      window.dispatchEvent(new CustomEvent("agent-typing-change", { detail: false }));

      let chapterIdx = 0;
      for (const step of steps) {
        if (tourAbortRef.current) break;
        if (step.chapter) {
          chapterIdx++;
          setTourStep({ index: chapterIdx, total: chapterTotal });
          // Cinematic title card (ChapterTitle listens)
          window.dispatchEvent(new CustomEvent("tour:step", {
            detail: { chapter: step.chapter, index: chapterIdx, total: chapterTotal },
          }));
        }
        if (step.event) {
          window.dispatchEvent(new CustomEvent(step.event.name, { detail: step.event.detail }));
        }
        if (step.say) await streamOne(step.say);
        if (tourAbortRef.current) break;
        await sleep(step.holdMs);
      }

      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      // If aborted mid-case-study, don't leave a modal orphaned over the page
      if (tourAbortRef.current) {
        window.dispatchEvent(new CustomEvent("stage:case-close", { detail: "" }));
      } else {
        // Natural finish — nudge engine listens for this
        window.dispatchEvent(new CustomEvent("tour:done"));
      }
      setStatus("idle");
      setTourRunning(false);
      setTourStep(null);
    })();
  }, [tourRunning, stopTour, persona]);

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

    const section = sectionFor(text);
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
            ...messages.slice(-6).map((m) => ({
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
      if (res.status === 429) {
        exhausted = true;
      } else if (res.ok && res.body) {
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
      } else if (res.ok) {
        const data = await res.json();
        answer = (data.content as string) ?? null;
      }
    } catch { /* network failure — fall through to static answers */ }
    setStatusLine(null);

    // ── Degradation choreography ──────────────────────────────
    // Exhausted = every provider rate-limited. The core "powers down"
    // once, cinematically, and the site keeps working from verified
    // facts. Recovery announces itself the same way.
    const wasDegraded = degradedRef.current;
    setDegraded(answer === null);
    if (exhausted && !wasDegraded) {
      window.dispatchEvent(new CustomEvent("agent-core-down"));
      const notice =
        "⏻ Core saturation — every model channel is rate-limited right now, so I'm powering down to static mode. " +
        "I can still answer from Sankalp's verified facts, run the tour, and take /commands. " +
        "For anything deeper, leave your details in the contact section — Sankalp personally replies within 24 hours.";
      const noticeId = ++idRef.current;
      await new Promise<void>((r) => streamWords(notice, noticeId, setMessages, r));
    } else if (!exhausted && answer && wasDegraded) {
      window.dispatchEvent(new CustomEvent("agent-core-up"));
      push({ role: "agent", content: "● Core back online — full reasoning restored." });
    }

    let sectionFromAI: SectionId | null = null;
    if (answer) {
      const m = answer.match(/\[SECTION:(\w+)\]/);
      if (m) sectionFromAI = m[1] as SectionId;
      dispatchStageTags(answer);
      answer = answer
        .replace(/\[(SECTION|OPEN|NAV|REEL|HIGHLIGHT|CASE|UI_TOOL):[^\]]+\]/g, "")
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

    const target = sectionFromAI ?? section;
    if (target) setTimeout(() => focusSection(target), 250);
  }, [messages, persona, push, focusSection, runCommand]);

  return (
    <ConciergeContext.Provider
      value={{ messages, status, open, persona, setPersona: setPersonaAndSave, ask, setOpen, clear, focusSection, tour, stopTour, tourRunning, tourStep, degraded, statusLine }}
    >
      {children}
    </ConciergeContext.Provider>
  );
}

export function useConcierge() {
  const ctx = useContext(ConciergeContext);
  if (!ctx) throw new Error("useConcierge must be used within ConciergeProvider");
  return ctx;
}
