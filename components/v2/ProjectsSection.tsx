"use client";

// Engineering projects — tilt cards in a responsive grid; click opens the
// two-level modal (overview → technical breakdown). These are built systems,
// deliberately NOT labelled case studies: product case studies are a separate
// section (CaseStudiesSection). All content is in the SSR markup; the modal
// is progressive detail.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Zap } from "lucide-react";
import { projects } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import ProjectModal from "./ProjectModal";
import ProjectMedia from "./ProjectMedia";
import TiltCard from "./TiltCard";
import { GithubIcon } from "@/components/ui/Icons";

const IMPACT_COLOR: Record<string, string> = {
  CRITICAL: "var(--os-accent-orange)",
  HIGH: "var(--os-accent-cyan)",
};

const FILTERS = ["All", ...new Set(projects.map((p) => p.category))];

export default function ProjectsSection({ variant = "a" }: { variant?: "a" | "b" }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [caseView, setCaseView] = useState(false);
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  // Agent tool: [CASE:001] opens a project breakdown directly
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
      kicker="ENGINEERING PROJECTS"
      title="Systems built to survive production"
      subtitle={`${projects.length} production-grade systems — each one end-to-end, with reliability, evaluation, and observability built in, not bolted on. Open any card for the architecture and the trade-offs behind it.`}
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

      <motion.div layout className={`project-grid ${variant === "b" ? "project-grid--film" : ""}`}>
        <AnimatePresence mode="popLayout">
        {shown.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
            transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className={`project-grid__item ${i === 0 ? "project-grid__item--featured" : ""}`}
          >
            {/* Variant A: cards catch a pointer-driven 3D tilt + sheen. Variant B stays flat. */}
            {(() => {
            const cardBtn = (
            <button className="project-grid__card" onClick={() => { setOpenId(p.id); setCaseView(false); }} aria-label={`Open the ${p.name} technical breakdown`}>
              <div className="project-grid__media"><ProjectMedia id={p.id} name={p.name} preview={p.preview} poster={p.poster} /><span className="project-grid__number">{String(i + 1).padStart(2, "0")}</span><span className="project-grid__year">PROJECT_{String(i + 1).padStart(3, "0")} / {p.year}</span></div>
              <div className="project-grid__content">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                  {p.category}
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

              <h3 className="font-display font-bold text-[clamp(1.35rem,2.3vw,2rem)] leading-[.95] mb-3" style={{ color: "var(--os-text)" }}>
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
                Technical breakdown <ArrowUpRight size={12} aria-hidden />
              </span>
              </div>
            </button>
            );
            return variant === "a" ? <TiltCard className="h-full">{cardBtn}</TiltCard> : cardBtn;
            })()}
            {/* Config-driven quick links — render only for fields that are set.
                Kept outside the card <button> so they're valid, standalone links. */}
            {variant === "a" && (p.github || p.liveUrl) && (
              <div className="project-grid__links">
                {p.github && (
                  <a href={p.github} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} aria-label={`${p.name} source on GitHub`} title="Source code">
                    <GithubIcon size={14} />
                  </a>
                )}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} aria-label={`${p.name} live demo`} title="Live demo">
                    <ArrowUpRight size={15} aria-hidden />
                  </a>
                )}
              </div>
            )}
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
