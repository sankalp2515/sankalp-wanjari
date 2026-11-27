"use client";

// AI Radar — "what changed in AI this week, read with a product lens".
// The portfolio becomes useful to the visitor: live headlines from the labs
// Sankalp follows, each with the product question it raises, linked to his own
// related work where one exists.
//
// Fetch policy: nothing is requested until this section is ~1 screen away, so
// a visitor who never scrolls here costs nothing; the server shares one cached
// build per 12 h across everyone (lib/radar.ts).
//
// Motion: a radar dial whose sweep is a single CSS rotation; each blip pings
// when the sweep crosses its angle (animation-delay = angle / 360 × period),
// so the whole scene runs on the compositor with zero JS per frame. The sweep
// stops off-screen and under reduced motion.

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Radar, Sparkles } from "lucide-react";
import { radarWatchlist } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import SectionShell from "./SectionShell";
import RadarSignal from "./RadarSignal";
import LogoMark from "./LogoMark";
import { RADAR_VISUAL } from "@/config/premiumPass";
import { FX_RADAR } from "@/config/awardPass";

// FX_RADAR: an afterglow behind the beam (the sweep turns clockwise), 18
// thin slices fading from the beam backwards, like phosphor on a real scope.
const TRAIL = Array.from({ length: 18 }, (_, i) => {
  const pt = (deg: number) => { const a = (deg * Math.PI) / 180; return `${(80 * Math.sin(a)).toFixed(2)} ${(-80 * Math.cos(a)).toFixed(2)}`; };
  return { d: `M0 0 L${pt(-i * 4)} A80 80 0 0 0 ${pt(-(i + 1) * 4)} Z`, o: (0.3 * Math.pow(1 - i / 18, 2.2)).toFixed(3) };
});

interface Item {
  id: string;
  title: string;
  link: string;
  source: string;
  date: string | null;
  entity: string | null;
  soWhat?: string;
  related?: { id: string; name: string };
}
interface Payload { status: "live" | "unavailable"; updatedAt: string; items: Item[]; reason?: string }

const SWEEP_S = 8;
const WEEK = 7 * 24 * 3600 * 1000;

