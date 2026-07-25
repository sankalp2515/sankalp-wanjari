"use client";

// Full-breath moments between the information-dense chapters. They turn a
// scrolling portfolio into a paced film: assertion → evidence → consequence.

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, useInView } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MOBILE_TUNING } from "@/config/mobileTuning";

export default function Interlude({
  index,
  kicker,
  lines,
  caption,
  tone = "warm",
}: {
  index: string;
  kicker: string;
  lines: [string, string];
  caption: string;
  tone?: "warm" | "cool" | "green";
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // #4 — drop scroll-linked parallax on touch; keep the opacity reveal.
  const coarse = useMediaQuery("(pointer: coarse)");
  const lite = MOBILE_TUNING && coarse;
  // One-shot: the oval ring draws itself in only when the section is reached
  // (not a continuous rAF loop like the hero).
  const inView = useInView(ref, { once: true, margin: "-20% 0px -20% 0px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [70, 0, -70]);
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 1.08]);

  return (
    <section ref={ref} className={`cinematic-interlude cinematic-interlude--${tone} ${inView ? "is-revealed" : ""}`} aria-label={kicker}>
      <motion.div className="cinematic-interlude__content" style={reduced ? undefined : lite ? { opacity } : { y, opacity, scale }}>
        <div className="cinematic-interlude__meta">
          <span>{index} / INTERLUDE</span>
          <span>{kicker}</span>
        </div>
        <div className="cinematic-interlude__words" aria-label={`${lines[0]} ${lines[1]}`}>
          <span>{lines[0]}</span>
          <strong>{lines[1]}</strong>
        </div>
        <p>{caption}</p>
        <div className="cinematic-interlude__axis" aria-hidden><i /><b /></div>
      </motion.div>
    </section>
  );
}
