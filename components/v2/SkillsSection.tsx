"use client";

// Skills — interactive, AI-first: click any chip and the concierge
// explains where Sankalp actually used it. The section stops being a
// word cloud and becomes an index into the evidence.

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { skills } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import SectionShell from "./SectionShell";
import Reveal from "./Reveal";
import TiltCard from "./TiltCard";

const CATEGORIES = [
  {
    id: "AI/ML", label: "AI / ML & Agents", color: "var(--os-accent)",
    proof: "10-agent pipelines, hybrid RAG, CI-gated evals",
  },
  {
    id: "Engineering", label: "Engineering & MLOps", color: "var(--os-accent-cyan)",
    proof: "FastAPI services, Docker deploys, Postgres + Qdrant",
  },
  {
    id: "Product", label: "Product", color: "var(--os-accent-green)",
    proof: "BITSoM-certified AI product management",
  },
];

export default function SkillsSection() {
  const { ask, setOpen } = useConcierge();

  // Agent tool: [HIGHLIGHT:SkillName]
  useEffect(() => {
    const onHighlight = (e: Event) => {
      const name = (e as CustomEvent<string>).detail?.toLowerCase();
      if (!name) return;
      const el = document.querySelector<HTMLElement>(`[data-skill="${CSS.escape(name)}"]`);
      if (el) {
        document.getElementById("section-skills")?.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.remove("chip-highlight");
        void el.offsetWidth; // restart the animation
        el.classList.add("chip-highlight");
      }
    };
    window.addEventListener("stage:highlight", onHighlight);
    return () => window.removeEventListener("stage:highlight", onHighlight);
  }, []);

  const askAbout = (name: string) => {
    setOpen(true);
    ask(`Where has Sankalp actually used ${name}? Give one concrete example from his work or projects.`);
  };

  return (
    <SectionShell
      id="section-skills"
      kicker="CAPABILITIES"
      title="Three disciplines, one system"
      subtitle="Don't take the chips at face value — click any skill and the AI concierge tells you exactly where it was used."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {CATEGORIES.map((cat, i) => (
          <Reveal key={cat.id} delay={i * 0.08} className="h-full">
            <TiltCard className="glass-card rounded-3xl overflow-hidden h-full flex flex-col">
              {/* Gradient signature bar */}
              <div className="h-1 w-full shrink-0"
                style={{ background: `linear-gradient(90deg, ${cat.color}, transparent)` }} aria-hidden />
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} aria-hidden />
                  <h3 className="text-[13px] font-mono mono-small tracking-wider" style={{ color: "var(--os-text)" }}>
                    {cat.label}
                  </h3>
                </div>
                <p className="text-[11.5px] font-mono mb-5" style={{ color: "var(--os-text-muted)" }}>
                  {cat.proof}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills
                    .filter((s) => s.category === cat.id)
                    .map((s, j) => (
                      // Chips cascade in one by one — the section assembles
                      // itself like the field does
                      <motion.button
                        key={s.name}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.4, delay: 0.15 + j * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        data-skill={s.name.toLowerCase()}
                        onClick={() => askAbout(s.name)}
                        aria-label={`Ask the AI where Sankalp used ${s.name}`}
                        className="group flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-xl border transition-all hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95"
                        style={
                          s.core
                            ? {
                                borderColor: `color-mix(in srgb, ${cat.color} 45%, transparent)`,
                                color: cat.color,
                                background: `color-mix(in srgb, ${cat.color} 9%, transparent)`,
                                fontWeight: 600,
                              }
                            : {
                                borderColor: "var(--os-border)",
                                color: "var(--os-text-secondary)",
                                background: "color-mix(in srgb, var(--os-bg-surface) 60%, transparent)",
                              }
                        }
                      >
                        {s.name}
                        <Sparkles
                          size={9}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: cat.color }}
                          aria-hidden
                        />
                      </motion.button>
                    ))}
                </div>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <p className="mt-6 text-center text-[12px] font-mono flex items-center justify-center gap-1.5"
          style={{ color: "var(--os-text-muted)" }}>
          <Sparkles size={11} style={{ color: "var(--os-accent)" }} aria-hidden />
          Click any skill — the AI answers with a concrete example, not an adjective.
        </p>
      </Reveal>
    </SectionShell>
  );
}
