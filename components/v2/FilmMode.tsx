"use client";

// ── FilmMode ─────────────────────────────────────────────────
// The cinema shell. When the tour begins the room changes: letterbox bars
// slide in, the background darkens, the navbar lifts away, the cursor cools.
// Each act announces itself with a title card, the camera settles, and only
// then does narration begin. A synchronized HUD lights up on cue — the
// counter climbs to 132 exactly as the words land, the Recover and Evaluation
// nodes glow the instant they're named. Nothing here fabricates data; every
// cue is fired by the script in lockstep with the voice.
//
// Driven entirely by events from the tour runner (decoupled from state):
//   film:enter · film:act · film:cue · film:exit

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { helios } from "@/lib/voice";

interface Act { act: string; title: string }
type CueState = { tests: boolean; recover: boolean; evalNode: boolean; agents: boolean; label: string | null };

const EASE = [0.22, 1, 0.36, 1] as const;

export default function FilmMode() {
  const [on, setOn] = useState(false);
  const [act, setAct] = useState<Act | null>(null);
  const [exiting, setExiting] = useState<string | null>(null); // farewell line
  const [caption, setCaption] = useState<string | null>(null); // live narration line
  const [voiceOn, setVoiceOn] = useState(false);
  const [cue, setCue] = useState<CueState>({ tests: false, recover: false, evalNode: false, agents: false, label: null });
  const [count, setCount] = useState(0);
  const actTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const countRaf = useRef<number>(0);

  useEffect(() => {
    const root = document.documentElement;

    const onEnter = () => {
      setExiting(null);
      setCaption(null);
      setVoiceOn(helios.isEnabled());
      setOn(true);
      setCue({ tests: false, recover: false, evalNode: false, agents: false, label: null });
      setCount(0);
      root.classList.add("film-mode");
    };

    const onCaption = (e: Event) => setCaption((e as CustomEvent<string>).detail ?? null);
    const onVoiceChange = (e: Event) => setVoiceOn(!!(e as CustomEvent<boolean>).detail);

    const onAct = (e: Event) => {
      const detail = (e as CustomEvent<Act>).detail;
      setAct(detail);
      // CRITICAL: clear the synced HUD at every act boundary. Otherwise the
      // 132 counter / RECOVER / EVAL nodes from ACT III persist into ACT IV
      // (Skills) and beyond — cues spread previous state and were never reset.
      cancelAnimationFrame(countRaf.current);
      setCue({ tests: false, recover: false, evalNode: false, agents: false, label: null });
      setCount(0);
      clearTimeout(actTimer.current);
      // Card lives ~1.2s, then dissolves — camera and narration take over.
      // (Trimmed from 1.9s to match the brisker tour pace so it never lingers
      // over the first caption.)
      actTimer.current = setTimeout(() => setAct(null), 1200);
    };

    const onCue = (e: Event) => {
      const c = (e as CustomEvent<string>).detail;
      root.classList.add("film-spotlight");
      if (c === "flagship:tests") {
        setCue((p) => ({ ...p, tests: true, label: "AUTOMATED TESTS" }));
        // Count to 132 in time with the line (~1.4s)
        cancelAnimationFrame(countRaf.current);
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1400);
          setCount(Math.round(132 * (1 - Math.pow(1 - t, 3))));
          if (t < 1) countRaf.current = requestAnimationFrame(tick);
        };
        countRaf.current = requestAnimationFrame(tick);
      } else if (c === "flagship:recover") {
        setCue((p) => ({ ...p, recover: true, label: "SELF-REPAIR" }));
      } else if (c === "flagship:eval") {
        setCue((p) => ({ ...p, evalNode: true, label: "EVALUATION GATE" }));
      } else if (c === "flagship:agents") {
        setCue((p) => ({ ...p, agents: true, label: "10 AGENTS" }));
      } else if (c === "arc:impact") {
        setCue((p) => ({ ...p, label: "−90% MANUAL ENTRY" }));
      } else if (c === "arc:fis") {
        setCue((p) => ({ ...p, label: "3 YEARS · FIS GLOBAL" }));
      } else if (c === "think:verify") {
        setCue((p) => ({ ...p, label: "ZERO FABRICATED CITATIONS" }));
      } else if (c === "think:stack") {
        setCue((p) => ({ ...p, label: "LANGGRAPH · RAG · EVAL" }));
      } else if (c === "why:meta") {
        setCue((p) => ({ ...p, label: "YOU ARE INSIDE THE PROOF" }));
      }
    };

    const onExit = (e: Event) => {
      const graceful = (e as CustomEvent<{ graceful?: boolean; line?: string }>).detail?.graceful;
      const line = (e as CustomEvent<{ line?: string }>).detail?.line ?? null;
      setAct(null);
      setCaption(null);
      setCue({ tests: false, recover: false, evalNode: false, agents: false, label: null });
      if (line) {
        setExiting(line);
        setTimeout(() => setExiting(null), graceful ? 2600 : 3400);
      }
      // Let the farewell breathe, then restore the room.
      setTimeout(() => {
        setOn(false);
        root.classList.remove("film-mode", "film-spotlight");
      }, line ? 900 : 200);
    };

    window.addEventListener("film:enter", onEnter);
    window.addEventListener("film:act", onAct);
    window.addEventListener("film:cue", onCue);
    window.addEventListener("film:exit", onExit);
    window.addEventListener("film:caption", onCaption);
    window.addEventListener("helios-voice-change", onVoiceChange);
    return () => {
      window.removeEventListener("film:enter", onEnter);
      window.removeEventListener("film:act", onAct);
      window.removeEventListener("film:cue", onCue);
      window.removeEventListener("film:exit", onExit);
      window.removeEventListener("film:caption", onCaption);
      window.removeEventListener("helios-voice-change", onVoiceChange);
      clearTimeout(actTimer.current);
      cancelAnimationFrame(countRaf.current);
      root.classList.remove("film-mode", "film-spotlight");
    };
  }, []);

  const anyCue = cue.tests || cue.recover || cue.evalNode || cue.agents || cue.label;

  return (
    <>
      {/* Letterbox bars — the film frame */}
      <AnimatePresence>
        {on && (
          <>
            <motion.div
              key="lb-top"
              className="fixed top-0 inset-x-0 z-[1400] pointer-events-none"
              style={{ background: "#000", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
              initial={{ height: 0 }}
              animate={{ height: "10vh" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
              aria-hidden
            />
            <motion.div
              key="lb-bottom"
              className="fixed bottom-0 inset-x-0 z-[1400] pointer-events-none"
              style={{ background: "#000", boxShadow: "0 -8px 24px rgba(0,0,0,0.5)" }}
              initial={{ height: 0 }}
              animate={{ height: "10vh" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
              aria-hidden
            />
            {/* Ambient darken — the theatre dims */}
            <motion.div
              key="dim"
              className="fixed inset-0 z-[1380] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 72% 60% at 50% 46%, transparent 48%, color-mix(in srgb, var(--os-bg) 82%, #000) 100%)",
              }}
              aria-hidden
            />
          </>
        )}
      </AnimatePresence>

      {/* Act card — ACT III / WHAT I BUILD */}
      <AnimatePresence>
        {act && (
          <motion.div
            key={act.title}
            className="fixed inset-0 z-[1440] flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            aria-live="polite"
          >
            <motion.div
              className="text-[12px] font-mono tracking-[0.55em] mb-5"
              style={{ color: "var(--os-accent-cyan)" }}
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, letterSpacing: "0.55em" }}
              transition={{ duration: 1, ease: EASE }}
            >
              {act.act}
            </motion.div>
            <motion.div
              className="font-display font-bold tracking-tight text-center px-8"
              style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", color: "#fff", textShadow: "0 2px 40px rgba(0,0,0,0.6)" }}
              initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            >
              {act.title}
            </motion.div>
            <motion.div
              className="mt-7 h-[2px] w-0 rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, var(--os-accent), var(--os-accent-cyan), transparent)" }}
              animate={{ width: 220 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              aria-hidden
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synced cue HUD — sits just above the bottom letterbox bar */}
      <AnimatePresence>
        {on && anyCue && !act && (
          <motion.div
            key="hud"
            className="fixed inset-x-0 z-[1420] flex justify-center pointer-events-none"
            style={{ bottom: "21vh" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.45, ease: EASE }}
            aria-hidden
          >
            <div
              className="flex items-center gap-4 px-5 py-3 rounded-2xl border backdrop-blur-md"
              style={{
                background: "color-mix(in srgb, #000 55%, transparent)",
                borderColor: "color-mix(in srgb, var(--os-accent-cyan) 30%, transparent)",
              }}
            >
              {cue.label && (
                <span className="text-[11px] font-mono tracking-[0.28em]" style={{ color: "var(--os-accent-cyan)" }}>
                  {cue.label}
                </span>
              )}
              {cue.tests && (
                <span className="font-display font-bold tabular-nums" style={{ fontSize: 26, color: "#fff" }}>
                  {count}
                </span>
              )}
              {(cue.recover || cue.evalNode) && (
                <div className="flex items-center gap-2">
                  <Node label="RECOVER" glow={cue.recover} />
                  <Node label="EVAL" glow={cue.evalNode} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinema captions — the narration as an on-screen lower third. Rather
          than a floating pill (which clashed with whatever canvas/content sat
          behind it), the text lives inside a soft gradient veil rising from the
          bottom letterbox: a guaranteed-dark backing that never overlaps the
          section visually. The veil only appears while a line is showing, so it
          doesn't hide the content the camera drifts down to reveal. */}
      {on && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[1430] flex items-end justify-center px-4 pointer-events-none"
          style={{
            // Taller + darker veil so even a two-line caption sits on solid
            // shade rather than drifting up over a busy canvas (BioScanner,
            // ProofCore) where it used to clash.
            height: "46vh",
            paddingBottom: "12vh",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.86) 28%, rgba(0,0,0,0.5) 58%, transparent 100%)",
          }}
          animate={{ opacity: caption && !act ? 1 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <AnimatePresence mode="wait">
            {caption && !act && (
              <motion.p
                key={caption}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: EASE }}
                className="text-center font-display font-medium max-w-[42rem]"
                style={{
                  fontSize: "clamp(1.05rem, 2.4vw, 1.6rem)",
                  lineHeight: 1.4,
                  color: "#fff",
                  textShadow: "0 2px 18px rgba(0,0,0,0.95)",
                  // A soft, blurred plate that hugs the text — guarantees the
                  // caption stays legible over any canvas behind it, without the
                  // hard-edged "pill" that clashed. Padding keeps it off the words.
                  padding: "0.55em 1.1em",
                  borderRadius: "14px",
                  background: "rgba(0,0,0,0.42)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
                aria-live="polite"
              >
                {caption}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Sound toggle — mute keeps the lifelike voice (ElevenLabs) from being
          called at all, so credits are never spent when the visitor wants it
          silent. Captions carry the narration either way. */}
      {on && (
        <div className="fixed z-[1460] pointer-events-auto" style={{ top: "12vh", right: "1.25rem" }}>
          <button
            onClick={() => helios.setEnabled(!voiceOn)}
            aria-label={voiceOn ? "Mute narration" : "Unmute narration"}
            aria-pressed={voiceOn}
            className="grid place-items-center w-10 h-10 rounded-full border backdrop-blur-md transition-colors hover:bg-white/10 active:scale-95"
            style={{
              background: "color-mix(in srgb, #000 55%, transparent)",
              borderColor: "color-mix(in srgb, var(--os-accent-cyan) 30%, transparent)",
              color: "#fff",
            }}
          >
            {voiceOn ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
          </button>
        </div>
      )}

      {/* Farewell line as the film releases */}
      <AnimatePresence>
        {exiting && (
          <motion.div
            key="fin"
            className="fixed inset-0 z-[1440] flex items-center justify-center pointer-events-none text-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{
              // Dark scrim behind the line — the ambient dim is transparent in
              // the centre, which left this white text nearly invisible.
              background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0,0,0,0.72), transparent 70%)",
            }}
            aria-live="polite"
          >
            <span
              className="font-display font-medium"
              style={{ fontSize: "clamp(1.3rem, 3.4vw, 2.2rem)", color: "#fff", textShadow: "0 2px 30px rgba(0,0,0,0.85)" }}
            >
              {exiting}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Node({ label, glow }: { label: string; glow: boolean }) {
  return (
    <span
      className="text-[10px] font-mono tracking-[0.2em] px-2.5 py-1 rounded-full border transition-all duration-500"
      style={{
        color: glow ? "#fff" : "var(--os-text-muted)",
        borderColor: glow ? "var(--os-accent-cyan)" : "color-mix(in srgb, #fff 15%, transparent)",
        background: glow ? "color-mix(in srgb, var(--os-accent-cyan) 22%, transparent)" : "transparent",
        boxShadow: glow ? "0 0 20px color-mix(in srgb, var(--os-accent-cyan) 60%, transparent)" : "none",
      }}
    >
      {label}
    </span>
  );
}
