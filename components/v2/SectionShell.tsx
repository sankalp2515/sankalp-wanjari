"use client";

import { ReactNode, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Reveal from "./Reveal";

// Consistent section chrome: an animated kicker rule, the title, and an
// optional subtitle. The whole header drifts up as it enters view, so
// each section "announces itself" rather than just fading in.
export default function SectionShell({
  id,
  kicker,
  title,
  subtitle,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.4"],
  });
  // Header parallax: rises a touch as the section scrolls into place
  const headerY = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <section id={id} className="relative max-w-5xl mx-auto px-5 py-20 sm:py-28">
      <div ref={ref} className="mb-10 sm:mb-14">
        <motion.div style={reduced ? undefined : { y: headerY }}>
          <Reveal>
            <div className="flex items-center gap-3 mb-3">
              {/* Animated accent rule that draws in */}
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="h-[2px] w-8 origin-left rounded-full"
                style={{ background: "linear-gradient(90deg, var(--os-accent), var(--os-accent-cyan))" }}
                aria-hidden
              />
              <div className="text-[11px] font-mono mono-small tracking-[0.2em]" style={{ color: "var(--os-accent)" }}>
                {kicker}
              </div>
            </div>
            <h2
              className="font-display font-bold tracking-tight leading-tight"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "var(--os-text)" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
                {subtitle}
              </p>
            )}
          </Reveal>
        </motion.div>
      </div>
      {children}
    </section>
  );
}
