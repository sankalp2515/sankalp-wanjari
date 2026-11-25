"use client";

// Achievements as a pinned reel: the section holds while vertical scroll
// drives the cards sideways, with a progress rule. Only placements and awards
// are shown (the rank numeral reveals on view); verified credentials follow,
// labelled as credentials, never as placements. The lead card carries the
// organiser's own winners card as proof.
//
// Desktop with motion only. Touch, narrow screens and reduced motion get a
// native horizontal scroll-snap row: no pinning, no scroll hijack.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { achievements, credentials } from "@/config/portfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function AchievementsSection() {
  const reduced = useReducedMotion();
  const outerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [pin, setPin] = useState(false);
  const [travel, setTravel] = useState(0);
  const total = achievements.length + credentials.length;

  // Decide pinning after mount (server renders the scroll-snap row).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    const update = () => setPin(mq.matches && !reduced);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduced]);

  // Reveal each card's numeral once it is mostly on screen (works for both
  // the pinned track and the native scroll row).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }, { threshold: 0.3 });
    track.querySelectorAll(".ach3__card").forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  // Measure how far the track must travel.
  useEffect(() => {
    if (!pin) return;
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setTravel(Math.max(0, track.scrollWidth - track.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [pin]);

  // Scroll → translate. One transform write per frame, only while in range.
  useEffect(() => {
    if (!pin || !travel) return;
    const outer = outerRef.current, track = trackRef.current, bar = barRef.current;
    if (!outer || !track) return;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const r = outer.getBoundingClientRect();
      const range = r.height - window.innerHeight;
      const p = range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
      track.style.transform = `translate3d(${-p * travel}px,0,0)`;
      if (bar) bar.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      track.style.transform = "";
    };
  }, [pin, travel]);

  if (!achievements.length) return null;

  return (
    <section
      ref={outerRef}
      id="section-achievements"
      className={`ach3 story-section ${pin ? "is-pinned" : ""}`}
      style={pin && travel ? { height: `calc(100vh + ${travel}px)` } : undefined}
      aria-labelledby="ach3-title"
    >
      <div className="ach3__sticky">
        <div className="ds-container ach3__head">
          <div>
            <p className="ds-kicker"><span className="ds-kicker__index">05</span><span>Achievements</span></p>
            <h2 id="ach3-title" className="ds-h2">Ranked against the country.</h2>
          </div>
          <div className="ach3__meta">
            <p className="ds-lead">Placements judged by someone else, each linked to the organiser&apos;s own record.</p>
            <div className="ach3__progress" aria-hidden><span ref={barRef} /></div>
          </div>
        </div>

        <ol ref={trackRef} className="ach3__track" role="list">
          {achievements.map((a, i) => {
            const lead = i === 0;
            const image = "image" in a ? a.image : undefined;
            const proofUrl = "proofUrl" in a ? a.proofUrl : undefined;
            const proofLabel = "proofLabel" in a ? a.proofLabel : undefined;
            const prize = "prize" in a ? a.prize : undefined;
            return (
              <li key={a.id} className={`ach3__card ach3__card--rank${lead ? " is-lead" : ""}${lead && image ? " has-proof" : ""}`}>
                <div className="ach3__main">
                  <div className="ach3__top">
                    <span className="ds-label">{a.organiser}</span>
                    <span className="ach3__idx">{String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
                  </div>
                  <p className="ach3__rank" aria-label={a.title}><span className="ach3__rank-num">{a.rank.replace(/\D+$/, "")}</span><sup>{a.rank.replace(/^\d+/, "")}</sup></p>
                  <div className="ach3__body">
                    <h3 className="ach3__title">{a.title}</h3>
                    <p className="ach3__event">{a.event}{a.date && !a.event.includes(a.date) ? ` · ${a.date}` : ""}{prize ? <span className="ach3__prize">Prize {prize}</span> : null}</p>
                    <p className="ach3__desc">{a.description}</p>
                    <ul className="ach3__facts">
                      {a.highlights.slice(0, 3).map((h) => <li key={h}>{h}</li>)}
                    </ul>
                    <div className="ach3__foot">
                      <span className="ach3__project">{a.project}{a.team ? ` · ${a.team}` : ""}</span>
                      <span className="ach3__links">
                        {proofUrl && (
                          <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="ach3__link">
                            {proofLabel ?? "Record"} <ArrowUpRight size={14} aria-hidden />
                          </a>
                        )}
                        <a href={a.github} target="_blank" rel="noopener noreferrer" className="ach3__link">
                          Code <ArrowUpRight size={14} aria-hidden />
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
                {lead && image && (
                  <figure className="ach3__proof">
                    <Image src={image} alt={`Official winners card: ${a.title}, ${a.event}, ${a.team}`} fill sizes="(max-width: 860px) 80vw, 300px" />
                  </figure>
                )}
              </li>
            );
          })}
          {credentials.map((c, i) => (
            <li key={c.id} className="ach3__card ach3__card--cred">
              <div className="ach3__main">
                <div className="ach3__top">
                  <span className="ds-label">Verified credential</span>
                  <span className="ach3__idx">{String(achievements.length + i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
                </div>
                <div className="ach3__seal" aria-hidden>
                  <svg viewBox="0 0 200 200" className="ach3__seal-ring">
                    <defs><path id={`seal-${c.id}`} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
                    <text><textPath href={`#seal-${c.id}`}>{`VERIFIED CREDENTIAL · ${c.issuer.toUpperCase()} · ${c.date.toUpperCase()} · `}</textPath></text>
                  </svg>
                  <span className="ach3__seal-core"><BadgeCheck size={44} strokeWidth={1.6} /></span>
                </div>
                <div className="ach3__body">
                  <h3 className="ach3__title">{c.title}</h3>
                  <p className="ach3__event">{c.issuer} · {c.date}</p>
                  <p className="ach3__desc">{c.context}</p>
                  <dl className="ach3__cred">
                    <div><dt>Credential ID</dt><dd className="ach3__cred-id">{c.id}</dd></div>
                    <div><dt>Status</dt><dd><i className="ach3__cred-dot" aria-hidden /> Valid, issuer-hosted record</dd></div>
                    {c.project && (
                      <div><dt>Built with it</dt><dd><b>{c.project.name}</b>: {c.project.line}</dd></div>
                    )}
                  </dl>
                  <div className="ach3__foot">
                    <span className="ach3__project">Not a placement</span>
                    <span className="ach3__links">
                      {c.project && (
                        <a href={c.project.github} target="_blank" rel="noopener noreferrer" className="ach3__link">
                          Code <ArrowUpRight size={14} aria-hidden />
                        </a>
                      )}
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="ach3__link">
                        Verify <ArrowUpRight size={14} aria-hidden />
                      </a>
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
