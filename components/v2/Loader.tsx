"use client";

// Boot loader — a warp-speed starfield you fly through while the
// site "boots". Shown once per session, then the warp accelerates
// and the overlay wipes away. Skipped for reduced-motion.
//
// The starfield is a 2D canvas (no Three.js cost at boot): each star
// lives in pseudo-3D (x, y, z) flying toward the camera; drawing a
// line from its previous projection to the current one produces the
// streaks, and a translucent background fill each frame leaves the
// motion trails. Streak length grows toward the edges for free via
// perspective division.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { personal } from "@/config/portfolio";

const DURATION_MS = 2200;
const STAR_COUNT = 560;

export default function Loader() {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Canvas loop reads progress from a ref so it never re-renders React
  const progressRef = useRef(0);

  useEffect(() => {
    if (reduced) return;
    if (sessionStorage.getItem("booted") === "1") return;
    // NOTE: "booted" is set on *completion* (below), not here — setting it
    // eagerly made StrictMode's double-effect skip the loader entirely in dev.

    const t0 = performance.now();
    let raf = 0;
    // Defer the first setState past the effect body (avoids the
    // cascading-render lint rule) then drive the count-up on rAF.
    const tick = () => {
      const p = Math.min((performance.now() - t0) / DURATION_MS, 1);
      setShow(true);
      // ease-out so the count feels like it's settling, not racing
      const eased = 1 - Math.pow(1 - p, 2);
      progressRef.current = eased;
      setProgress(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem("booted", "1");
        setTimeout(() => setShow(false), 420);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Warp starfield — runs only while the overlay is up
  useEffect(() => {
    if (!show) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue("--os-bg").trim() || "#0C0B09";
    const tones = [
      css.getPropertyValue("--os-text-secondary").trim() || "#C9BEAC",
      css.getPropertyValue("--os-accent").trim() || "#F5A623",
      css.getPropertyValue("--os-accent-cyan").trim() || "#2DC7B0",
    ];

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h); // opaque base so trail fills accumulate
    };
    resize();
    window.addEventListener("resize", resize);

    type Star = { x: number; y: number; z: number; color: string };
    const spawn = (z?: number): Star => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      // mostly neutral streaks, occasional amber/teal glints
      color: tones[Math.random() < 0.7 ? 0 : Math.random() < 0.5 ? 1 : 2],
      z: z ?? Math.random() * 0.9 + 0.1,
    });
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => spawn());

    let raf = 0;
    const frame = () => {
      // translucent fill instead of clear = motion trails
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.max(w, h) * 0.5;
      // warp accelerates as loading completes — the "jump" at 100%
      const p = progressRef.current;
      const speed = 0.0035 * (1 + 6 * p * p);

      ctx.lineCap = "round";
      for (const s of stars) {
        const pz = s.z;
        s.z -= speed;
        if (s.z <= 0.02) {
          Object.assign(s, spawn(1));
          continue;
        }
        const px = cx + (s.x / pz) * scale;
        const py = cy + (s.y / pz) * scale;
        const nx = cx + (s.x / s.z) * scale;
        const ny = cy + (s.y / s.z) * scale;
        if (nx < -50 || nx > w + 50 || ny < -50 || ny > h + 50) {
          Object.assign(s, spawn(1));
          continue;
        }
        const depth = 1 - s.z; // 0 far → 1 near
        // Center void: streaks fade to nothing near the middle and
        // brighten outward — the "flying out of blackness" depth cue.
        const dx = nx - cx;
        const dy = ny - cy;
        const rNorm = Math.sqrt(dx * dx + dy * dy) / scale;
        const centerFade = Math.min(1, rNorm * 2.1);
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = Math.min(1, depth * 1.4) * 0.8 * centerFade;
        ctx.lineWidth = 0.25 + depth * 1.1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="boot"
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "var(--os-bg)" }}
          aria-hidden
        >
          {/* Starfield */}
          <canvas ref={canvasRef} className="absolute inset-0" />

          {/* Nebula washes — soft brand-color glows breathing in the corners */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              backgroundImage: `
                radial-gradient(closest-side at 12% 18%, color-mix(in srgb, var(--os-accent-cyan) 26%, transparent), transparent 70%),
                radial-gradient(closest-side at 88% 82%, color-mix(in srgb, var(--os-accent) 22%, transparent), transparent 70%)
              `,
              backgroundRepeat: "no-repeat",
              backgroundSize: "70% 70%, 76% 76%",
            }}
          />

          {/* Vignette keeps the center readable */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--os-bg) 55%, transparent) 0%, transparent 45%)",
            }}
          />

          {/* The name — still the monument, now floating in the warp */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative font-display font-bold tracking-tight text-center leading-none"
            style={{ fontSize: "clamp(2.6rem, 8vw, 5.5rem)", color: "var(--os-text)" }}
          >
            {personal.shortName}{" "}
            <span className="text-shimmer">{personal.name.split(" ").slice(-1)[0]}</span>
          </motion.div>

          {/* Counter — quiet, bottom-center, like the reference */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          >
            <div
              className="font-display font-light tabular-nums leading-none tracking-wide"
              style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)", color: "var(--os-text)" }}
            >
              {progress}
              <span className="text-[0.5em] align-super ml-0.5" style={{ color: "var(--os-text-muted)" }}>
                %
              </span>
            </div>
            {/* Progress line — thin track, glowing fill head */}
            <div
              className="relative h-px w-[190px] overflow-visible"
              style={{ background: "color-mix(in srgb, var(--os-text-muted) 22%, transparent)" }}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, transparent, var(--os-accent) 55%, var(--os-accent-cyan))",
                  boxShadow: "0 0 8px color-mix(in srgb, var(--os-accent-cyan) 65%, transparent)",
                }}
              />
            </div>
          </motion.div>

          {/* Film grain — the dithered texture that keeps the void from banding */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
