"use client";

// Hero (APM redesign). One job: in under ten seconds a recruiter knows who
// this is, which role, one hard fact, and what to click.
//
//  • Name set huge behind the figure (decorative, aria-hidden).
//  • The figure is Sankalp; tap "Hear the intro" and he speaks. The voice is a
//    static mp3 recorded once (npm run voice:gen), so a visit costs zero TTS
//    credits. Captions follow audio.currentTime word by word.
//  • When personal.avatarVideo is set (the illustrated, lip-synced avatar),
//    the video replaces the portrait and drives the same captions.
//  • The voice only plays while the hero is on screen: scrolling away or
//    hiding the tab pauses it.
//
// Performance: no WebGL, no opacity-0 entrance (the h1 paints on frame one),
// one priority image, audio is preload="none".

import HeroNameFX from "./HeroNameFX";
import { AWARD_VFX } from "@/config/awardPass";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowRight, FileText, Pause, Play, Sparkles } from "lucide-react";
import { personal } from "@/config/portfolio";
import { useConcierge } from "@/contexts/ConciergeContext";
import { helios } from "@/lib/voice";
import { EDITORIAL_PORTRAIT } from "@/config/premiumPass";

const INTRO_SRC = "/voice/hero-intro.mp3";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const { ask, tour, tourRunning } = useConcierge();
  const hasVideo = !!personal.avatarVideo;
  // Transparent VP9 plays everywhere except Safari (which ignores the alpha
  // channel) — there, and for reduced motion, keep the CSS cutout walk-in.
  // Server-rendered as the clip; swapped to the cutout after mount if needed.
  const [walkClip, setWalkClip] = useState(!!personal.avatarWalkIn);
  useEffect(() => {
    if (!personal.avatarWalkIn) return;
    const ua = navigator.userAgent;
    const safari = /Safari\//.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (safari || reducedMotion) {
      const id = requestAnimationFrame(() => setWalkClip(false));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  // Talking clip (Flow/Veo, transparent) when the walk-in clip is in use;
  // otherwise the ElevenLabs mp3 drives the captions.
  const talkRef = useRef<HTMLVideoElement>(null);
  const talkMode = walkClip && !!personal.avatarTalk;
  const [ended, setEnded] = useState(false);

  // No on-screen captions (they covered the figure); the full script stays
  // available to screen readers below.
  const script = personal.heroIntroLines.join(" ");

  const media = useCallback((): HTMLMediaElement => {
    if (hasVideo && videoRef.current) return videoRef.current;
    if (talkMode && talkRef.current) return talkRef.current;
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "none";
      a.src = INTRO_SRC;
      audioRef.current = a;
    }
    return audioRef.current;
  }, [hasVideo, talkMode]);

  const pause = useCallback(() => {
    for (const m of [videoRef.current, talkRef.current, audioRef.current]) if (m && !m.paused) m.pause();
  }, []);

  const toggle = () => {
    const m = media();
    if (!m.paused) { m.pause(); return; }
    helios.stop(); // never talk over Helios
    if (m.ended || m.currentTime >= (m.duration || Infinity) - 0.05) m.currentTime = 0;
    if (m instanceof HTMLVideoElement) m.muted = false;
    setEnded(false);
    m.play().catch(() => setPlaying(false));
  };

  // Wire media events once the element exists.
  useEffect(() => {
    const m = hasVideo ? videoRef.current : media();
    if (!m) return;
    const onPlay = () => { setPlaying(true); setHeard(true); };
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); setEnded(true); };
    m.addEventListener("play", onPlay);
    m.addEventListener("pause", onPause);
    m.addEventListener("ended", onEnd);
    return () => {
      m.removeEventListener("play", onPlay);
      m.removeEventListener("pause", onPause);
      m.removeEventListener("ended", onEnd);
      m.pause();
    };
  }, [hasVideo, media]);

  // The talking clip shows while it plays (or is paused mid-way); when it ends
  // the walk-in's final frame — the identical pose — takes over again.
  const talking = talkMode && heard && !ended;

  // Talk only while the visitor is here: off-screen or hidden tab → pause.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio < 0.35) pause(); }, { threshold: [0, 0.35, 1] });
    io.observe(el);
    const onVis = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [pause]);

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section ref={sectionRef} id="section-hero" className={EDITORIAL_PORTRAIT ? "hero3 hero3--editorial" : "hero3"} aria-labelledby="hero-title">
      {/* Decorative name: drawn by CSS ::before from data-name, so it is not a
          text node (keeps it out of LCP and contrast audits; it's ornament). */}
      <div className="hero3__backname" data-name={personal.shortName.toUpperCase()} aria-hidden>{AWARD_VFX && <HeroNameFX name={personal.shortName.toUpperCase()} />}</div>

      <div className="ds-container hero3__grid">
        {/* Left: who and what */}
        <div className="hero3__copy">
          <p className="ds-label hero3__eyebrow">{personal.name}</p>
          <h1 id="hero-title" className="hero3__title">
            Product sense,<br />engineered<span className="hero3__dot">.</span>
          </h1>
          <p className="hero3__role">{personal.heroRole}</p>
          <p className="hero3__lead">
            I decide what an AI product should do, and what it must refuse to do, then I build it.
            Three years shipping software at FIS; now agentic systems with published evaluations.
          </p>
        </div>

        {/* Centre: the figure that speaks */}
        <figure className={`hero3__figure ${playing ? "is-speaking" : ""}`}>
          <div className={`hero3__frame ${hasVideo ? "" : walkClip ? `hero3__frame--cutout hero3__frame--clip${talking ? " is-talking" : ""}` : "hero3__frame--cutout"}`}>
            {hasVideo ? (
              <video
                ref={videoRef}
                className="hero3__media"
                src={personal.avatarVideo}
                poster={personal.avatarPoster || undefined}
                playsInline
                muted
                preload="none"
              />
            ) : (
              walkClip ? (
                // Generated walk-in (Google Flow → local background removal):
                // he walks from the back of the stage to the visitor, once,
                // then holds on the final frame.
                <>
                  <span className="hero3__shadow hero3__shadow--clip" aria-hidden />
                  <video
                    className="hero3__media hero3__media--walkin"
                    src={personal.avatarWalkIn}
                    poster={personal.avatarWalkInPoster}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    aria-label={`${personal.name} walks toward you and stops, smiling`}
                  />
                  {personal.avatarTalk && (
                    <video
                      ref={talkRef}
                      className="hero3__media hero3__media--walkin hero3__media--talk"
                      src={personal.avatarTalk}
                      playsInline
                      preload="none"
                      aria-label={`${personal.name} introducing himself`}
                    />
                  )}
                </>
              ) : (
              <>
                {/* The walk-in: a background-removed cutout of the real photo
                    (npx hyperframes remove-background) steps out from behind
                    the giant name toward the visitor; CSS-only, once. */}
                <span className="hero3__shadow" aria-hidden />
                <div className="hero3__walker">
                  <Image
                    src={personal.avatarCutout}
                    alt={`${personal.name} in a navy suit, smiling`}
                    fill
                    priority
                    sizes="(max-width: 700px) 62vw, (max-width: 1100px) 34vw, 420px"
                    className="hero3__media hero3__media--cutout"
                  />
                </div>
              </>
              )
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            className="hero3__voice"
            aria-pressed={playing}
          >
            <span className="hero3__voice-icon">{playing ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}</span>
            <span className="hero3__voice-text">{playing ? "Speaking" : heard ? "Replay intro" : "Hear my intro"}</span>
            <span className="hero3__bars" aria-hidden><i /><i /><i /><i /><i /></span>
          </button>
          <figcaption className="sr-only">{script}</figcaption>
        </figure>

        {/* Right: what to do next */}
        <div className="hero3__actions">
          <p className="hero3__status"><i aria-hidden /> {personal.availability} · {personal.noticePeriod}</p>
          <button type="button" className="ds-btn ds-btn--primary" onClick={() => goTo("section-decisions")}>
            See how I decide <ArrowRight size={16} aria-hidden />
          </button>
          <div className="hero3__secondary">
            <button type="button" className="ds-btn ds-btn--ghost" onClick={() => ask("Give me the 30-second case for Sankalp as an AI product engineer, with evidence.")}>
              <Sparkles size={15} aria-hidden /> Ask Helios
            </button>
            <a className="ds-btn ds-btn--ghost" href={personal.resumeUrl} download>
              <FileText size={15} aria-hidden /> Résumé
            </a>
          </div>
          <button type="button" className="hero3__tour" onClick={() => tour()} disabled={tourRunning}>
            <span className="hero3__tour-play" aria-hidden><Play size={14} /></span>
            <span className="hero3__tour-text">
              <b>{tourRunning ? "Tour in progress" : "Take the guided tour"}</b>
              <small>Narrated in my voice · Helios directs</small>
            </span>
          </button>
        </div>
      </div>

      <button type="button" className="hero3__scroll" onClick={() => goTo("section-proof")} aria-label="Scroll to the evidence">
        <ArrowDown size={16} aria-hidden />
      </button>
    </section>
  );
}
