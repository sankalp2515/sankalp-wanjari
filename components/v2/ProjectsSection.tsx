"use client";

// Work. The three flagship builds play as a pinned decision film
// (Problem → Decision → Trade-off → Outcome). Every other build sits on a
// "decision wall": poster cards whose BACK is the decision, not more pixels.
//
//   front  poster key art · name · the one proof number
//   back   the problem · the call made · the proof · what it taught
//
// Built for how reviewers read (about a minute per application, ten seconds on
// a first screen): the front is the 10-second scan, the back is the
// 30-second judgement, and "Full breakdown" opens the two-level ProjectModal.
// A "What are you hiring for?" lens filters the wall by the product map's own
// problem domains. Cards flip on hover/focus with a fine pointer, and with the
// explicit "See the decision" button everywhere (touch, keyboard, reduced
// motion swaps the 3D turn for a cross-fade).

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { projects, flagshipIds, mapTerritories, projectProof, hiddenFromIndex } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import DecisionFilm from "./DecisionFilm";
import { GithubIcon } from "@/components/ui/Icons";

const ProjectModal = dynamic(() => import("./ProjectModal"), { ssr: false });

const FLAGSHIP = flagshipIds;
const REST = projects.filter((p) => !flagshipIds.includes(p.id) && !hiddenFromIndex.includes(p.id));
// Lenses = the product map's territories, limited to ones with work on the wall.
const LENSES = mapTerritories
  .map((t) => ({ id: t.id, name: t.name, ids: t.projects.map((x) => x.id).filter((id) => REST.some((p) => p.id === id)) }))
  .filter((l) => l.ids.length > 0);

// First sentence only: the back of a card is a 30-second read.
const firstSentence = (t: string) => {
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).trim();
};

export default function ProjectsSection(_props: { variant?: "a" | "b" } = {}) {
  void _props;
  const [openId, setOpenId] = useState<string | null>(null);
  const [caseView, setCaseView] = useState(false);
  const [detailReady, setDetailReady] = useState(false);
  const [lens, setLens] = useState<string>("all");
  const [flipped, setFlipped] = useState<string | null>(null);
  const lensIds = LENSES.find((l) => l.id === lens)?.ids;
  const cards = lensIds ? REST.filter((p) => lensIds.includes(p.id)) : REST;

  const open = (id: string) => { setDetailReady(true); setOpenId(id); setCaseView(true); };

  // Agent tool: [CASE:001] opens a project breakdown directly.
  useEffect(() => {
    const onCase = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (projects.some((p) => p.id === id)) {
        setDetailReady(true);
        setOpenId(id);
        setCaseView(true);
        document.getElementById("section-work")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      index="02"
      layout="stack"
      kicker="Selected work"
      title="Three systems, told as the decisions behind them."
      subtitle="Scroll each one: the problem, the call I made, what it cost, and what it measured. Below, every other build carries its decision on the back of the card."
    >
      <DecisionFilm ids={FLAGSHIP} onOpen={(id) => { setDetailReady(true); setOpenId(id); setCaseView(false); }} />

      <div className="pwall" onPointerEnter={() => setDetailReady(true)}>
        <div className="pindex__head">
          <div>
            <p className="ds-label pindex__title">The decision wall · {cards.length} builds</p>
            <p className="pwall__hint">Turn a card to read the call behind it.</p>
          </div>
          <div className="pindex__lenses" role="group" aria-label="What are you hiring for?">
            <span className="pindex__lens-q">What are you hiring for?</span>
            {[{ id: "all", name: "Everything" }, ...LENSES].map((l) => (
              <button key={l.id} type="button" className="pindex__lens" aria-pressed={lens === l.id} onClick={() => { setLens(l.id); setFlipped(null); }}>
                {l.name}
              </button>
            ))}
          </div>
        </div>

        <ul className="pwall__grid" key={lens}>
          {cards.map((p, i) => {
            const isFlipped = flipped === p.id;
            const proof = projectProof[p.id];
            return (
              <li key={p.id} className={`pcard${isFlipped ? " is-flipped" : ""}`} style={{ ["--i" as string]: i }}>
                <div className="pcard__inner">
                  {/* FRONT: the 10-second scan */}
                  <article className="pcard__face pcard__front" aria-hidden={isFlipped}>
                    <div className="pcard__poster">
                      <Image src={p.poster} alt="" fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 440px" loading="lazy" />
                    </div>
                    <div className="pcard__meta">
                      <p className="pcard__cat">{p.category} · {p.year}</p>
                      <h3 className="pcard__name">{p.name}</h3>
                      {proof && <p className="pcard__proof">{proof}</p>}
                      <button type="button" className="pcard__flip" onClick={() => setFlipped(p.id)} tabIndex={isFlipped ? -1 : 0}>
                        See the decision <RotateCcw size={14} aria-hidden />
                      </button>
                    </div>
                  </article>

                  {/* BACK: the 30-second judgement */}
                  <article className="pcard__face pcard__back" aria-hidden={!isFlipped} aria-label={`${p.name}: the decision`}>
                    <p className="pcard__cat">{p.name}</p>
                    <dl className="pcard__dl">
                      <div><dt>The problem</dt><dd>{firstSentence(p.breakdown.problem)}</dd></div>
                      <div><dt>The call</dt><dd>{firstSentence(p.breakdown.approach)}</dd></div>
                      <div><dt>The proof</dt><dd>{p.breakdown.results[0]}</dd></div>
                      <div><dt>What it taught</dt><dd>{firstSentence(p.breakdown.lessons)}</dd></div>
                    </dl>
                    <div className="pcard__actions">
                      <button type="button" className="ds-btn ds-btn--primary pcard__open" onClick={() => open(p.id)} tabIndex={isFlipped ? 0 : -1}>
                        Full breakdown <ArrowUpRight size={15} aria-hidden />
                      </button>
                      {p.github && (
                        <a className="pcard__icon" href={p.github} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} source on GitHub`} tabIndex={isFlipped ? 0 : -1}>
                          <GithubIcon size={16} />
                        </a>
                      )}
                      <button type="button" className="pcard__icon" onClick={() => setFlipped(null)} aria-label="Turn the card back" tabIndex={isFlipped ? 0 : -1}>
                        <RotateCcw size={15} aria-hidden />
                      </button>
                    </div>
                  </article>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {detailReady && <ProjectModal projectId={openId} caseView={caseView} setCaseView={setCaseView} onClose={() => setOpenId(null)} />}
    </SectionShell>
  );
}
