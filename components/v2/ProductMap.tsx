"use client";

// Product Map — the Graph button's default view. The portfolio as a map:
// territories are problem domains, cities are projects, and routes are real
// recorded relationships (config graphLinks): projects that share a
// capability, the FIS experience that fed three of them, and IntentSeal →
// Abide lineage. Motion follows map storytelling: territories settle in,
// routes draw themselves, cities pop, the selected city pings.
//
// Light by design: one SVG, CSS animation, no WebGL, mounted only when opened.
// The 3D knowledge graph stays available from here ("3D graph").

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Box, X } from "lucide-react";
import { graphLinks, mapExtraRoutes, mapTerritories, projects } from "@/config/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const CAP_NAME: Record<string, string> = {
  "sk-eval": "Evaluation",
  "sk-rag": "RAG",
  "sk-platform": "LLM platform",
  "paper-001": "Published research",
};
const ORIGIN: [number, number] = [468, 332];

type Route = { id: string; a: [number, number]; b: [number, number]; kind: "cap" | "origin" | "lineage"; label: string; note: string; ends: string[] };

const where = new Map<string, [number, number]>();
for (const t of mapTerritories) for (const p of t.projects) where.set(p.id, p.at);

function curve(a: [number, number], b: [number, number], bend = 0.18): string {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return `M ${a[0]} ${a[1]} Q ${mx - dy * bend} ${my + dx * bend} ${b[0]} ${b[1]}`;
}

function buildRoutes(): Route[] {
  const routes: Route[] = [];
  // Shared capabilities: projects linked to the same capability node.
  const byCap = new Map<string, { pid: string; note: string }[]>();
  for (const l of graphLinks) {
    if (!l.from.startsWith("p-") || !CAP_NAME[l.to]) continue;
    const pid = l.from.slice(2);
    if (!where.has(pid)) continue;
    const list = byCap.get(l.to) ?? [];
    list.push({ pid, note: l.note });
    byCap.set(l.to, list);
  }
  for (const [cap, list] of byCap) {
    for (let i = 1; i < list.length; i++) {
      const x = list[i - 1], y = list[i];
      routes.push({ id: `${cap}-${x.pid}-${y.pid}`, a: where.get(x.pid)!, b: where.get(y.pid)!, kind: "cap", label: CAP_NAME[cap], note: `${CAP_NAME[cap]} connects both: ${y.note}`, ends: [x.pid, y.pid] });
    }
  }
  // FIS experience → projects it fed (e-0 = most recent role).
  for (const l of graphLinks) {
    if (l.from !== "e-0" || !l.to.startsWith("p-")) continue;
    const pid = l.to.slice(2);
    const at = where.get(pid);
    if (at) routes.push({ id: `fis-${pid}`, a: ORIGIN, b: at, kind: "origin", label: "FIS Global", note: l.note, ends: [pid] });
  }
  for (const r of mapExtraRoutes) {
    const a = where.get(r.from), b = where.get(r.to);
    if (a && b) routes.push({ id: `lin-${r.from}-${r.to}`, a, b, kind: "lineage", label: "Builds on", note: r.note, ends: [r.from, r.to] });
  }
  return routes;
}

const ROUTES = buildRoutes(); // static data: computed once per module

