"use client";

// AgentDock — the AI concierge as a floating overlay layer.
// Desktop: bottom-right panel. Mobile: full-width bottom sheet.
// It floats ABOVE the page and never displaces or hides content.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Bot, Mic, MicOff, RotateCcw, Sparkles, TerminalSquare, User, Volume2, VolumeX, X } from "lucide-react";
import { personal } from "@/config/portfolio";
import { useConcierge, COMMANDS } from "@/contexts/ConciergeContext";
import { ember } from "@/lib/voice";

const CHIPS = [
  "What's his best work?",
  "When can he start?",
  "What makes him different?",
  "Paste a JD for a fit check",
];

const PLACEHOLDERS = [
  "Ask about Sankalp's work…",
  "Paste a job description for an honest fit check…",
  "What's the best thing he's built?",
  "What's his stack?",
];

// JD detection → offer a structured fit check
function looksLikeJD(text: string): boolean {
  if (text.length < 120) return false;
  const hits = ["experience", "role", "responsibilities", "requirements", "skills", "qualifications", "years", "position"]
    .filter((w) => text.toLowerCase().includes(w));
  return hits.length >= 3;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const emptySubscribe = () => () => {};
const hasSpeechRecognition = () =>
  !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  // Static capability check — external to React, so useSyncExternalStore
  // (server snapshot: false) keeps SSR and hydration consistent.
  const supported = useSyncExternalStore(emptySubscribe, hasSpeechRecognition, () => false);
  const recRef = useRef<any>(null);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e: any) => {
      const txt = e.results?.[0]?.[0]?.transcript ?? "";
      if (txt) onResult(txt);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  }, [onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, start, stop, supported };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const isMobileViewport = () => window.matchMedia("(max-width: 639px)").matches;

