"use client";

// AboutScreen — the About text rewritten as the screening call a recruiter
// runs anyway (premium pass, config/premiumPass.ts: ABOUT_SCREEN). Five
// questions they ask in the first minute, each answered with a one-word verdict
// and the evidence behind it, with the logos of the organisations that can
// confirm it. As each answer scrolls in, its check draws and the counter
// ticks ("3 of 5 answered"), so the eye is pulled down the list. The original
// first-person bio stays one click away.
//
// Every answer restates config/portfolio.ts; nothing here is new copy about
// what Sankalp has done.

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { personal, experience, education } from "@/config/portfolio";
import LogoMark from "./LogoMark";

const fis = experience[0];

const QA: { q: string; verdict: string; a: string; orgs: string[] }[] = [
  {
    q: "Has he shipped to production?",
    verdict: "Yes.",
    a: `3 years at ${fis.company} building tools for U.S. and U.K. bank clients: a config-driven extraction framework across 50+ document layouts cut manual data entry by 90%.`,
    orgs: ["FIS Global"],
  },
  {
    q: "Can he lead people senior to him?",
    verdict: "Yes.",
    a: "Led a team of 6, including 4 senior leads, to build an LLM query optimizer that cut estimated SQL execution time by ~35% and was adopted into the team's workflow.",
    orgs: ["FIS Global"],
  },
  {
    q: "Product manager or engineer?",
    verdict: "Both.",
    a: `${education.degree.title} at ${education.degree.school} (CGPA 8.54), plus ${education.featuredCert.title} at BITSoM.`,
    orgs: ["IIIT Pune", "BITSoM"],
  },
  {
    q: "Has anyone outside judged the work?",
    verdict: "Three times.",
    a: "2nd nationally at the ET AI Hackathon (judged by The Economic Times and Accenture), 7th of 3,062 finalists at HackerRank, and Best in Track: AI Agents at SerpApi.",
    orgs: ["The Economic Times", "Accenture", "HackerRank", "SerpApi"],
  },
  {
    q: "When can he start, and where?",
    verdict: "Within 2 weeks.",
    a: `${personal.noticePeriod} notice · ${personal.location} · ${personal.workPreference}.`,
    orgs: [],
  },
];

function bioWords(paragraph: string, phrases: string[]) {
  const marks = new Array(paragraph.length).fill(false);
  for (const p of phrases) {
    const at = paragraph.indexOf(p);
    if (at >= 0) for (let i = at; i < at + p.length; i++) marks[i] = true;
  }
  const out: { w: string; key: boolean }[] = [];
  const re = /\S+/g;
  let mt: RegExpExecArray | null;
  while ((mt = re.exec(paragraph))) out.push({ w: mt[0], key: marks[mt.index] });
  return out;
}

export default function AboutScreen() {
  const list = useRef<HTMLOListElement>(null);
  const [seen, setSeen] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const items = list.current?.querySelectorAll<HTMLElement>("[data-i]");
    if (!items) return;
    const io = new IntersectionObserver((entries) => {
      const add: number[] = [];
      for (const e of entries) if (e.isIntersecting) { add.push(Number((e.target as HTMLElement).dataset.i)); io.unobserve(e.target); }
      if (add.length) setSeen((s) => { const n = new Set(s); add.forEach((i) => n.add(i)); return n; });
    }, { rootMargin: "0px 0px -22% 0px" });
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, []);

  const paragraphs = personal.bio.split(/\n\s*\n/);

  return (
    <div className="scr">
      <div className="scr__head">
        <p className="ds-label">The 30-second screen</p>
        <p className="scr__count" aria-live="polite">
          <span className="scr__num">{seen.size}</span> of {QA.length} answered
          <span className="scr__bar" aria-hidden><i style={{ transform: `scaleX(${seen.size / QA.length})` }} /></span>
        </p>
      </div>

      <ol ref={list} className="scr__list">
        {QA.map((it, i) => (
          <li key={it.q} data-i={i} className={`scr__item ${seen.has(i) ? "is-in" : ""}`}>
            <svg className="scr__check" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="10.5" />
              <path d="M7 12.4l3.2 3.2L17.2 8.6" />
            </svg>
            <div className="scr__body">
              <p className="scr__q">{it.q}</p>
              <p className="scr__a"><strong>{it.verdict}</strong> {it.a}</p>
              {it.orgs.length > 0 && (
                <p className="scr__orgs">
                  {it.orgs.map((o) => <span key={o} className="scr__org"><LogoMark name={o} size={16} /> {o}</span>)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <details className="scr__bio">
        <summary>In his own words <ChevronDown size={15} aria-hidden /></summary>
        {paragraphs.map((p, pi) => (
          <p key={pi} className="about3__para">
            {bioWords(p, personal.bioKeywords).map((t, i) => (
              <span key={i} className={t.key ? "about3__w about3__w--key" : "about3__w"}>{t.w} </span>
            ))}
          </p>
        ))}
      </details>
    </div>
  );
}