function ago(iso: string | null, now: number): string {
  if (!iso || !now) return "this week";
  const h = Math.max(0, (now - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function RadarSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  // "Now" is captured when the feed arrives, so render stays pure.
  const [now, setNow] = useState(0);
  const { ask } = useConcierge();

  // Fetch once, only when the visitor gets near.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "900px 0px" });
    io.observe(el);
    const vis = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.15 });
    vis.observe(el);
    return () => { io.disconnect(); vis.disconnect(); };
  }, []);

  useEffect(() => {
    if (!near) return;
    const ctl = new AbortController();
    fetch("/api/radar", { signal: ctl.signal })
      .then((r) => r.json())
      .then((d: Payload) => { setNow(Date.now()); setData(d); })
      .catch((e) => { if ((e as Error).name !== "AbortError") setFailed(true); });
    return () => ctl.abort();
  }, [near]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const shown = filter ? items.filter((i) => i.entity === filter) : items;
  const visible = expanded ? shown : shown.slice(0, RADAR_VISUAL ? 6 : 5);
  // The chain shows the picked headline; by default the first one that
  // touches Sankalp's work, else the newest.
  const picked = shown.find((i) => i.id === pickedId) ?? shown.find((i) => i.related) ?? shown[0] ?? null;
  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const i of items) if (i.entity) c.set(i.entity, (c.get(i.entity) ?? 0) + 1);
    return c;
  }, [items]);

  // Blip geometry: entity angle (+ a small spread), radius by recency.
  const blips = useMemo(() => {
    const perEntity = new Map<string, number>();
    return items.map((it) => {
      const base = radarWatchlist.find((e) => e.name === it.entity)?.angle ?? 0;
      const k = perEntity.get(it.entity ?? "") ?? 0;
      perEntity.set(it.entity ?? "", k + 1);
      const angle = base + (k - 1) * 9;
      const age = it.date && now ? Math.min(1, Math.max(0, (now - new Date(it.date).getTime()) / WEEK)) : 0.85;
      const r = 18 + age * 62;
      const rad = ((angle - 90) * Math.PI) / 180;
      return { id: it.id, entity: it.entity, x: Math.cos(rad) * r, y: Math.sin(rad) * r, delay: (((angle % 360) + 360) % 360) / 360 * SWEEP_S };
    });
  }, [items, now]);

  const brief = () => {
    const top = items.slice(0, 6).map((i) => `- [${i.entity}] ${i.title}`).join("\n");
    ask(top
      ? `Brief me in 30 seconds on this week's AI news for product teams. Headlines:\n${top}\nGive the 3 implications that matter most, and where Sankalp's work is relevant.`
      : "What AI developments does Sankalp track, and why do they matter for product teams?");
  };

  const loading = near && !data && !failed;
  const unavailable = failed || data?.status === "unavailable";

  return (
    <SectionShell
      id="section-radar"
      index="04"
      layout="stack"
      kicker="AI Radar · live"
      title="What changed in AI this week, read with a product lens."
      subtitle="Headlines from the labs I follow, each with the product question it raises. It refreshes at most twice a day, and only because someone like you visited."
    >
      <div ref={ref} className={`radar ${onScreen ? "is-on" : ""}`}>
        {/* The dial */}
        <div className="radar__dial-wrap">
          <svg className="radar__dial" viewBox="-110 -110 220 220" role="img" aria-label={`Radar of ${items.length} AI headlines from the past week; closer to the centre is newer.`}>
            <defs>
              <radialGradient id="radar-sweep-g" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(100)">
                <stop offset="0" stopColor="var(--os-accent)" stopOpacity="0.0" />
                <stop offset="1" stopColor="var(--os-accent)" stopOpacity="0.28" />
              </radialGradient>
            </defs>
            {[30, 55, 80].map((r) => <circle key={r} r={r} className="radar__ring" />)}
            <line x1="-80" y1="0" x2="80" y2="0" className="radar__axis" />
            <line x1="0" y1="-80" x2="0" y2="80" className="radar__axis" />
            <g className="radar__sweep" style={{ animationDuration: `${SWEEP_S}s` }}>
              {FX_RADAR
                ? TRAIL.map((t, i) => <path key={i} d={t.d} className="radar__trail" style={{ opacity: t.o }} />)
                : <path d="M0 0 L0 -80 A80 80 0 0 1 56.6 -56.6 Z" fill="url(#radar-sweep-g)" />}
              <line x1="0" y1="0" x2="0" y2="-80" className="radar__beam" />
            </g>
            {radarWatchlist.map((e) => {
              const rad = ((e.angle - 90) * Math.PI) / 180;
              const on = !filter || filter === e.name;
              const x = Math.cos(rad) * 96, y = Math.sin(rad) * 96;
              if (RADAR_VISUAL) return (
                <g key={e.name} className={`radar__label radar__label--logo ${on ? "" : "is-dim"}`}>
                  <foreignObject x={x - 6} y={y - 10} width="12" height="12"><LogoMark name={e.name} size={12} /></foreignObject>
                  <text x={x} y={y + 9} textAnchor="middle">{e.name.replace("Google ", "").replace(" AI", "")}</text>
                </g>
              );
              return (
                <text key={e.name} x={x} y={y + 3} textAnchor="middle" className={`radar__label ${on ? "" : "is-dim"}`}>
                  {e.name.replace("Google ", "")}
                </text>
              );
            })}
            {blips.map((b) => {
              const on = (!filter || filter === b.entity);
              return (
                <g key={b.id} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`} className={`radar__blip ${active === b.id || (RADAR_VISUAL && picked?.id === b.id) ? "is-active" : ""} ${on ? "" : "is-dim"}`}
                  onClick={RADAR_VISUAL ? () => setPickedId(b.id) : undefined}
                  onMouseEnter={RADAR_VISUAL ? () => setActive(b.id) : undefined}
                  onMouseLeave={RADAR_VISUAL ? () => setActive(null) : undefined} style={{ animationDelay: `${b.delay.toFixed(2)}s`, animationDuration: `${SWEEP_S}s` }}>
                  <circle r="7" className="radar__ping" />
                  <circle r="2.6" className="radar__dot" />
                </g>
              );
            })}
            <circle r="2" className="radar__core" />
          </svg>
          <p className="radar__legend ds-label">Centre = newest · edge = 7 days</p>
        </div>

        {/* The feed */}
        <div className="radar__feed">
          <div className="radar__bar">
            <div className="radar__chips" role="group" aria-label="Filter by company">
              <button type="button" className="radar__chip" aria-pressed={!filter} onClick={() => setFilter(null)}>All</button>
              {radarWatchlist.map((e) => (
                <button key={e.name} type="button" className="radar__chip" aria-pressed={filter === e.name} onClick={() => setFilter(filter === e.name ? null : e.name)} disabled={!counts.get(e.name)}>
                  {RADAR_VISUAL && <LogoMark name={e.name} size={14} />}{e.name}{counts.get(e.name) ? <span>{counts.get(e.name)}</span> : null}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <ul className="radar__list" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => <li key={i} className="radar__card radar__card--skeleton" />)}
            </ul>
          )}

          {unavailable && !loading && (
            <div className="radar__empty">
              <Radar size={20} aria-hidden />
              <p>{data?.reason || "The live feed is resting right now."} I still track these labs; ask Helios what changed and why it matters.</p>
            </div>
          )}

          {RADAR_VISUAL && !loading && !unavailable && (
            <RadarSignal items={visible} all={shown} picked={picked} onPick={setPickedId} onHover={setActive} ago={(d) => ago(d, now)} ask={ask} />
          )}

          {!RADAR_VISUAL && !loading && !unavailable && (
            <ul className="radar__list">
              {visible.map((it, i) => (
                <li
                  key={it.id}
                  className={`radar__card ${active === it.id ? "is-active" : ""}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                  onMouseEnter={() => setActive(it.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(it.id)}
                  onBlur={() => setActive(null)}
                >
                  <p className="radar__meta"><span className="ds-chip">{it.entity}</span><span>{it.source}</span><span aria-hidden>·</span><time dateTime={it.date ?? undefined}>{ago(it.date, now)}</time></p>
                  <a className="radar__title" href={it.link} target="_blank" rel="noopener noreferrer">
                    {it.title} <ArrowUpRight size={15} aria-hidden />
                  </a>
                  {it.soWhat && <p className="radar__so"><span className="ds-label">For product teams</span>{it.soWhat}</p>}
                  {it.related && (
                    <button type="button" className="radar__related" onClick={() => window.dispatchEvent(new CustomEvent("stage:case", { detail: it.related!.id }))}>
                      Related to my work: {it.related.name} <ArrowUpRight size={13} aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="radar__foot">
            {!loading && !unavailable && shown.length > (RADAR_VISUAL ? 6 : 5) && (
              <button type="button" className="ds-btn ds-btn--ghost" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "Show fewer" : `Show all ${shown.length}`}
              </button>
            )}
            <button type="button" className="ds-btn ds-btn--primary" onClick={brief}>
              <Sparkles size={15} aria-hidden /> Brief me in 30 seconds
            </button>
            {data?.updatedAt && data.status === "live" && <span className="ds-label">Updated {ago(data.updatedAt, now)} · AI-written notes</span>}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
