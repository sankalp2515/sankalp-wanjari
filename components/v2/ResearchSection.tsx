"use client";

// Research — published, peer-reviewed papers with direct PDF links.
// Renders nothing if the research array is empty (no placeholders, ever).

import { FileText, ArrowUpRight, BookOpen } from "lucide-react";
import { research } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import TiltCard from "./TiltCard";
import Reveal from "./Reveal";

export default function ResearchSection() {
  if (research.length === 0) return null;

  return (
    <SectionShell
      id="section-research"
      kicker="PUBLISHED RESEARCH"
      title="Peer-reviewed, not just deployed"
      subtitle="Two papers published in TIJER International Research Journal — both PDFs open directly, no paywall."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {research.map((paper, i) => (
          <Reveal key={paper.id} delay={i * 0.08} className="h-full">
            <TiltCard className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="flex items-center gap-1.5 text-[10.5px] font-mono mono-small px-2.5 py-1 rounded-full border"
                  style={{
                    color: "var(--os-accent-green)",
                    borderColor: "color-mix(in srgb, var(--os-accent-green) 35%, transparent)",
                    background: "color-mix(in srgb, var(--os-accent-green) 8%, transparent)",
                  }}
                >
                  <BookOpen size={10} aria-hidden /> {paper.status}
                </span>
                <span className="text-[11px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                  {paper.journal} · {paper.year}
                </span>
              </div>

              <h3 className="font-display font-bold text-[17.5px] leading-snug mb-3" style={{ color: "var(--os-text)" }}>
                {paper.title}
              </h3>
              <p className="text-[13px] leading-relaxed flex-1 mb-5" style={{ color: "var(--os-text-secondary)" }}>
                {paper.abstract}
              </p>

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {paper.tags.map((t) => (
                    <span key={t} className="text-[10.5px] font-mono px-2 py-0.5 rounded-md"
                      style={{ background: "var(--os-bg-surface)", color: "var(--os-text-muted)" }}>
                      {t}
                    </span>
                  ))}
                </div>
                <a
                  href={paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[12px] font-mono px-3 py-2 rounded-xl border shrink-0 transition-all hover:-translate-y-0.5"
                  style={{
                    borderColor: "color-mix(in srgb, var(--os-accent) 35%, transparent)",
                    color: "var(--os-accent)",
                    background: "color-mix(in srgb, var(--os-accent) 8%, transparent)",
                  }}
                >
                  <FileText size={12} aria-hidden /> Read PDF <ArrowUpRight size={10} aria-hidden />
                </a>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
