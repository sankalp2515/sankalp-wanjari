"use client";

// RadarSignal — the right column of AI Radar as a picture instead of a list
// (premium pass, config/premiumPass.ts: RADAR_VISUAL).
//
//   ┌ the picked headline ─────────────────────────────────────────┐
//   │ [lab logo] ──pulse──▶ [the product question] ──pulse──▶ [my build] │
//   └───────────────────────────────────────────────────────────────┘
//   connection meter: "3 of 9 headlines this week touch something I built"
//   logo list of every headline; picking one re-routes the chain.
//
// The chain's last node only names a build when lib/radar.ts matched one by
// keyword (deterministic, never the LLM); otherwise it offers to ask Helios.
// Pulses are a CSS dash animation, paused under reduced motion.

import Image from "next/image";
import { ArrowUpRight, Sparkles, MessageCircleQuestion } from "lucide-react";
import { projects } from "@/config/portfolio";
import LogoMark from "./LogoMark";

export interface RadarItem {
  id: string;
  title: string;
  link: string;
  source: string;
  date: string | null;
  entity: string | null;
  soWhat?: string;
  related?: { id: string; name: string };
}

export default function RadarSignal({
  items,
  all,
  picked,
  onPick,
  onHover,
  ago,
  ask,
}: {
  /** Rows to list (may be the first few). */
  items: RadarItem[];
  /** Every headline in the current filter, for the meter. */
  all: RadarItem[];
  picked: RadarItem | null;
  onPick: (id: string) => void;
  onHover: (id: string | null) => void;
  ago: (iso: string | null) => string;
  ask: (text: string, opts?: { projectId?: string }) => void;
}) {
  const linked = all.filter((i) => i.related).length;
  const build = picked?.related ? projects.find((p) => p.id === picked.related!.id) : undefined;

  return (
    <div className="rsig">
      {picked && (
        <article className="rsig__chain" key={picked.id} aria-live="polite">
          <a className="rsig__headline" href={picked.link} target="_blank" rel="noopener noreferrer">
            {picked.title} <ArrowUpRight size={16} aria-hidden />
          </a>

          <ol className="rsig__nodes">
            <li className="rsig__node rsig__node--lab">
              <span className="rsig__logo"><LogoMark name={picked.entity ?? ""} size={34} /></span>
              <span className="ds-label">The news</span>
              <span className="rsig__nodetitle">{picked.entity}</span>
              <span className="rsig__nodemeta">{picked.source} · {ago(picked.date)}</span>
            </li>
            <li className="rsig__wire" aria-hidden><i /></li>
            <li className="rsig__node rsig__node--q">
              <span className="ds-label">For product teams</span>
              {picked.soWhat
                ? <span className="rsig__nodebody">{picked.soWhat}</span>
                : <button type="button" className="rsig__ask" onClick={() => ask(`What does this mean for product teams: "${picked.title}"?`)}>
                    <MessageCircleQuestion size={15} aria-hidden /> Ask Helios what it changes
                  </button>}
            </li>
            <li className="rsig__wire" aria-hidden><i /></li>
            <li className={`rsig__node rsig__node--build ${build ? "" : "is-open"}`}>
              <span className="ds-label">Where my work meets it</span>
              {build ? (
                <button type="button" className="rsig__build" onClick={() => window.dispatchEvent(new CustomEvent("stage:case", { detail: build.id }))}>
                  <span className="rsig__poster"><Image src={build.poster} alt="" fill sizes="220px" /></span>
                  <span className="rsig__nodetitle">{build.name} <ArrowUpRight size={14} aria-hidden /></span>
                </button>
              ) : (
                <button type="button" className="rsig__ask" onClick={() => ask(`How does Sankalp's work relate to this news: "${picked.title}"?`)}>
                  <Sparkles size={15} aria-hidden /> No direct build yet. Ask how my work relates
                </button>
              )}
            </li>
          </ol>
        </article>
      )}

      <div className="rsig__meter">
        <p><strong>{linked}</strong> of {all.length} headlines this week touch something I have built.</p>
        <span className="rsig__bars" aria-hidden>
          {all.map((i) => <i key={i.id} className={i.related ? "is-on" : ""} />)}
        </span>
      </div>

      <ul className="rsig__list">
        {items.map((it, n) => (
          <li key={it.id} style={{ animationDelay: `${n * 50}ms` }}>
            <button
              type="button"
              className={`rsig__row ${picked?.id === it.id ? "is-picked" : ""}`}
              aria-pressed={picked?.id === it.id}
              onClick={() => onPick(it.id)}
              onMouseEnter={() => onHover(it.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(it.id)}
              onBlur={() => onHover(null)}
            >
              <span className="rsig__rowlogo"><LogoMark name={it.entity ?? ""} size={20} /></span>
              <span className="rsig__rowtitle">{it.title}</span>
              <span className="rsig__rowmeta">
                {it.related && <span className="rsig__tag">{it.related.name}</span>}
                <time dateTime={it.date ?? undefined}>{ago(it.date)}</time>
              </span>
            </button>
            {/* The row picks the headline for the chain above; this opens the
                original article (a sibling, since a link can't sit in a button). */}
            <a className="rsig__src" href={it.link} target="_blank" rel="noopener noreferrer" aria-label={`Read "${it.title}" on ${it.source}`}>
              <ArrowUpRight size={16} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
