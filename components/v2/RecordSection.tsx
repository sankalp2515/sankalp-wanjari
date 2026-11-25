"use client";

// RecordSection — the premium pass's replacement for four separate sections
// (Reliability, Research, Education, Skills). One compact screen, same facts.
// Only rendered when PREMIUM_PASS is on (config/premiumPass.ts).
//
// The old section ids live on as anchors inside it, so the agent's
// [NAV:research|education|skills|reliability], the footer links and the
// [HIGHLIGHT:skill] tool keep working unchanged.

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { education, research, skills } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import { RELIABILITY_EVIDENCE } from "./ReliabilityPreview";
import SectionShell from "./SectionShell";

const GROUPS = [
  { id: "AI/ML", label: "AI & agents" },
  { id: "Engineering", label: "Engineering" },
  { id: "Product", label: "Product" },
];

export default function RecordSection() {
  const { ask, setOpen } = useConcierge();
  const { degree, featuredCert } = education;

  // Agent tool: [HIGHLIGHT:SkillName] (same contract as SkillsSection).
  useEffect(() => {
    const onHighlight = (e: Event) => {
      const name = (e as CustomEvent<string>).detail?.toLowerCase();
      if (!name) return;
      const el = document.querySelector<HTMLElement>(`[data-skill="${CSS.escape(name)}"]`);
      if (!el) return;
      document.getElementById("section-skills")?.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("chip-highlight");
      void el.offsetWidth;
      el.classList.add("chip-highlight");
    };
    window.addEventListener("stage:highlight", onHighlight);
    return () => window.removeEventListener("stage:highlight", onHighlight);
  }, []);

  const askAbout = (name: string) => {
    setOpen(true);
    ask(`Where has Sankalp actually used ${name}? Give one concrete example from his work or projects.`);
  };

  return (
    <SectionShell id="section-record" layout="stack" kicker="The record" title="On paper.">
      <div className="record">
        <div id="section-reliability" className="record__rel">
          {RELIABILITY_EVIDENCE.map((e) => (
            <div key={e.project} className="record__relitem">
              <p className="record__value">{e.value}</p>
              <p className="record__claim"><strong>{e.project}</strong> {e.claim}</p>
              <p className="record__limit">Limit: {e.shortfall}</p>
            </div>
          ))}
          <Link href="/reliability" className="record__link">Methods &amp; limits <ArrowUpRight size={14} aria-hidden /></Link>
        </div>

        <div className="record__grid">
          <div id="section-education" className="record__col">
            <p className="ds-label">Education</p>
            <h3>{degree.title}</h3>
            <p>{degree.school} · {degree.highlights.join(" · ")}</p>
            <h3>{featuredCert.title}</h3>
            <p>{featuredCert.issuer} · {featuredCert.year}</p>
          </div>

          <div id="section-research" className="record__col">
            <p className="ds-label">Published research</p>
            {research.map((paper) => (
              <a key={paper.id} href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="record__paper">
                <h3>{paper.title}</h3>
                <p>{paper.journal} · {paper.year} <ArrowUpRight size={12} aria-hidden /></p>
              </a>
            ))}
          </div>

          <div id="section-skills" className="record__col">
            <p className="ds-label">Toolkit · ask Helios about any</p>
            {GROUPS.map((g) => (
              <div key={g.id} className="record__group">
                <p className="record__glabel">{g.label}</p>
                <div className="record__chips">
                  {skills.filter((s) => s.category === g.id).map((s) => (
                    <button key={s.name} type="button" data-skill={s.name.toLowerCase()} onClick={() => askAbout(s.name)}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
