"use client";

// The About motion graphic: a Remotion-rendered loop (motion/about-reel) of
// Sankalp inside a turning ring while verified facts surface around him.
// Transparent VP9, so the section's own surface shows through in either theme.
//
// Cost control: no bytes until the stage is near the viewport (preload none,
// src set on intersect), paused whenever it scrolls away. Safari ignores VP9
// alpha and reduced-motion visitors asked for stillness: both get the poster.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const SRC = "/about/reel.webm";
const POSTER = "/about/reel-poster.webp";

const noSubscribe = () => () => {};
// Safari ignores VP9 alpha. The server snapshot says "no motion" so the first
// paint is always the poster.
const canPlayAlpha = () => {
  const ua = navigator.userAgent;
  return !(/Safari\//.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua));
};

export default function AboutReel({ alt }: { alt: string }) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const alpha = useSyncExternalStore(noSubscribe, canPlayAlpha, () => false);
  const motion = alpha && !reduced;
  const [near, setNear] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !motion) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setNear(true);
      const v = videoRef.current;
      if (!v) return;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [motion, near]);

  return (
    <div ref={wrapRef} className={`about3__reel${playing ? " is-playing" : ""}`}>
      <Image src={POSTER} alt={alt} fill sizes="(max-width: 860px) 100vw, 1200px" className="about3__reel-poster" />
      {motion && near && (
        <video
          ref={videoRef}
          className="about3__reel-video"
          src={SRC}
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          aria-hidden
          onPlaying={() => setPlaying(true)}
        />
      )}
    </div>
  );
}
