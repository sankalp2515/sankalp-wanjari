"use client";

// Seven seconds: a clear provocation, one tactile object, and proof.
// Everything else waits until the visitor decides to keep going.

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Play, RotateCcw } from "lucide-react";
import { personal } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import CountUp from "./CountUp";

const ProofCore = dynamic(() => import("./ProofCore"), { ssr: false });
const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero({ variant = "a" }: { variant?: "a" | "b" }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [proofStep, setProofStep] = useState(0);
  const { tour, tourRunning } = useConcierge();
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -115]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const coreScale = useTransform(scrollYProgress, [0, 1], [1, 0.65]);

  const enter = (delay: number, offset = 20) => reduced ? {} : {
    initial: { opacity: 0, y: offset }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.85, delay, ease },
  };
  const goToWork = () => document.getElementById("section-work")?.scrollIntoView({ behavior: "smooth" });
  const proofStates = [
    { label: "CLAIM", title: "A confident answer is enough.", detail: "Most AI systems stop here. That is not trust — it is presentation." },
    { label: "EVIDENCE", title: "Every claim needs a source.", detail: "Quote matching and NLI checks attach each answer to evidence before it reaches a person." },
    { label: "VERDICT", title: "Fabrication fails the system.", detail: "Groundedness is evaluated in CI. If the proof breaks, the build does not ship." },
  ];
  const advanceProof = () => setProofStep((step) => (step + 1) % proofStates.length);
  const activeProof = proofStates[proofStep];

  return (
    <section ref={sectionRef} id="section-hero" className={`proof-hero ${variant === "b" ? "proof-hero--quiet" : ""}`}>
      <motion.div className="proof-hero__content" style={reduced ? undefined : { y, opacity }}>
        <header className="proof-hero__meta">
          <motion.span {...enter(0.05, 8)}>SANKALP WANJARI / AI SYSTEMS</motion.span>
          <motion.span {...enter(0.13, 8)} className="proof-hero__status"><i /> OPEN TO BUILD</motion.span>
        </header>

        <div className="proof-hero__stage">
          <div className="proof-hero__copy">
            <motion.p {...enter(0.18)} className="proof-hero__eyebrow">THE PROOF ENGINE / 2026</motion.p>
            <motion.h1 {...enter(0.28, 34)}>
              AI THAT<br /><em>CAN PROVE</em><br />ITSELF.
            </motion.h1>
            <motion.p {...enter(0.46)} className="proof-hero__statement">
              I design the systems between a model&apos;s promise and a decision people can actually trust.
            </motion.p>
            <motion.div {...enter(0.56)} className="proof-hero__actions">
              <button onClick={goToWork} className="proof-hero__open">Open the proof <ArrowUpRight size={17} aria-hidden /></button>
              <button onClick={() => tour()} disabled={tourRunning} className="proof-hero__disturb"><Play size={15} aria-hidden /> {tourRunning ? "EMBER IS NARRATING" : "LET EMBER GUIDE YOU"}</button>
            </motion.div>
          </div>

          <motion.div className="proof-hero__object" style={reduced ? undefined : { scale: coreScale }}>
            <div className="proof-hero__core"><ProofCore pulse={proofStep === 0 ? 0 : proofStep * 0.52} /></div>
            {variant === "a" && <>
              <span className="proof-hero__annotation proof-hero__annotation--a">CLAIM</span>
              <span className="proof-hero__annotation proof-hero__annotation--b">EVIDENCE</span>
              <span className="proof-hero__annotation proof-hero__annotation--c">VERDICT</span>
            </>}
            <button onClick={advanceProof} className="proof-hero__core-control" aria-label="Advance the proof from claim to evidence to verdict">
              <RotateCcw size={13} aria-hidden /> TEST THE PROOF
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProof.label}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.28, ease }}
                className="proof-hero__explain"
              >
                <span>{activeProof.label} / 0{proofStep + 1}</span>
                <strong>{activeProof.title}</strong>
                <p>{activeProof.detail}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {variant === "a" && <motion.div {...enter(0.66)} className="proof-hero__proof">
          <div><span>01 / EXPERIENCE</span><strong><CountUp value={personal.stats[0].value} /></strong><p>years turning software into shipped outcomes</p></div>
          <div><span>02 / SYSTEMS</span><strong><CountUp value={personal.stats[1].value} /></strong><p>agents coordinated in one LangGraph pipeline</p></div>
          <div><span>03 / PRINCIPLE</span><strong>0</strong><p>fabricated citations accepted by design</p></div>
        </motion.div>}
      </motion.div>

      <button onClick={goToWork} className="proof-hero__scroll" aria-label="Scroll to selected work"><span>BEGIN</span><ArrowDown size={14} aria-hidden /></button>
      <div className="proof-hero__grain" aria-hidden />
    </section>
  );
}
