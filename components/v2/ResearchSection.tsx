"use client";

// Research is presented as a ledger of receipts, not another card gallery.

import { FileText, ArrowUpRight, BookOpen } from "lucide-react";
import { research } from "@/config/portfolio";
import SectionShell from "./SectionShell";
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
      <div className="evidence-ledger">
        {research.map((paper, index) => (
          <Reveal key={paper.id} delay={index * 0.08}>
            <article className="evidence-ledger__entry">
              <div className="evidence-ledger__index"><span>0{index + 1}</span><small>{paper.year}</small></div>
              <div className="evidence-ledger__body">
                <div className="evidence-ledger__meta"><span><BookOpen size={10} aria-hidden /> {paper.status}</span><span>{paper.journal}</span></div>
                <h3>{paper.title}</h3>
                <p>{paper.abstract}</p>
                <footer>
                  <div>{paper.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer"><FileText size={12} aria-hidden /> Inspect paper <ArrowUpRight size={11} aria-hidden /></a>
                </footer>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
