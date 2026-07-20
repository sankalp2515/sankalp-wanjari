"use client";

// Skills — interactive, AI-first: click any chip and the concierge
// explains where Sankalp actually used it. The section stops being a
// word cloud and becomes an index into the evidence.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { skills } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import SectionShell from "./SectionShell";
import Reveal from "./Reveal";

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
  const [selected, setSelected] = useState(CATEGORIES[0].id);
  const active = CATEGORIES.find((category) => category.id === selected) ?? CATEGORIES[0];

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
      <Reveal>
        <div className="capability-console">
          <div className="capability-console__nav" role="tablist" aria-label="Capability disciplines">
            {CATEGORIES.map((category, index) => (
              <button
                key={category.id}
                role="tab"
                aria-selected={selected === category.id}
                onClick={() => setSelected(category.id)}
                className={selected === category.id ? "is-active" : ""}
                style={{ "--capability-color": category.color } as React.CSSProperties}
              >
                <span>0{index + 1}</span><strong>{category.label}</strong><i />
              </button>
            ))}
          </div>
          <div className="capability-console__field" style={{ "--capability-color": active.color } as React.CSSProperties}>
            <motion.div key={active.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <span className="capability-console__readout">ACTIVE FIELD / {active.id.toUpperCase()}</span>
              <h3>{active.label}</h3>
              <p>{active.proof}</p>
              <div className="capability-console__skills">
                {skills.filter((skill) => skill.category === active.id).map((skill, index) => (
                  <button key={skill.name} data-skill={skill.name.toLowerCase()} onClick={() => askAbout(skill.name)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>{skill.name}<Sparkles size={10} aria-hidden />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </Reveal>

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
