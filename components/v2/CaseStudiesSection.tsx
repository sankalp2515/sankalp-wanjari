"use client";

// Product case studies — the PM half of the portfolio, kept deliberately
// separate from the engineering projects above.
//
//   Projects     = systems Sankalp built      → "Technical breakdown"
//   Case studies = product thinking he applied → "Read case study"
//
// Nothing here is placeholder content: the whole section (and its nav entry)
// stays out of the DOM until `caseStudies` in config/portfolio.ts has real
// entries. Add one there and this appears automatically.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X, Target, Users, FlaskConical, Scale, Gauge, Rocket } from "lucide-react";
import { caseStudies, type CaseStudy } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import Metric from "./Metric";
import DiagramGallery from "./DiagramGallery";
import { CASES_SPREAD } from "@/config/premiumPass";

const firstSentence = (t: string) => {
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).trim();
};

// The decision path: six beats of a case, each a real sentence from it.
const PATH = [
  ["Context", (c: CaseStudy) => c.study.context],
  ["Problem", (c: CaseStudy) => c.study.problem],
  ["Users", (c: CaseStudy) => c.study.users],
  ["The bet", (c: CaseStudy) => c.study.hypothesis],
  ["The call", (c: CaseStudy) => c.study.decisions[0] ?? ""],
  ["Measured by", (c: CaseStudy) => c.study.metrics[0] ?? ""],
] as const;

