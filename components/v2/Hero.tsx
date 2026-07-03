"use client";

// Hero — the name is the monument. Everything else supports it.
// Scroll-scrubbed: as you scroll away the whole hero recedes and
// fades (content is scrubbed by scroll position, not just revealed).

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef, useSyncExternalStore } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, MessageSquare, Briefcase, Play } from "lucide-react";
import { personal } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import CountUp from "./CountUp";

const ease = [0.22, 1, 0.36, 1] as const;

// The only three.js on the site — loaded lazily, desktop-pointer only
const NeuralField = dynamic(() => import("./NeuralField"), { ssr: false });

const emptySubscribe = () => () => {};
const wantsField = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Hero() {
  const { setOpen, tour, tourRunning } = useConcierge();
  const reduced = useReducedMotion();
  const showField = useSyncExternalStore(emptySubscribe, wantsField, () => false);
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-scrub: hero recedes as it leaves the viewport
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const fieldOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  // The photo dissolves FIRST — fades, blurs, and shrinks ahead of the
  // rest of the hero (the reference-site "dissolve" feel).
  const photoOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0]);
  const photoScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.7]);
  const photoBlur = useTransform(scrollYProgress, [0, 0.28], ["blur(0px)", "blur(10px)"]);

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease },
        };

  // First + last name for the monument; full legal name stays in metadata/eyebrow
  const displayName = `${personal.shortName} ${personal.name.split(" ").slice(-1)[0]}`;

  return (
    <section
      ref={sectionRef}
      id="section-hero"
      className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 pt-24 pb-16 text-center overflow-hidden"
    >
      {/* 3D neural field — reacts when the concierge thinks */}
      {showField && (
        <motion.div className="absolute inset-0" style={reduced ? undefined : { opacity: fieldOpacity }}>
          <NeuralField />
        </motion.div>
      )}

      {/* Content sits ABOVE the canvas layer — never let the field eat a click */}
      <motion.div
        className="relative z-[1] flex flex-col items-center"
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity, scale: contentScale }}
      >
        {/* Photo — dissolves ahead of the rest on scroll.
            Outer div owns the scroll dissolve; inner owns the entrance,
            so the two opacity animations never fight. */}
        <motion.div
          className="relative mb-5"
          style={reduced ? { width: 104, height: 104 } : { width: 104, height: 104, opacity: photoOpacity, scale: photoScale, filter: photoBlur }}
        >
        <motion.div {...fade(0)} className="absolute inset-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, var(--os-accent), var(--os-accent-cyan), var(--os-accent-green), var(--os-accent))",
              animation: reduced ? "none" : "slow-spin 14s linear infinite",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 rounded-full overflow-hidden" style={{ border: "5px solid var(--os-bg)" }}>
            <Image
              src={personal.profilePhoto}
              alt={`Portrait of ${personal.name}`}
              width={104}
              height={104}
              className="object-cover object-top w-full h-full"
              priority
            />
          </div>
          <span
            className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 pulse-dot"
            style={{ background: "var(--os-accent-green)", borderColor: "var(--os-bg)" }}
            aria-hidden
          />
        </motion.div>
        </motion.div>

        {/* Name + availability — strong secondary; the About section owns the full story */}
        <motion.div {...fade(0.06)} className="flex flex-wrap items-center justify-center gap-3 mb-5">
          <span
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "clamp(1.3rem, 3vw, 1.9rem)", color: "var(--os-text)" }}
          >
            {displayName}
          </span>
          <span
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-mono mono-small"
            style={{
              borderColor: "color-mix(in srgb, var(--os-accent-green) 40%, transparent)",
              color: "var(--os-accent-green)",
              background: "color-mix(in srgb, var(--os-accent-green) 10%, transparent)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--os-accent-green)" }} />
            {personal.availability}
          </span>
        </motion.div>

        {/* THE PRODUCT STATEMENT — what he does is the hero */}
        <motion.h1
          {...fade(0.12)}
          className="font-display font-bold tracking-tight leading-[1.02] max-w-4xl"
          style={{ fontSize: "clamp(2.4rem, 6.5vw, 4.6rem)", color: "var(--os-text)" }}
        >
          I build AI products —<br />
          <span className="text-shimmer">from model to market.</span>
        </motion.h1>

        {/* Role line */}
        <motion.p
          {...fade(0.18)}
          className="mt-4 font-display font-semibold tracking-tight"
          style={{ fontSize: "clamp(1rem, 2.2vw, 1.35rem)", color: "var(--os-accent)" }}
        >
          {personal.roles.join("  ·  ")}
        </motion.p>

        {/* Context line */}
        <motion.p
          {...fade(0.24)}
          className="mt-4 max-w-xl text-[15px] leading-relaxed"
          style={{ color: "var(--os-text-secondary)" }}
        >
          3 years shipping software at FIS Global, now specialised in agentic AI,
          RAG, and LLM systems.
        </motion.p>

        {/* Proof strip — numbers count up on first view */}
        <motion.div {...fade(0.3)} className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-2xl">
          {personal.stats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl py-3.5 px-2">
              <div className="font-display font-bold text-[24px] leading-none mb-1" style={{ color: "var(--os-accent)" }}>
                <CountUp value={s.value} />
              </div>
              <div className="text-[10.5px] font-mono leading-snug px-1" style={{ color: "var(--os-text-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div {...fade(0.36)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => document.getElementById("section-work")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-2 text-[14px] font-semibold px-6 py-3 rounded-2xl transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "#fff" }}
          >
            <Briefcase size={15} aria-hidden />
            See the work
          </button>
          <button
            onClick={() => {
              setOpen(true);
              setTimeout(() => window.dispatchEvent(new CustomEvent("concierge-focus-input")), 80);
            }}
            className="flex items-center gap-2 text-[14px] font-medium px-6 py-3 rounded-2xl border transition-all hover:-translate-y-0.5 active:scale-95"
            style={{
              borderColor: "color-mix(in srgb, var(--os-accent) 35%, var(--os-border))",
              color: "var(--os-text)",
              background: "color-mix(in srgb, var(--os-bg-surface) 70%, transparent)",
            }}
          >
            <MessageSquare size={15} aria-hidden style={{ color: "var(--os-accent)" }} />
            Ask my AI concierge
          </button>
        </motion.div>

        {/* The showpiece: the agent drives the page itself */}
        <motion.button
          {...fade(0.42)}
          onClick={() => tour()}
          disabled={tourRunning}
          className="mt-4 flex items-center gap-2 text-[12.5px] font-mono px-4 py-2 rounded-full border transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{
            borderColor: "color-mix(in srgb, var(--os-accent-cyan) 40%, transparent)",
            color: "var(--os-accent-cyan)",
            background: "color-mix(in srgb, var(--os-accent-cyan) 8%, transparent)",
          }}
        >
          <Play size={11} aria-hidden />
          {tourRunning ? "The AI is driving…" : "Watch the AI drive this site — 45s tour"}
        </motion.button>

        <motion.p {...fade(0.48)} className="mt-3 text-[12px] font-mono" style={{ color: "var(--os-text-muted)" }}>
          Tip: paste a job description into the concierge for an honest fit check.
        </motion.p>
      </motion.div>

      {/* Scroll cue */}
      <motion.button
        {...fade(0.6)}
        onClick={() => document.getElementById("section-work")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1] flex flex-col items-center gap-1 text-[11.5px] font-mono"
        style={{ color: "var(--os-text-muted)" }}
        aria-label="Scroll to projects"
      >
        scroll
        <ArrowDown size={14} className={reduced ? "" : "animate-float"} aria-hidden />
      </motion.button>
    </section>
  );
}
