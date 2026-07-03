"use client";

// NudgeLayer — the proof that "AI-based portfolio" isn't a slogan.
// Watches real behavior signals (tour completed, case studies opened,
// dwell time) and offers ONE relevant next step, phrased by the LLM
// for the visitor's persona — with a deterministic template fallback
// so it still works offline. Each nudge fires at most once per session.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, FileText, Mail, ArrowUpRight, Play } from "lucide-react";
import { personal, social } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";

type NudgeId = "post-tour" | "case-explorer" | "long-dwell" | "idle-explorer";

interface Nudge {
  id: NudgeId;
  text: string;
  ctas: { label: string; icon: React.ReactNode; run: () => void }[];
}

// Deterministic fallback copy per (nudge, persona)
function templateText(id: NudgeId, persona: string | null): string {
  const p = persona ?? "explorer";
  const T: Record<NudgeId, Record<string, string>> = {
    "post-tour": {
      recruiter: "You've seen the highlights — that's the 45-second case for Sankalp. Want the resume, or shall we talk?",
      cto: "Tour done. The architecture depth lives in the case studies — or grab the resume for the summary.",
      developer: "That was the guided run. The interesting bits are in the case studies — or peek at the GitHub.",
      explorer: "Enjoyed the tour? That's Sankalp's work in 45 seconds. The resume has the rest.",
    },
    "case-explorer": {
      recruiter: "Two case studies deep — you're doing real diligence. A JD fit check would take 20 seconds.",
      cto: "You've read multiple architectures now. Paste your role's requirements — I'll map them to what he's built.",
      developer: "Multiple case studies read — respect. Want the stack details, or a fit check against your team's needs?",
      explorer: "You're really digging in! Paste any job description and I'll show how Sankalp matches it.",
    },
    "long-dwell": {
      recruiter: "You've spent a few minutes here — usually a good sign. Sankalp responds within 24 hours.",
      cto: "Still here — the questions get better in person. Sankalp is available now, notice two weeks max.",
      developer: "Few minutes in — if this resonates, he's open to talking shop anytime.",
      explorer: "Been exploring a while — if anything caught your eye, Sankalp would love to hear it.",
    },
    "idle-explorer": {
      recruiter: "Short on time? The 45-second tour hits everything a screen call would.",
      cto: "Fastest way to evaluate: the guided tour opens the flagship case study for you.",
      developer: "Not sure where to start? The tour drives you through the whole thing.",
      explorer: "Not sure where to start? Let the AI drive — 45 seconds, zero scrolling.",
    },
  };
  return T[id][p] ?? T[id].explorer;
}

// Try the LLM for persona-flavored phrasing; fall back to templates.
async function generateText(id: NudgeId, persona: string | null, signal: string): Promise<string> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `INTERNAL NUDGE REQUEST (not a visitor message): A ${persona ?? "general"} visitor ${signal}. Write ONE friendly sentence (max 120 chars) suggesting a relevant next step on Sankalp's portfolio. No emoji spam, no exclamation overload, third person about Sankalp. Reply with the sentence only.`,
        }],
        visitorType: persona,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const text = (data.content as string)?.trim();
      // Sanity: single reasonable sentence, or fall back
      if (text && text.length > 20 && text.length < 200 && !text.includes("[")) return text;
    }
  } catch { /* fall back */ }
  return templateText(id, persona);
}

const fired = (id: NudgeId) => sessionStorage.getItem(`nudge-${id}`) === "1";
const markFired = (id: NudgeId) => sessionStorage.setItem(`nudge-${id}`, "1");