// CASES_SPREAD (config/premiumPass.ts): one editorial spread per case. A cover
// (the case's own image, or its headline number set large), then the story
// as a clickable decision path, so a reader gets the argument before opening.
function CaseSpread({ c, i, onOpen }: { c: CaseStudy; i: number; onOpen: () => void }) {
  const [step, setStep] = useState(0);
  const text = firstSentence(PATH[step][1](c));
  return (
    <li className={`csx__item ${i % 2 ? "csx__item--flip" : ""}`}>
      <div className="csx__visual" onClick={onOpen} aria-hidden>
        {c.cover ? (
          <Image src={c.cover} alt="" fill sizes="(max-width: 900px) 100vw, 560px" className="csx__img" />
        ) : (
          <span className="csx__type" aria-hidden>
            <span className="csx__typeval">{c.stat?.value ?? String(i + 1).padStart(2, "0")}</span>
            {c.stat && <span className="csx__typelabel">{c.stat.label}</span>}
          </span>
        )}
        <span className="csx__no" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
      </div>

      <div className="csx__text">
        <p className="csx__meta"><span className="ds-label">Case {String(i + 1).padStart(2, "0")}</span>{c.company ? `${c.company} · ` : ""}{c.year}</p>
        <h3 className="csx__title">{c.title}</h3>
        {c.stat && c.cover && <p className="csx__stat"><span><Metric value={c.stat.value} /></span>{c.stat.label}</p>}
        <p className="csx__summary">{c.summary}</p>

        <div className="csx__path">
          <div className="csx__steps" role="tablist" aria-label={`${c.title}: decision path`}>
            {PATH.map(([label], k) => (
              <button key={label} type="button" role="tab" aria-selected={k === step} className="csx__step" onClick={() => setStep(k)}>
                <i aria-hidden />{label}
              </button>
            ))}
          </div>
          <p className="csx__beat" role="tabpanel" key={step}>{text}</p>
        </div>

        <div className="csx__actions">
          <button type="button" className="ds-btn ds-btn--primary" onClick={onOpen}>Read the case <ArrowUpRight size={15} aria-hidden /></button>
          {c.externalUrl && (
            <a className="ds-btn ds-btn--ghost" href={c.externalUrl} target="_blank" rel="noopener noreferrer">
              {/notion\./.test(c.externalUrl) ? "Notion write-up" : "Full write-up"} <ArrowUpRight size={15} aria-hidden />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

// Hide the image (and its wrapper) if the file 404s, so a missing/misnamed
// cover degrades to the text-only card instead of a broken-image icon.
const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.currentTarget.closest("[data-cover]") as HTMLElement | null)?.style.setProperty("display", "none");
};

export function hasCaseStudies() {
  return caseStudies.length > 0;
}

const SECTIONS = [
  { key: "context", label: "CONTEXT", icon: Target },
  { key: "problem", label: "PROBLEM FRAMING", icon: Target },
  { key: "users", label: "USERS & RESEARCH", icon: Users },
  { key: "hypothesis", label: "HYPOTHESIS", icon: FlaskConical },
] as const;

function StudyModal({ study, onClose }: { study: CaseStudy; onClose: () => void }) {
  // Portal to <body> so no transformed ancestor traps the overlay under the nav.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, []);
  const overlay = (
    <m.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "color-mix(in srgb, var(--os-bg) 72%, transparent)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <m.div
        role="dialog" aria-modal="true" aria-label={`${study.title} — product case study`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] rounded-3xl border overflow-hidden flex flex-col"
        style={{ background: "var(--os-bg-window)", borderColor: "var(--os-border)", boxShadow: "var(--os-shadow-accent)" }}
      >
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-4 border-b shrink-0" style={{ borderColor: "var(--os-border-subtle)" }}>
          <div className="min-w-0">
            <div className="text-[11px] font-mono mb-1.5" style={{ color: "var(--os-text-muted)" }}>
              {study.year} · {study.company} · PRODUCT CASE STUDY
            </div>
            <h3 className="font-display font-bold text-[24px] leading-tight truncate" style={{ color: "var(--os-text)" }}>{study.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="grid place-items-center w-9 h-9 rounded-xl shrink-0 transition-colors hover:bg-[var(--os-bg-hover)]"
            style={{ background: "var(--os-bg-surface)", color: "var(--os-text-muted)" }}>
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-7">
          {study.cover && (
            <div data-cover className="-mx-6 sm:-mx-8 -mt-6 mb-1 border-b" style={{ borderColor: "var(--os-border-subtle)" }}>
              <img src={study.cover} alt={`${study.title} cover`} loading="lazy" decoding="async"
                onError={hideOnError} className="w-full max-h-[280px] object-cover" />
            </div>
          )}

          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <div className="flex items-center gap-1.5 text-[11px] font-mono mono-small tracking-widest mb-2.5" style={{ color: "var(--os-accent)" }}>
                <Icon size={12} aria-hidden /> {label}
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>{study.study[key]}</p>
            </div>
          ))}

          {/* User-flow / journey diagrams, after the framing and before the calls. */}
          <DiagramGallery label="USER FLOW" diagrams={study.study.flows} />

          {([["DECISIONS & TRADE-OFFS", Scale, study.study.decisions], ["SUCCESS METRICS", Gauge, study.study.metrics]] as const).map(([label, Icon, items]) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 text-[11px] font-mono mono-small tracking-widest mb-2.5" style={{ color: "var(--os-accent)" }}>
                <Icon size={12} aria-hidden /> {label}
              </div>
              <ul className="space-y-2.5">
                {items.map((it) => (
                  <li key={it} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: "var(--os-text-secondary)" }}>
                    <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: "var(--os-accent-green)" }} aria-hidden />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {study.study.gtm && (
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono mono-small tracking-widest mb-2.5" style={{ color: "var(--os-accent)" }}>
                <Rocket size={12} aria-hidden /> GO-TO-MARKET
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>{study.study.gtm}</p>
            </div>
          )}

          <div>
            <div className="text-[11px] font-mono mono-small tracking-widest mb-2.5" style={{ color: "var(--os-accent)" }}>OUTCOME</div>
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>{study.study.outcome}</p>
          </div>
        </div>

        {study.externalUrl && (
          <div className="px-6 sm:px-8 py-4 border-t shrink-0" style={{ borderColor: "var(--os-border-subtle)" }}>
            <a href={study.externalUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-mono px-3 py-2 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)" }}>
              <ArrowUpRight size={13} aria-hidden /> Full write-up
            </a>
            <a href={study.liveUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-mono px-3 py-2 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)", marginLeft: "0.75rem" }}>
              <ArrowUpRight size={13} aria-hidden /> Product link
            </a>
          </div>
        )}
  
      </m.div>
    </m.div>
  );

  return mounted ? createPortal(overlay, document.body) : null;
}

export default function CaseStudiesSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  if (caseStudies.length === 0) return null; // nothing real to show yet

  const open = caseStudies.find((c) => c.id === openId) ?? null;

  return (
    <SectionShell layout={CASES_SPREAD ? "stack" : "split-reverse"} index="03"
      id="section-cases"
      kicker="Product case studies"
      title="How the product decisions get made."
      subtitle="Product thinking, separate from the engineering: user research, problem framing, prioritisation, trade-offs, and the metrics each bet is judged on."
    >
      {CASES_SPREAD ? (
        <ol className="csx">
          {caseStudies.map((c, i) => <CaseSpread key={c.id} c={c} i={i} onOpen={() => setOpenId(c.id)} />)}
        </ol>
      ) : <ul className="cs3">
        {caseStudies.map((c, i) => (
          <li key={c.id} className="cs3__item">
            <button type="button" onClick={() => setOpenId(c.id)} aria-label={`Read the ${c.title} case study`} className="cs3__card">
              <span className="cs3__top">
                <span className="ds-label">Case {String(i + 1).padStart(2, "0")}</span>
                <span className="cs3__meta">{c.company ? `${c.company} · ` : ""}{c.year}</span>
              </span>
              {c.stat && (
                <span className="cs3__stat">
                  <span className="cs3__value"><Metric value={c.stat.value} /></span>
                  <span className="cs3__statlabel">{c.stat.label}</span>
                </span>
              )}
              <span className="cs3__title">{c.title}</span>
              <span className="cs3__summary">{c.summary}</span>
              <span className="cs3__tags">{c.tags.slice(0, 4).join(" · ")}</span>
              <span className="cs3__cta">Read the case <ArrowUpRight size={15} aria-hidden /></span>
            </button>
            {c.externalUrl && (
              <a className="cs3__ext" href={c.externalUrl} target="_blank" rel="noopener noreferrer">
                {/notion\./.test(c.externalUrl) ? "Full write-up on Notion" : "Full write-up"} <ArrowUpRight size={13} aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>}

      <AnimatePresence>
        {open && <StudyModal key={open.id} study={open} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </SectionShell>
  );
}
