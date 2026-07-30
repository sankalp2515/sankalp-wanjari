"use client";

// ── The Director ─────────────────────────────────────────────
// The autonomous layer that turns a chosen (or inferred) persona into a
// concrete page directive: which project leads the grid, which hero headline
// shows. It is DELIBERATELY deterministic — a weighted dot product, zero LLM
// calls, zero latency, zero rate-limit cost — so the page can adapt instantly
// and for free. The LLM is reserved for language elsewhere, never for this.
//
// Persona sources, in priority order:
//   1. explicit  — the visitor picked one in the "What brings you here?" chooser
//   2. inferred  — read softly from real behavior (opened a case, hit the resume…)
// Explicit always wins; inference only fills the gap so the page still adapts
// for visitors who skipped the chooser.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Persona } from "@/types";
import { projects, projectDimensions, heroVariants } from "@/config/portfolio";
import type { ProjectDimensions, HeroVariantKey } from "@/config/portfolio";
import { getLog } from "@/lib/behavior";
import { useConcierge } from "@/contexts/ConciergeContext";

type NamedPersona = Exclude<Persona, null>;

// A neutral project scores 0.5 on every axis when the config omits it — so a
// newly-added project never silently sinks to the bottom or vanishes.
const NEUTRAL_DIMS: ProjectDimensions = {
  businessImpact: 0.5, architectureDepth: 0.5, codeCraft: 0.5, novelty: 0.5,
};

// What each audience actually weighs. Recruiters want outcomes and a memorable
// story; CTO/EM want architecture depth; engineers want code craft; explorers
// want the novel, the "wait, what?" project first.
const WEIGHTS: Record<NamedPersona, ProjectDimensions> = {
  recruiter: { businessImpact: 1.0, architectureDepth: 0.2, codeCraft: 0.2, novelty: 0.5 },
  cto:       { businessImpact: 0.5, architectureDepth: 1.0, codeCraft: 0.6, novelty: 0.4 },
  developer: { businessImpact: 0.2, architectureDepth: 0.7, codeCraft: 1.0, novelty: 0.5 },
  explorer:  { businessImpact: 0.4, architectureDepth: 0.3, codeCraft: 0.3, novelty: 1.0 },
};

const HERO_FOR: Record<NamedPersona, HeroVariantKey> = {
  recruiter: "outcome",
  cto: "architecture",
  developer: "builder",
  explorer: "vision",
};

function dimsOf(id: string): ProjectDimensions {
  return { ...NEUTRAL_DIMS, ...(projectDimensions[id] ?? {}) };
}

function score(d: ProjectDimensions, w: ProjectDimensions): number {
  return d.businessImpact * w.businessImpact
    + d.architectureDepth * w.architectureDepth
    + d.codeCraft * w.codeCraft
    + d.novelty * w.novelty;
}

// The canonical config order — the SSR order, and the fallback when there's no
// persona. Returning this verbatim for `null` guarantees the server and the
// first client render agree (no hydration mismatch).
const DEFAULT_ORDER: string[] = projects.map((p) => p.id);

/** Rank project ids for a persona. Stable: ties keep original config order. */
export function rankProjects(persona: Persona): string[] {
  if (!persona) return DEFAULT_ORDER;
  const w = WEIGHTS[persona];
  return projects
    .map((p, i) => ({ id: p.id, i, s: score(dimsOf(p.id), w) }))
    .sort((a, b) => (b.s - a.s) || (a.i - b.i))
    .map((x) => x.id);
}

export function heroVariantFor(persona: Persona): HeroVariantKey {
  return persona ? HERO_FOR[persona] : "vision";
}

// Soft persona inference from the session behavior log. Intentionally
// conservative: it only commits to a persona once one audience clearly leads,
// so a couple of stray clicks never yank the page around.
export function inferPersona(): Persona {
  const log = getLog();
  if (!log.length) return null;

  const s = { recruiter: 0, cto: 0, developer: 0, explorer: 0 };
  for (const e of log) {
    switch (e.e) {
      case "resume-open": s.recruiter += 3; break;
      case "case-open":   s.cto += 1; s.developer += 0.5; break;
      case "skill":       s.developer += 1; break;
      case "asked":       s.recruiter += 0.3; break;
      case "view":
        if (e.d?.includes("research")) s.developer += 1;
        if (e.d?.includes("contact")) s.recruiter += 1.5;
        if (e.d?.includes("arc") || e.d?.includes("experience")) s.recruiter += 0.5;
        break;
    }
  }
  const ranked = (Object.entries(s) as [NamedPersona, number][]).sort((a, b) => b[1] - a[1]);
  const [topKey, topVal] = ranked[0];
  const secondVal = ranked[1]?.[1] ?? 0;
  // Require a clear lead (absolute floor + a margin over the runner-up) so
  // inference is a signal, not noise.
  return topVal >= 2 && topVal - secondVal >= 1 ? topKey : null;
}

export interface Directive {
  persona: Persona;        // the EFFECTIVE persona (explicit ?? inferred)
  explicit: boolean;       // did the visitor choose it, vs. we inferred it
  projectOrder: string[];
  heroVariant: HeroVariantKey;
}

// Strong, deliberate behavior signals that are worth re-running inference on.
// (Cheap `view` scroll events are covered by the initial mount pass; we don't
// re-rank on every section a mouse drifts past.)
const INFER_TRIGGERS = ["stage:case", "resume:open", "stage:highlight", "tour:done"];

/**
 * The page's live directive. Explicit persona (from the chooser, via the
 * concierge context) always wins; otherwise we infer from behavior on mount
 * and on strong signals. Re-rendering consumers reorder the grid / swap the
 * hero automatically.
 */
export function useDirective(): Directive {
  const { persona, tourRunning } = useConcierge();
  const [inferred, setInferred] = useState<Persona>(null);
  // Avoid a state write (and re-render) when inference lands on the same value.
  const inferredRef = useRef<Persona>(null);
  // The tour opens cases and glides the camera; a persona flip mid-film would
  // reshuffle the page under the visitor. Freeze inference while it runs.
  const tourRef = useRef(tourRunning);
  useEffect(() => { tourRef.current = tourRunning; }, [tourRunning]);

  useEffect(() => {
    // Explicit choice supersedes inference entirely — stop guessing once the
    // visitor has told us who they are.
    if (persona) return;
    const recompute = () => {
      if (tourRef.current) return; // never re-rank during the film
      const next = inferPersona();
      if (next !== inferredRef.current) {
        inferredRef.current = next;
        setInferred(next);
      }
    };
    recompute(); // mount pass — catches anything already in the log
    for (const evt of INFER_TRIGGERS) window.addEventListener(evt, recompute);
    return () => { for (const evt of INFER_TRIGGERS) window.removeEventListener(evt, recompute); };
  }, [persona]);

  const effective: Persona = persona ?? inferred;

  return useMemo<Directive>(() => ({
    persona: effective,
    explicit: !!persona,
    projectOrder: rankProjects(effective),
    heroVariant: heroVariantFor(effective),
  }), [effective, persona]);
}
