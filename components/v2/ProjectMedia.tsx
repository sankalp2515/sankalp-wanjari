"use client";

// Project card media — thumbnail-first, video-on-demand.
//
// The old GIF previews downloaded and decoded in full on page load, which is
// what made the grid expensive. This does the opposite:
//
//   1. Nothing at all is fetched until the card is near the viewport
//      (IntersectionObserver, 300px margin).
//   2. With a `poster` configured, the <video> uses preload="none" — the
//      browser fetches a single still image and ZERO video bytes.
//   3. Without a poster, it falls back to preload="metadata", which pulls
//      just enough of the file to paint the first frame as the thumbnail.
//   4. The clip only streams and plays on hover / keyboard focus, and is
//      paused + rewound on leave so memory is released back.
//
// Touch devices (no hover) and reduced-motion users never trigger playback —
// they keep the still frame, which is the cheap, correct behaviour there.

import { useEffect, useRef, useState } from "react";
import { Bot, CircleDot, GitBranch } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(src);

/** Fallback animated signals for projects with no preview asset yet. */
function Signal({ id }: { id: string }) {
  if (id === "001")
    return (
      <div className="project-grid__signal project-grid__signal--agents" aria-hidden>
        <span /><span /><span /><i /><i /><i />
      </div>
    );
  if (id === "002")
    return (
      <div className="project-grid__signal project-grid__signal--research" aria-hidden>
        <span>CLAIM</span><i /><span>SOURCE</span><i /><span>VERIFIED</span>
      </div>
    );
  return (
    <div className="project-grid__signal project-grid__signal--portfolio" aria-hidden>
      <Bot size={34} /><GitBranch size={18} /><CircleDot size={16} />
    </div>
  );
}

export default function ProjectMedia({
  id,
  name,
  preview,
  poster,
}: {
  id: string;
  name: string;
  preview?: string;
  poster?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);      // in/near viewport → allowed to fetch
  const [active, setActive] = useState(false);  // hovered/focused → allowed to play
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Gate every network request on proximity to the viewport.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  // Play on hover/focus, pause + rewind on leave (frees the decoded frames).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && canHover && !reduced) {
      v.play().catch(() => { }); // autoplay policy / no source yet — stay on the still
    } else if (!v.paused) {
      v.pause();
      v.currentTime = 0;
    }
  }, [active, canHover, reduced]);

  // No asset yet → the CSS-only signal animation (costs no network at all).
  // If there's no preview but we do have a poster, show it.
  if (!preview) {
    if (poster) {
      return (
        <img
          src={poster}
          alt={`${name} poster`}
          loading="lazy"
          decoding="async"
          className="project-grid__media-image"
        />
      );
    }

    return <Signal id={id} />;
  }

  // Still image → the browser's own lazy loading is enough.
  if (!isVideo(preview)) {
    return <img src={preview} alt="" loading="lazy" decoding="async" className="project-grid__media-image" />;
  }

  // With a poster we can defer the video entirely; without one we need the
  // first frame, so metadata is the cheapest thumbnail we can get.
  const shouldStream = near && (!poster || active);

  return (
    <div
      ref={wrapRef}
      className="project-grid__media-video"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <video
        ref={videoRef}
        // Keying on shouldStream forces a fresh element the first time we
        // decide to attach a source, so preload is honoured.
        src={shouldStream ? preview : undefined}
        poster={poster || undefined}
        preload={poster ? "none" : "metadata"}
        muted
        loop
        playsInline
        disablePictureInPicture
        aria-label={`${name} preview`}
        className="project-grid__media-image"
      />
    </div>
  );
}
