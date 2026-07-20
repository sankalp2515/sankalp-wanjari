"use client";

// Projects — tilt cards in a responsive grid; click opens the
// two-level modal (overview → case study). All content is in the
// SSR markup; the modal is progressive detail.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Zap } from "lucide-react";
import { projects } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import TiltCard from "./TiltCard";
import ProjectModal from "./ProjectModal";

const IMPACT_COLOR: Record<string, string> = {
  CRITICAL: "var(--os-accent-orange)",
  HIGH: "var(--os-accent-cyan)",
};

const FILTERS = ["All", ...new Set(projects.map((p) => p.category))];

export default function ProjectsSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [caseView, setCaseView] = useState(false);
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  // Agent tool: [CASE:001] opens a case study directly
  useEffect(() => {
    const onCase = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (projects.some((p) => p.id === id)) {
        setOpenId(id);
        setCaseView(true);
        document.getElementById("section-work")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    const onCaseClose = () => setOpenId(null);
    window.addEventListener("stage:case", onCase);
    window.addEventListener("stage:case-close", onCaseClose);
    return () => {
      window.removeEventListener("stage:case", onCase);
      window.removeEventListener("stage:case-close", onCaseClose);
    };
  }, []);

  return (
    <SectionShell
      id="section-work"
      kicker="SELECTED WORK"
      title="Systems built to survive production"
      subtitle="Three projects — each one an end-to-end system with reliability, evaluation, and observability built in, not bolted on."
    >
      {/* Category filters — mono chips, active gets the accent underline */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className="relative text-[11.5px] font-mono mono-small uppercase tracking-[0.12em] px-3.5 py-1.5 rounded-full border transition-all hover:-translate-y-0.5"
            style={
              filter === f
                ? {
                    borderColor: "color-mix(in srgb, var(--os-accent) 55%, transparent)",
                    color: "var(--os-accent)",
                    background: "color-mix(in srgb, var(--os-accent) 10%, transparent)",
                  }
                : {
                    borderColor: "var(--os-border)",
                    color: "var(--os-text-muted)",
                    background: "transparent",
                  }
            }
          >
            {f}
            {filter === f && (
              <motion.span
                layoutId="project-filter-dot"
                className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: "var(--os-accent)" }}
                aria-hidden
              />
            )}
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-5 md:grid-cols-3">
        <AnimatePresence mode="popLayout">
        {shown.map((p, i) => (
          // Editorial rhythm: the middle card sits lower — the asymmetry
          // reads as designed, not templated. Ghost numeral gives each
          // card a cinematic identity mark. motion wrapper (not Reveal)
          // so filter changes get layout + exit animations.
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
            transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full relative ${i === 1 ? "md:mt-10" : ""}`}
          >
            <span
              className="absolute -top-9 right-1 font-display font-bold select-none pointer-events-none leading-none"
              style={{
                fontSize: "clamp(56px, 6vw, 84px)",
                color: "color-mix(in srgb, var(--os-accent) 14%, transparent)",
                zIndex: 0,
              }}
              aria-hidden
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <TiltCard
              className="glass-card rounded-3xl p-6 flex flex-col text-left cursor-pointer overflow-hidden"
              onClick={() => { setOpenId(p.id); setCaseView(false); }}
            >
              {/* Meta row */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                  {String(i + 1).padStart(2, "0")} · {p.year}
                </span>
                <span
                  className="flex items-center gap-1 text-[10px] font-mono mono-small px-2 py-0.5 rounded-full border"
                  style={{
                    color: IMPACT_COLOR[p.impact] ?? "var(--os-text-muted)",
                    borderColor: `color-mix(in srgb, ${IMPACT_COLOR[p.impact] ?? "var(--os-border)"} 35%, transparent)`,
                  }}
                >
                  <Zap size={9} aria-hidden /> {p.impact}
                </span>
              </div>

              <h3 className="font-display font-bold text-[19px] leading-snug mb-2.5" style={{ color: "var(--os-text)" }}>
                {p.name}
              </h3>
              <p className="text-[13px] leading-relaxed flex-1" style={{ color: "var(--os-text-secondary)" }}>
                {p.description}
              </p>

              {/* Stack */}
              <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
                {p.stack.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="text-[10.5px] font-mono px-2 py-0.5 rounded-md"
                    style={{ background: "var(--os-bg-surface)", color: "var(--os-text-muted)" }}
                  >
                    {s}
                  </span>
                ))}
                {p.stack.length > 4 && (
                  <span className="text-[10.5px] font-mono px-1 py-0.5" style={{ color: "var(--os-text-muted)" }}>
                    +{p.stack.length - 4}
                  </span>
                )}
              </div>

              <span className="flex items-center gap-1 text-[12px] font-mono" style={{ color: "var(--os-accent)" }}>
                Open case study <ArrowUpRight size={12} aria-hidden />
              </span>
            </TiltCard>
          </motion.div>
        ))}
        </AnimatePresence>
      </motion.div>

      <ProjectModal
        projectId={openId}
        caseView={caseView}
        setCaseView={setCaseView}
        onClose={() => setOpenId(null)}
      />
    </SectionShell>
  );
}
