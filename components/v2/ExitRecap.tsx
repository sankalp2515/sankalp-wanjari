"use client";

// ExitRecap — the "the AI watched you" sign-off.
//
// As an engaged visitor makes to leave, one synthesized line reflects what they
// actually spent time on and opens a door. The hard constraint: `beforeunload`
// can't await a fetch, so the recap is PRECOMPUTED in the background once the
// visitor is clearly engaged (budget-gated, one call), cached, and shown
// instantly on exit-intent. If nothing was precomputed, a deterministic
// template stands in — it never blocks, never fabricates.
//
// Exit-intent: desktop = mouse leaving toward the browser chrome (clientY<=0);
// touch = a long idle (no mouseleave exists there). Once per session.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, FileText, Mail } from "lucide-react";
import { personal } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import { summarize, getLog } from "@/lib/behavior";
import { spendProactive } from "@/lib/aiBudget";

const FIRED_KEY = "exit-recap-shown";
const IDLE_MS = 210_000; // touch fallback: 3.5 min idle

async function generateRecap(): Promise<string | null> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content:
            "INTERNAL EXIT-RECAP REQUEST (not a visitor message): the visitor is about to leave. " +
            "Based ONLY on what they actually did this session, write a warm TWO-sentence sign-off " +
            "(max 220 chars, third person about Sankalp) that reflects their SPECIFIC interest and " +
            "gently opens a next step. No greeting, no the word 'goodbye' — just the two sentences.\n" +
            `WHAT THEY DID: ${summarize()}`,
        }],
        visitorType: null,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const text = ((await res.json()) as { content?: string }).content?.trim();
    return text && text.length > 20 && text.length < 340 ? text : null;
  } catch {
    return null;
  }
}

function templateRecap(): string {
  const log = getLog();
  const has = (e: string) => log.some((x) => x.e === e);
  if (has("case-open"))
    return `You went deep on the engineering — if that's the kind of work your team needs, ${personal.shortName} is available now and replies within a day.`;
  if (has("asked"))
    return `Thanks for the questions — if ${personal.shortName}'s work fits what you're building, he's open to talking and replies within a day.`;
  return `If any of ${personal.shortName}'s work fits what you're building, he's available now and replies within a day.`;
}

// Engaged enough to be worth a recap? (Don't sign off an instant bounce.)
function engaged(): boolean {
  const log = getLog();
  if (!log.length) return false;
  const dwellMs = Date.now() - log[0].t;
  const meaningful = log.some((x) => x.e === "case-open" || x.e === "asked" || x.e === "resume-open");
  return meaningful || dwellMs > 60_000;
}

export default function ExitRecap() {
  const { open, tourRunning } = useConcierge();
  const [msg, setMsg] = useState<string | null>(null);
  const precomputed = useRef<string | null>(null);
  const firedRef = useRef(false);

  const alreadyFired = () => {
    if (firedRef.current) return true;
    try { return sessionStorage.getItem(FIRED_KEY) === "1"; } catch { return false; }
  };

  // Precompute once, in the background, when the visitor is clearly engaged.
  useEffect(() => {
    let done = false;
    const tryPrecompute = async () => {
      if (done || precomputed.current || alreadyFired()) return;
      if (!engaged()) return;
      done = true;
      const gen = await spendProactive(generateRecap); // null if budget/offline
      precomputed.current = gen; // may stay null → template used at show time
    };
    const t = setTimeout(tryPrecompute, 75_000);
    window.addEventListener("stage:case", tryPrecompute);
    return () => { clearTimeout(t); window.removeEventListener("stage:case", tryPrecompute); };
  }, []);

  const reveal = useCallback(() => {
    if (alreadyFired() || !engaged() || open || tourRunning) return;
    firedRef.current = true;
    try { sessionStorage.setItem(FIRED_KEY, "1"); } catch { /* ignore */ }
    setMsg(precomputed.current ?? templateRecap());
  }, [open, tourRunning]);

  // Desktop exit-intent: cursor leaves toward the browser chrome.
  useEffect(() => {
    if (window.matchMedia?.("(pointer: coarse)").matches) return; // touch handled below
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) reveal(); };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [reveal]);

  // Touch fallback: a long idle stands in for "leaving".
  useEffect(() => {
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;
    let t: ReturnType<typeof setTimeout>;
    const arm = () => { clearTimeout(t); t = setTimeout(reveal, IDLE_MS); };
    const evs = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, arm)); };
  }, [reveal]);

  // Yield if the dock opens or the tour starts.
  useEffect(() => { if (open || tourRunning) setMsg(null); }, [open, tourRunning]);

  const dismiss = () => setMsg(null);
  const openResume = () => { window.dispatchEvent(new CustomEvent("resume:open")); dismiss(); };
  const email = () => { window.location.href = `mailto:${personal.email}`; dismiss(); };

  return (
    <AnimatePresence>
      {msg && !open && !tourRunning && (
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1260] w-[calc(100%-2rem)] sm:w-[380px] rounded-2xl border p-4"
          style={{
            background: "var(--os-bg-window)",
            borderColor: "color-mix(in srgb, var(--os-accent) 32%, var(--os-border))",
            boxShadow: "var(--os-shadow-accent)",
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2.5 mb-3">
            <span className="grid place-items-center w-6 h-6 rounded-lg shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))" }}>
              <Sparkles size={11} className="text-white" aria-hidden />
            </span>
            <p className="text-[12.5px] leading-relaxed flex-1" style={{ color: "var(--os-text)" }}>{msg}</p>
            <button onClick={dismiss} aria-label="Dismiss"
              className="grid place-items-center w-6 h-6 rounded-md shrink-0 transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ color: "var(--os-text-muted)" }}>
              <X size={11} aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pl-8">
            <button onClick={openResume}
              className="flex items-center gap-1.5 text-[11.5px] font-mono px-3 py-1.5 rounded-lg border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "color-mix(in srgb, var(--os-accent) 40%, transparent)", color: "var(--os-accent)", background: "color-mix(in srgb, var(--os-accent) 8%, transparent)" }}>
              <FileText size={11} aria-hidden /> View resume
            </button>
            <button onClick={email}
              className="flex items-center gap-1.5 text-[11.5px] font-mono px-3 py-1.5 rounded-lg border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)" }}>
              <Mail size={11} aria-hidden /> Reach out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
