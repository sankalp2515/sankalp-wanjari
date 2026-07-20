"use client";

import dynamic from "next/dynamic";
import { ArrowDownRight, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useConcierge } from "@/contexts/ConciergeContext";

const ProofCore = dynamic(() => import("./ProofCore"), { ssr: false });

export default function FilmHero() {
  const reduced = useReducedMotion();
  const { tour, tourRunning } = useConcierge();
  const enter = (delay: number) => reduced ? {} : {
    initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
  const begin = () => document.getElementById("section-work")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="section-hero" className="film-hero">
      <div className="film-hero__grid" aria-hidden />
      <motion.p {...enter(0.08)} className="film-hero__edition">SANKALP WANJARI — SELECTED SYSTEMS / 2026</motion.p>
      <motion.div {...enter(0.18)} className="film-hero__title">
        <span>MAKE AI</span>
        <strong>ANSWER</strong>
        <span>FOR ITSELF.</span>
      </motion.div>
      <motion.p {...enter(0.38)} className="film-hero__manifesto">
        I build production AI where every confident answer has to earn the right to exist.
      </motion.p>
      <motion.div {...enter(0.46)} className="film-hero__actions">
        <button onClick={begin} className="film-hero__primary">Enter the case files <ArrowDownRight size={17} aria-hidden /></button>
        <button onClick={() => tour()} disabled={tourRunning} className="film-hero__tour"><Play size={13} aria-hidden /> {tourRunning ? "EMBER IS GUIDING" : "Let EMBER narrate"}</button>
      </motion.div>
      <div className="film-hero__object" aria-label="Interactive proof core">
        <ProofCore pulse={0.18} />
        <span className="film-hero__object-label">[ INTERACTIVE / MOVE YOUR POINTER ]</span>
      </div>
      <div className="film-hero__footer"><span>01 — A PORTFOLIO IN PROOF</span><button onClick={begin}>SCROLL TO BEGIN ↓</button></div>
    </section>
  );
}