export default function NudgeLayer() {
  const { persona, open: dockOpen, tour, setOpen } = useConcierge();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const caseOpensRef = useRef(0);
  // Keep the latest persona available to event handlers without
  // re-subscribing them; updated in an effect, not during render.
  const personaRef = useRef(persona);
  useEffect(() => { personaRef.current = persona; }, [persona]);

  const dismiss = useCallback(() => setNudge(null), []);

  const show = useCallback(async (id: NudgeId, signal: string, ctas: Nudge["ctas"]) => {
    if (fired(id)) return;
    markFired(id);
    const text = await generateText(id, personaRef.current, signal);
    setNudge({ id, text, ctas });
  }, []);

  // CTA builders
  const ctaResume = useCallback(() => ({
    label: "View resume", icon: <FileText size={11} aria-hidden />,
    run: () => { window.dispatchEvent(new CustomEvent("resume:open")); dismiss(); },
  }), [dismiss]);
  const ctaEmail = useCallback(() => ({
    label: "Email Sankalp", icon: <Mail size={11} aria-hidden />,
    run: () => { window.location.href = `mailto:${personal.email}`; dismiss(); },
  }), [dismiss]);
  const ctaLinkedIn = useCallback(() => ({
    label: "LinkedIn", icon: <ArrowUpRight size={11} aria-hidden />,
    run: () => { window.open(social.linkedin, "_blank", "noopener"); dismiss(); },
  }), [dismiss]);
  const ctaFitCheck = useCallback(() => ({
    label: "Run a fit check", icon: <Sparkles size={11} aria-hidden />,
    run: () => {
      setOpen(true);
      setTimeout(() => window.dispatchEvent(new CustomEvent("concierge-focus-input")), 80);
      dismiss();
    },
  }), [setOpen, dismiss]);
  const ctaTour = useCallback(() => ({
    label: "Start the tour", icon: <Play size={11} aria-hidden />,
    run: () => { tour(); dismiss(); },
  }), [tour, dismiss]);

  // Signal 1: tour completed → hire/connect nudge
  useEffect(() => {
    const onDone = () => show("post-tour", "just finished the guided tour", [ctaResume(), ctaLinkedIn()]);
    window.addEventListener("tour:done", onDone);
    return () => window.removeEventListener("tour:done", onDone);
  }, [show, ctaResume, ctaLinkedIn]);

  // Signal 2: opened 2+ case studies → fit-check nudge
  useEffect(() => {
    const onCase = () => {
      caseOpensRef.current++;
      if (caseOpensRef.current >= 2) {
        show("case-explorer", "has opened multiple project case studies", [ctaFitCheck(), ctaResume()]);
      }
    };
    window.addEventListener("stage:case", onCase);
    return () => window.removeEventListener("stage:case", onCase);
  }, [show, ctaFitCheck, ctaResume]);

  // Signal 3: 3 minutes of dwell → connect nudge
  useEffect(() => {
    const t = setTimeout(() => {
      show("long-dwell", "has spent over 3 minutes exploring", [ctaEmail(), ctaLinkedIn()]);
    }, 180_000);
    return () => clearTimeout(t);
  }, [show, ctaEmail, ctaLinkedIn]);

  // Signal 4: 45s in with no interaction → tour nudge
  useEffect(() => {
    let interacted = false;
    const mark = () => { interacted = true; };
    window.addEventListener("pointerdown", mark, { once: true });
    window.addEventListener("keydown", mark, { once: true });
    const t = setTimeout(() => {
      if (!interacted && window.scrollY < 300) {
        show("idle-explorer", "has been idle on the first screen", [ctaTour()]);
      }
    }, 45_000);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("keydown", mark);
    };
  }, [show, ctaTour]);

  return (
    <AnimatePresence>
      {nudge && !dockOpen && (
        <motion.div
          key={nudge.id}
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 right-5 z-[1240] w-[calc(100%-2.5rem)] sm:w-[320px] rounded-2xl border p-4"
          style={{
            background: "var(--os-bg-window)",
            borderColor: "color-mix(in srgb, var(--os-accent) 30%, var(--os-border))",
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
            <p className="text-[12.5px] leading-relaxed flex-1" style={{ color: "var(--os-text)" }}>
              {nudge.text}
            </p>
            <button onClick={dismiss} aria-label="Dismiss suggestion"
              className="grid place-items-center w-6 h-6 rounded-md shrink-0 transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ color: "var(--os-text-muted)" }}>
              <X size={11} aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pl-8">
            {nudge.ctas.map((c) => (
              <button
                key={c.label}
                onClick={c.run}
                className="flex items-center gap-1.5 text-[11.5px] font-mono px-3 py-1.5 rounded-lg border transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: "color-mix(in srgb, var(--os-accent) 40%, transparent)",
                  color: "var(--os-accent)",
                  background: "color-mix(in srgb, var(--os-accent) 8%, transparent)",
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