export default function AgentDock() {
  const { messages, status, open, setOpen, ask, clear, tourRunning, tourStep, stopTour, degraded, statusLine } = useConcierge();
  // EMBER voice — one-way narration, opt-in, persisted. External store
  // (localStorage + change event) so state never desyncs across mounts.
  const voiceOn = useSyncExternalStore(
    (cb) => {
      window.addEventListener("ember-voice-change", cb);
      return () => window.removeEventListener("ember-voice-change", cb);
    },
    () => ember.isEnabled(),
    () => false
  );
  const toggleVoice = () => {
    const next = !ember.isEnabled();
    ember.setEnabled(next);
    if (next) ember.speak("Ember online. I'll narrate from here.");
  };
  const [value, setValue] = useState("");
  const [ph, setPh] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isMobile = useSyncExternalStore(emptySubscribe, isMobileViewport, () => false);

  const thinking = status === "thinking";
  const showFitChip = looksLikeJD(value);
  // "/" autocomplete — the command deck is always available
  const commandMatches = value.startsWith("/")
    ? COMMANDS.filter((c) => c.cmd.startsWith(value.trim().toLowerCase())).slice(0, 6)
    : [];
  // On phones the full dock covers the page — during the tour it collapses
  // to a narration bar so the visitor can SEE the agent driving.
  const compact = tourRunning && isMobile;

  const close = () => {
    if (tourRunning) stopTour({ silent: true });
    setOpen(false);
  };

  // Rotate placeholder
  useEffect(() => {
    const id = setInterval(() => setPh((p) => (p + 1) % PLACEHOLDERS.length), 3600);
    return () => clearInterval(id);
  }, []);

  // Global focus event (Nav / Hero / Ctrl+K)
  useEffect(() => {
    const focusIn = () => taRef.current?.focus({ preventScroll: true });
    window.addEventListener("concierge-focus-input", focusIn);
    return () => window.removeEventListener("concierge-focus-input", focusIn);
  }, []);

  // Ctrl/Cmd+K toggles the dock — the ONLY global shortcut besides Esc-in-dock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => taRef.current?.focus({ preventScroll: true }), 80);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [value]);

  // Scroll to newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, status]);

  const submit = useCallback(
    (q?: string) => {
      const v = (q ?? value).trim();
      if (!v || thinking) return;
      setValue("");
      ask(v);
    },
    [value, thinking, ask]
  );

  const { listening, start, stop, supported: voiceSupported } = useVoiceInput((txt) => {
    setValue(txt);
    taRef.current?.focus();
  });

  // ── Compact narration bar (mobile + tour running) ───────────
  if (open && compact) {
    const lastAgent = [...messages].reverse().find((m) => m.role === "agent");
    return (
      <motion.div
        key="agent-dock-compact"
        data-agent-dock
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="fixed z-[1300] inset-x-2 bottom-2 rounded-2xl border overflow-hidden"
        style={{
          background: "var(--os-bg-window)",
          borderColor: "color-mix(in srgb, var(--os-accent-cyan) 40%, var(--os-border))",
          boxShadow: "var(--os-shadow-accent)",
        }}
        role="status"
        aria-live="polite"
        aria-label="AI tour narration"
      >
        <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1">
          <span className="flex items-center gap-2 text-[10.5px] font-mono mono-small" style={{ color: "var(--os-accent-cyan)" }}>
            <Sparkles size={10} className="animate-pulse" aria-hidden />
            THE AI IS DRIVING — scroll anytime to take over
          </span>
          <button
            onClick={() => stopTour()}
            className="text-[10.5px] font-mono px-2 py-0.5 rounded-md border transition-colors hover:bg-[var(--os-bg-hover)]"
            style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)" }}
          >
            Stop
          </button>
        </div>
        <div className="px-3.5 pb-3 text-[12.5px] leading-relaxed" style={{ color: "var(--os-text)", maxHeight: 72, overflow: "hidden" }}>
          {lastAgent?.content ?? "Starting the tour…"}
          {lastAgent?.streaming && <span className="tw-cursor" aria-hidden />}
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="agent-dock"
          data-agent-dock
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onKeyDown={(e) => { if (e.key === "Escape") close(); }}
          className={`fixed z-[1300] inset-x-0 bottom-0 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[420px] flex flex-col rounded-t-3xl sm:rounded-3xl border overflow-hidden ${degraded ? "core-flicker" : ""}`}
          style={{
            background: "var(--os-bg-window)",
            borderColor: "color-mix(in srgb, var(--os-accent) 25%, var(--os-border))",
            boxShadow: "var(--os-shadow-accent)",
            maxHeight: "min(72vh, 640px)",
          }}
          role="dialog"
          aria-label="AI concierge"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: "var(--os-border-subtle)" }}>
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-lg grid place-items-center"
                style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))" }}>
                <Bot size={14} className="text-white" aria-hidden />
                {thinking && (
                  <span className="absolute -inset-1 rounded-xl border-2 animate-ping"
                    style={{ borderColor: "color-mix(in srgb, var(--os-accent) 45%, transparent)" }} aria-hidden />
                )}
              </div>
              <div>
                <div className="text-[13px] font-semibold leading-none" style={{ color: "var(--os-text)" }}>
                  AI Concierge
                  {tourRunning && tourStep && (
                    <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "color-mix(in srgb, var(--os-accent-cyan) 14%, transparent)", color: "var(--os-accent-cyan)" }}>
                      Chapter {tourStep.index}/{tourStep.total}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono mt-1" style={{ color: statusLine ? "var(--os-accent)" : "var(--os-text-muted)" }}>
                  {statusLine ? (
                    // Live system telemetry — real provider reroutes, mono ticker
                    <span className="uppercase tracking-[0.12em]">
                      {statusLine}<span className="cursor-blink">▊</span>
                    </span>
                  ) : degraded ? (
                    <span className="uppercase tracking-[0.12em]" style={{ color: "var(--os-accent-orange)" }}>
                      ⏻ static mode — verified facts + /commands still live
                    </span>
                  ) : thinking ? "thinking…" : `answers about ${personal.shortName} — can be wrong; resume is the source of truth`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* EMBER voice toggle — the concierge narrates when lit */}
              {ember.supported() && (
                <button
                  onClick={toggleVoice}
                  aria-label={voiceOn ? "Mute EMBER's voice" : "Enable EMBER's voice narration"}
                  title={voiceOn ? "EMBER: voice on" : "EMBER: voice off"}
                  className="grid place-items-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                  style={{ color: voiceOn ? "var(--os-accent)" : "var(--os-text-muted)" }}
                >
                  {voiceOn ? <Volume2 size={13} aria-hidden /> : <VolumeX size={13} aria-hidden />}
                </button>
              )}
              {tourRunning && (
                <button
                  onClick={() => stopTour()}
                  className="text-[10.5px] font-mono px-2.5 py-1 rounded-md border transition-colors hover:bg-[var(--os-bg-hover)]"
                  style={{ borderColor: "color-mix(in srgb, var(--os-accent-cyan) 40%, var(--os-border))", color: "var(--os-accent-cyan)" }}
                >
                  Stop tour
                </button>
              )}
              {messages.length > 0 && (
                <button
                  onClick={clear}
                  aria-label="Reset conversation"
                  className="grid place-items-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                  style={{ color: "var(--os-text-muted)" }}
                >
                  <RotateCcw size={13} aria-hidden />
                </button>
              )}
              <button
                onClick={close}
                aria-label="Close concierge"
                className="grid place-items-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                style={{ color: "var(--os-text-muted)" }}
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[120px]" aria-live="polite">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-[13px] mb-4" style={{ color: "var(--os-text-secondary)" }}>
                  Ask anything about {personal.shortName}&apos;s work, skills, or availability — or paste a
                  job description for an honest fit check.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {CHIPS.map((c) => (
                    <button
                      key={c}
                      onClick={() => (c.includes("JD") ? taRef.current?.focus() : submit(c))}
                      className="text-[12px] px-3 py-1.5 rounded-full border transition-all hover:-translate-y-0.5"
                      style={{
                        borderColor: "var(--os-border)",
                        color: "var(--os-text-secondary)",
                        background: "color-mix(in srgb, var(--os-bg-surface) 60%, transparent)",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.slice(-12).map((m) => (
              <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <span
                  className="grid place-items-center w-6 h-6 rounded-lg shrink-0 mt-0.5"
                  style={{
                    background: m.role === "user"
                      ? "var(--os-bg-surface)"
                      : "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))",
                    color: m.role === "user" ? "var(--os-text-muted)" : "#fff",
                  }}
                  aria-hidden
                >
                  {m.role === "user" ? <User size={11} /> : <Bot size={11} />}
                </span>
                <div
                  className={`text-[13px] leading-relaxed px-3.5 py-2.5 rounded-2xl max-w-[85%] ${m.role === "user" ? "rounded-tr-md" : "rounded-tl-md"}`}
                  style={{
                    background: m.role === "user"
                      ? "color-mix(in srgb, var(--os-accent) 12%, var(--os-bg-surface))"
                      : "var(--os-bg-surface)",
                    color: "var(--os-text)",
                    whiteSpace: "pre-line", // /help lists render line-by-line
                  }}
                >
                  {m.content}
                  {m.streaming && <span className="tw-cursor" aria-hidden />}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex items-center gap-2 text-[12px] font-mono pl-9" style={{ color: "var(--os-text-muted)" }}>
                <Sparkles size={11} className="animate-pulse" style={{ color: "var(--os-accent)" }} aria-hidden />
                thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Degraded mode — the concierge never dies, it switches protocol */}
          {degraded && (
            <div className="mx-4 mb-1 px-3 py-2 rounded-xl border flex items-start gap-2 shrink-0"
              style={{
                borderColor: "color-mix(in srgb, var(--os-accent-orange) 40%, transparent)",
                background: "color-mix(in srgb, var(--os-accent-orange) 8%, transparent)",
              }}>
              <TerminalSquare size={13} className="mt-0.5 shrink-0" style={{ color: "var(--os-accent-orange)" }} aria-hidden />
              <div className="text-[11px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
                <strong style={{ color: "var(--os-accent-orange)" }}>Command deck engaged</strong> — the language
                models are napping, but I still drive. Type <span className="font-mono">/</span> for commands:{" "}
                {["/work", "/resume", "/tour", "/contact"].map((c) => (
                  <button key={c} onClick={() => ask(c)} className="font-mono underline mr-1.5" style={{ color: "var(--os-accent-cyan)" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* "/" command autocomplete */}
          {commandMatches.length > 0 && (
            <div className="mx-4 mb-1 rounded-xl border overflow-hidden shrink-0"
              style={{ borderColor: "var(--os-border)", background: "var(--os-bg-surface)" }}>
              {commandMatches.map((c) => (
                <button
                  key={c.cmd}
                  onMouseDown={(e) => { e.preventDefault(); setValue(""); ask(c.cmd); }}
                  className="w-full flex items-center justify-between text-left px-3 py-2 text-[12px] transition-colors hover:bg-[var(--os-bg-hover)]"
                >
                  <span className="font-mono" style={{ color: "var(--os-accent-cyan)" }}>{c.cmd}</span>
                  <span style={{ color: "var(--os-text-muted)" }}>{c.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Fit-check chip */}
          {showFitChip && (
            <div className="px-4 pb-1 flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                Looks like a JD —
              </span>
              <button
                onClick={() => submit(`How well does Sankalp fit this job description? Be honest about gaps.\n\n${value}`)}
                className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full border transition-all hover:scale-[1.02]"
                style={{
                  borderColor: "color-mix(in srgb, var(--os-accent-cyan) 45%, transparent)",
                  color: "var(--os-accent-cyan)",
                  background: "color-mix(in srgb, var(--os-accent-cyan) 10%, transparent)",
                }}
              >
                <Sparkles size={10} aria-hidden /> Run fit check →
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 shrink-0">
            <div
              className="flex items-end gap-2 rounded-2xl border px-3.5 py-2.5"
              style={{ background: "var(--os-bg-surface)", borderColor: "var(--os-border)" }}
            >
              <textarea
                ref={taRef}
                rows={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                }}
                placeholder={tourRunning ? "The AI is driving — scroll to take over…" : listening ? "Listening…" : PLACEHOLDERS[ph]}
                disabled={tourRunning}
                spellCheck={false}
                aria-label="Ask the AI concierge"
                className="flex-1 resize-none bg-transparent outline-none text-[13.5px] leading-relaxed placeholder:opacity-50 py-1"
                style={{ color: "var(--os-text)" }}
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={listening ? stop : start}
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                  className={`shrink-0 grid place-items-center w-8 h-8 rounded-xl transition-all hover:scale-105 active:scale-95 ${listening ? "voice-active" : ""}`}
                  style={{
                    color: listening ? "var(--os-accent-orange)" : "var(--os-text-muted)",
                    background: listening ? "color-mix(in srgb, var(--os-accent-orange) 15%, transparent)" : "transparent",
                  }}
                >
                  {listening ? <MicOff size={14} aria-hidden /> : <Mic size={14} aria-hidden />}
                </button>
              )}
              <button
                onClick={() => submit()}
                disabled={!value.trim() || thinking}
                aria-label="Send"
                className="shrink-0 grid place-items-center w-8 h-8 rounded-xl transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "#fff" }}
              >
                <ArrowUp size={15} strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
