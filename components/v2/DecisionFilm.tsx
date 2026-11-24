"use client";

// The decision film: each flagship project is one pinned chapter that plays
// four beats as you scroll — Problem → Decision → Trade-off → Outcome.
// Left: the beat copy (sticky). Right: the project's motion loop. When the
// project has a pre-rendered HyperFrames video, each beat plays its own
// segment and holds on its last frame; otherwise the poster carries the beat
// with a light per-beat treatment and a metric card on the outcome.
//
// Desktop (≥ 900px, fine pointer or not) pins; below that the beats stack as
// a short readable list with no scroll-jacking. Reduced motion: no pin
// transitions, beats switch instantly, video does not autoplay.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { projects, projectFilms, type FilmBeatKey } from "@/config/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Metric from "./Metric";

const BEATS: { key: FilmBeatKey; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "decision", label: "Decision" },
  { key: "tradeoff", label: "Trade-off" },
  { key: "outcome", label: "Outcome" },
];

type Project = (typeof projects)[number];

function Chapter({ p, order, onOpen, pinned }: { p: Project; order: number; onOpen: (id: string) => void; pinned: boolean }) {
  const film = projectFilms[p.id];
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!pinned) return;
    const next = Math.min(BEATS.length - 1, Math.max(0, Math.floor(v * BEATS.length)));
    setBeat((b) => (b === next ? b : next));
  });

  // Play this beat's video segment, then hold its last frame. Timed with a
  // timer, not `timeupdate` (which fires only ~4×/s and overshot into the next
  // scene). Seeks wait for metadata: with preload="metadata" a seek issued
  // before it loads would be dropped and the film would start from 0.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !film.segments || reduced) return;
    const [from, to] = film.segments[BEATS[beat].key];
    let timer = 0;
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      v.currentTime = from;
      v.play().catch(() => {});
      timer = window.setTimeout(() => { v.pause(); v.currentTime = to; }, (to - from) * 1000);
    };
    if (v.readyState >= 1) start();
    else v.addEventListener("loadedmetadata", start, { once: true });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      v.removeEventListener("loadedmetadata", start);
      v.pause();
    };
  }, [beat, film.segments, reduced]);

  const key = BEATS[beat].key;
  const visual = (
    <div className={`dfilm__frame ${film.video ? "dfilm__frame--video" : `dfilm__frame--${key}`}`}>
      {film.video ? (
        <video ref={videoRef} className="dfilm__media" src={film.video} poster={film.videoPoster ?? p.poster} muted playsInline preload="metadata" aria-label={`${p.name}: ${BEATS[beat].label.toLowerCase()} animation`} />
      ) : (
        <Image src={p.poster} alt={`${p.name} product poster`} fill sizes="(max-width: 900px) 100vw, 58vw" className="dfilm__media" />
      )}
      {!film.video && <span className="dfilm__scan" aria-hidden />}
      <AnimatePresence mode="wait">
        <m.span
          key={key}
          className="dfilm__stamp"
          initial={reduced ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? undefined : { y: -12, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {String(beat + 1).padStart(2, "0")} · {BEATS[beat].label}
        </m.span>
      </AnimatePresence>
      <AnimatePresence>
        {key === "outcome" && !film.video && (
          <m.div
            className="dfilm__metric"
            initial={reduced ? false : { y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { y: 16, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <strong><Metric value={film.metric.value} duration={900} /></strong>
            <span>{film.metric.label}</span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );

  const head = (
    <header className="dfilm__head">
      <p className="ds-label"><span className="ds-accent">{String(order).padStart(2, "0")}</span> · {p.category} · {p.status}</p>
      <h3 className="dfilm__name">{p.name}</h3>
      <p className="dfilm__tagline">{film.tagline}</p>
    </header>
  );

  if (!pinned) {
    // Stacked, no scroll-jacking: the whole story reads top to bottom.
    return (
      <article ref={ref} id={`film-${p.id}`} className="dfilm dfilm--stacked">
        {head}
        <div className="dfilm__frame dfilm__frame--static">
          {/* A still, not autoplay: the server renders this stacked layout
              first on every device, and an autoplaying video here would make
              desktops download all three films before the pinned film mounts. */}
          <Image src={film.videoPoster ?? p.poster} alt={`${p.name}: ${film.tagline}`} fill sizes="100vw" className="dfilm__media" />
        </div>
        <ol className="dfilm__beats">
          {BEATS.map((b, i) => (
            <li key={b.key} className="dfilm__beat is-active">
              <span className="ds-label">{String(i + 1).padStart(2, "0")} · {b.label}</span>
              <p>{film.beats[b.key]}</p>
            </li>
          ))}
        </ol>
        <button type="button" className="ds-btn ds-btn--ghost dfilm__open" onClick={() => onOpen(p.id)}>
          Full breakdown <ArrowUpRight size={15} aria-hidden />
        </button>
      </article>
    );
  }

  return (
    <article ref={ref} id={`film-${p.id}`} className="dfilm" style={{ height: `${BEATS.length * 75 + 25}vh` }}>
      <div className="dfilm__sticky">
        <div className="dfilm__grid">
          <div className="dfilm__copy">
            {head}
            <ol className="dfilm__beats">
              {BEATS.map((b, i) => (
                <li key={b.key} className={`dfilm__beat ${i === beat ? "is-active" : ""} ${i < beat ? "is-past" : ""}`} aria-current={i === beat ? "step" : undefined}>
                  <span className="ds-label">{String(i + 1).padStart(2, "0")} · {b.label}</span>
                  <p>{film.beats[b.key]}</p>
                </li>
              ))}
            </ol>
            <div className="dfilm__foot">
              <span className="dfilm__track" aria-hidden><m.i style={{ scaleX: scrollYProgress }} /></span>
              <button type="button" className="ds-btn ds-btn--ghost dfilm__open" onClick={() => onOpen(p.id)}>
                Full breakdown <ArrowUpRight size={15} aria-hidden />
              </button>
            </div>
          </div>
          {visual}
        </div>
      </div>
    </article>
  );
}

export default function DecisionFilm({ ids, onOpen }: { ids: string[]; onOpen: (id: string) => void }) {
  const wide = useMediaQuery("(min-width: 900px)");
  const reduced = useReducedMotion();
  const pinned = wide && !reduced;
  const list = ids.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as Project[];
  return (
    <div className="dfilm-list">
      {list.map((p, i) => <Chapter key={p.id} p={p} order={i + 1} onOpen={onOpen} pinned={pinned} />)}
    </div>
  );
}