export default function ProductMap({ onClose, onOpen3D }: { onClose: () => void; onOpen3D: () => void }) {
  const reduced = useReducedMotion();
  const routes = ROUTES;
  const [sel, setSel] = useState<string>("007");
  const [hoverRoute, setHoverRoute] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const p = projects.find((x) => x.id === sel);
  const territory = mapTerritories.find((t) => t.projects.some((x) => x.id === sel));
  const related = routes.filter((r) => r.ends.includes(sel));
  const shownNote = routes.find((r) => r.id === hoverRoute)?.note;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className={`pmap ${reduced ? "is-still" : ""}`} role="dialog" aria-modal="true" aria-label="Product map of Sankalp's work">
      <header className="pmap__bar">
        <div>
          <p className="ds-label">Product map</p>
          <h2 className="pmap__title">Where the work sits, and what connects it.</h2>
        </div>
        <div className="pmap__actions">
          <button type="button" className="ds-btn ds-btn--ghost" onClick={onOpen3D}><Box size={15} aria-hidden /> 3D graph</button>
          <button ref={closeRef} type="button" className="pmap__close" onClick={onClose} aria-label="Close product map"><X size={18} aria-hidden /></button>
        </div>
      </header>

      <div className="pmap__body">
        <div className="pmap__canvas">
          <svg viewBox="0 0 1000 620" className="pmap__svg" role="group" aria-label="Map: four territories, nine projects, and the routes between them">
            <defs>
              <pattern id="pmap-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" className="pmap__dot-grid" /></pattern>
            </defs>
            <rect width="1000" height="620" fill="url(#pmap-dots)" />
            {/* Contour rings around the origin: the map's "terrain" */}
            {[70, 130, 200, 280].map((r, i) => <circle key={r} cx={ORIGIN[0]} cy={ORIGIN[1]} r={r} className="pmap__contour" style={{ animationDelay: `${i * 80}ms` }} />)}

            {mapTerritories.map((t, i) => (
              <g key={t.id} className={`pmap__territory ${territory?.id === t.id ? "is-active" : ""}`} style={{ animationDelay: `${120 + i * 90}ms` }}>
                <path d={t.path} />
                <text x={t.label[0]} y={t.label[1]} className="pmap__tlabel">{t.name.toUpperCase()}</text>
              </g>
            ))}

            {routes.map((r, i) => {
              const on = r.ends.includes(sel) || hoverRoute === r.id;
              return (
                <g key={r.id} className={`pmap__route pmap__route--${r.kind} ${on ? "is-on" : ""}`}
                  onMouseEnter={() => setHoverRoute(r.id)} onMouseLeave={() => setHoverRoute(null)}>
                  <path d={curve(r.a, r.b, r.kind === "origin" ? 0.08 : 0.18)} pathLength={1} style={{ animationDelay: `${500 + i * 70}ms` }} />
                  <path d={curve(r.a, r.b, r.kind === "origin" ? 0.08 : 0.18)} className="pmap__hit" />
                </g>
              );
            })}

            {/* Origin */}
            <g className="pmap__origin" transform={`translate(${ORIGIN[0]} ${ORIGIN[1]})`}>
              <circle r="22" />
              <text y="4" textAnchor="middle">FIS</text>
              <text y="-32" textAnchor="middle" className="pmap__sub">3 yrs · where it started</text>
            </g>

            {mapTerritories.flatMap((t) => t.projects).map((c, i) => {
              const proj = projects.find((x) => x.id === c.id);
              if (!proj) return null;
              const active = sel === c.id;
              return (
                <g key={c.id} className={`pmap__city ${active ? "is-active" : ""}`} transform={`translate(${c.at[0]} ${c.at[1]})`} style={{ animationDelay: `${700 + i * 60}ms` }}>
                  <circle r="16" className="pmap__ping" />
                  <circle r="7" className="pmap__pin" />
                  <text y="-16" textAnchor="middle" className="pmap__clabel">{proj.name}</text>
                  <rect x="-60" y="-34" width="120" height="52" className="pmap__hit" tabIndex={0} role="button" aria-label={`${proj.name}, ${proj.category}`} aria-pressed={active}
                    onClick={() => setSel(c.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(c.id); } }} />
                </g>
              );
            })}
          </svg>
          <p className="pmap__legend">
            <span><i className="pmap__lg pmap__lg--cap" /> Shared capability</span>
            <span><i className="pmap__lg pmap__lg--origin" /> FIS experience</span>
            <span><i className="pmap__lg pmap__lg--lineage" /> Builds on</span>
          </p>
          {shownNote && <p className="pmap__tip" role="status">{shownNote}</p>}
        </div>

        {p && (
          <aside className="pmap__card" aria-live="polite">
            <p className="ds-label">{territory?.name} · {p.year}</p>
            <h3 className="pmap__cname">{p.name}</h3>
            <p className="pmap__cdesc">{p.description}</p>
            {related.length > 0 && (
              <>
                <p className="ds-label pmap__rhead">Connections</p>
                <ul className="pmap__rel">
                  {related.map((r) => (
                    <li key={r.id} onMouseEnter={() => setHoverRoute(r.id)} onMouseLeave={() => setHoverRoute(null)}>
                      <strong>{r.label}</strong>
                      <span>{r.note}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button type="button" className="ds-btn ds-btn--primary" onClick={() => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent("stage:case", { detail: p.id })), 60); }}>
              Open the breakdown <ArrowUpRight size={15} aria-hidden />
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
