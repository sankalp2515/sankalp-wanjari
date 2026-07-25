"use client";

// Seven seconds: a clear provocation, one tactile object, and proof.
// Everything else waits until the visitor decides to keep going.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, MessageSquare, Play } from "lucide-react";
import { personal } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import CountUp from "./CountUp";
import type { EvidenceNodeId } from "./ProofField";
import Image from "next/image";
import { useHeavyOk } from "@/lib/useHeavyOk";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MOBILE_TUNING } from "@/config/mobileTuning";
import { useTheme } from "@/contexts/ThemeContext";

const ProofCore = dynamic(() => import("./ProofCore"), { ssr: false });
const ProofField = dynamic(() => import("./ProofField"), { ssr: false });
const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero({ variant = "a" }: { variant?: "a" | "b" }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [proofStep, setProofStep] = useState(0);
  const [scrollStep, setScrollStep] = useState(0);
  const [evidenceId, setEvidenceId] = useState<EvidenceNodeId>("001");
  // When the concierge is reasoning, the hero object comes alive — it churns,
  // brightens, and pulses like it's thinking. Reduces the "static prop" feel.
  const [thinking, setThinking] = useState(false);
  // On low-tier devices (or after a memory downgrade) skip the hero WebGL point
  // cloud and fall back to the lightweight CSS proof core — same story, a
  // fraction of the GPU/memory cost.
  const heavyOk = useHeavyOk();
  useEffect(() => {
    const onTyping = (e: Event) => setThinking(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener("agent-typing-change", onTyping);
    return () => window.removeEventListener("agent-typing-change", onTyping);
  }, []);
  const { ask, tour, tourRunning } = useConcierge();
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  // #4 — on touch devices, drop the scroll-linked parallax (y / scale) so the
  // hero rides the compositor instead of fighting native scroll. The opacity
  // fade is cheap and stays. Gated by the master switch.
  const coarse = useMediaQuery("(pointer: coarse)");
  const lite = MOBILE_TUNING && coarse;
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -115]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const coreScale = useTransform(scrollYProgress, [0, 1], [1, 0.65]);
  const contentStyle = reduced ? undefined : lite ? { opacity } : { y, opacity };
  const objectStyle = reduced ? undefined : lite ? undefined : { scale: coreScale };
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value < .36 ? 0 : value < .7 ? 1 : 2;
    setScrollStep((current) => current === next ? current : next);
  });

  const enter = (delay: number, offset = 20) => reduced ? {} : {
    initial: { opacity: 0, y: offset }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.85, delay, ease },
  };
  const goToWork = () => document.getElementById("section-work")?.scrollIntoView({ behavior: "smooth" });
  const proofStates = [
    { label: "CLAIM", title: "A confident answer is enough.", detail: "Most AI systems stop here. That is not trust — it is presentation." },
    { label: "EVIDENCE", title: "Every claim needs a source.", detail: "Quote matching and NLI checks attach each answer to evidence before it reaches a person." },
    { label: "VERDICT", title: "Fabrication fails the system.", detail: "Groundedness is evaluated in CI. If the proof breaks, the build does not ship." },
  ];
  const activeProof = variant === "a" ? proofStates[scrollStep] : proofStates[proofStep];
  const advanceProof = () => {
    if (variant === "a") window.scrollBy({ top: window.innerHeight * .28, behavior: "smooth" });
    else setProofStep((step) => (step + 1) % proofStates.length);
  };
  const interrogate = () => ask("Show me the evidence behind the portfolio's AI reliability claims. Link me to the strongest project breakdown.");
  const displayStep = variant === "a" ? scrollStep : proofStep;
  const evidence = {
    "001": { label: "ORCHESTRATE", title: "10 agents, one deployed ML system.", detail: "A LangGraph orchestration pipeline with sandboxed execution, self-repair, and 132 automated tests." },
    "002": { label: "VERIFY", title: "Claims are checked before they ship.", detail: "Quote matching, NLI validation, and CI-gated groundedness make fabricated citations a build failure." },
    "003": { label: "OPERATE", title: "The agent can act on the interface.", detail: "EMBER navigates, opens cases, and highlights skills—this portfolio is a working product, not a chat demo." },
  }[evidenceId];
  const openEvidence = () => window.dispatchEvent(new CustomEvent("stage:case", { detail: evidenceId }));

  return (
    <section ref={sectionRef} id="section-hero" className={`proof-hero ${variant === "b" ? "proof-hero--quiet" : ""}`}>
      <motion.div className="proof-hero__content" style={contentStyle}>
        <header className="proof-hero__meta">
          <motion.div
            {...enter(0.05, 8)}
            className="proof-hero__brand"
          >
            <Image
              src="/logo_no_name.png"
              alt="Sankalp Logo"
              width={120}
              height={52}
              priority
              className="proof-hero__logo"
              style={{ height: "auto" }}
            />
          </motion.div>
          <motion.span {...enter(0.13, 8)} className="proof-hero__status"><i /> OPEN TO BUILD</motion.span>
        </header>

        <div className="proof-hero__stage">
          <div className="proof-hero__copy">
            <motion.p {...enter(0.18)} className="proof-hero__eyebrow">THE PROOF ENGINE / 2026</motion.p>
            <motion.h1 {...enter(0.28, 34)}>
              AI THAT<br /><em>CAN PROVE</em><br />ITSELF.
            </motion.h1>
            <motion.p {...enter(0.46)} className="proof-hero__statement">
              I build the layer between a model&apos;s output and a decision you can defend — verified, evaluated, and cheap to run.
            </motion.p>
            <motion.div {...enter(0.56)} className="proof-hero__actions">
              <button onClick={goToWork} className="proof-hero__open">Open the proof <ArrowUpRight size={17} aria-hidden /></button>
              <button onClick={() => tour()} disabled={tourRunning} className="proof-hero__disturb"><Play size={15} aria-hidden /> {tourRunning ? "EMBER IS NARRATING" : "LET EMBER GUIDE YOU"}</button>
            </motion.div>
          </div>

          <motion.div className="proof-hero__object" style={objectStyle}>
            <div className="proof-hero__core">{variant === "a" && heavyOk ? <ProofField progress={scrollYProgress} activeId={evidenceId} onSelect={setEvidenceId} thinking={thinking} theme={theme} /> : <ProofCore pulse={proofStep === 0 ? 0 : proofStep * 0.52} theme={theme} />}</div>
            {/* {variant === "a" && <>
              <span className="proof-hero__annotation proof-hero__annotation--a">CLAIM</span>
              <span className="proof-hero__annotation proof-hero__annotation--b">EVIDENCE</span>
              <span className="proof-hero__annotation proof-hero__annotation--c">VERDICT</span>
            </>} */}
            {/* <button onClick={variant === "a" ? interrogate : advanceProof} className="proof-hero__core-control" aria-label={variant === "a" ? "Ask EMBER to show the evidence behind the AI claims" : "Advance the proof from claim to evidence to verdict"}>
              <MessageSquare size={13} aria-hidden /> {variant === "a" ? "ASK EMBER FOR EVIDENCE" : "TEST THE PROOF"}
            </button> */}
            {/* <AnimatePresence mode="wait">
              <motion.div
                key={activeProof.label}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease }}
                className="proof-hero__explain"
              >
                <span>{activeProof.label} / 0{displayStep + 1}</span>
                <strong>{activeProof.title}</strong>
                <p>{activeProof.detail}</p>
              </motion.div>
            </AnimatePresence> */}
            {variant === "a" && <motion.div key={evidenceId} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className="proof-hero__evidence">
              <span>{evidence.label} / SELECTED NODE</span><strong>{evidence.title}</strong><p>{evidence.detail}</p>
              <button onClick={openEvidence}>OPEN BREAKDOWN <ArrowUpRight size={11} aria-hidden /></button>
            </motion.div>}
          </motion.div>
        </div>

        {/* {variant === "a" && <motion.div {...enter(0.66)} className="proof-hero__proof">
          <div><span>01 / EXPERIENCE</span><strong><CountUp value={personal.stats[0].value} /></strong><p>years turning software into shipped outcomes</p></div>
          <div><span>02 / SYSTEMS</span><strong><CountUp value={personal.stats[1].value} /></strong><p>agents coordinated in one LangGraph pipeline</p></div>
          <div><span>03 / PRINCIPLE</span><strong>0</strong><p>fabricated citations accepted by design</p></div>
        </motion.div>} */}
      </motion.div>

      <button onClick={goToWork} className="proof-hero__scroll" aria-label="Scroll to selected work"><span>BEGIN</span><ArrowDown size={14} aria-hidden /></button>
      <div className="proof-hero__grain" aria-hidden />
    </section>
  );
}
