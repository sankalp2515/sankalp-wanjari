"use client";

// IntroShutter — the first-visit intro (AWARD_VFX), once per session.
// An ink screen; the name decodes out of scrambled glyphs with an amber scan
// line under it; then the screen breaks into tiles that fall away in a wave
// from the centre, revealing the hero. ~1.9 s, pointer-events none, removed
// when done. It is an overlay, never a transform or opacity on the page, so
// the hero's first paint is not held back. Skipped under reduced motion and
// on every visit after the first (the "ap-first" class from THEME_BOOT).

import { useEffect, useRef, useState } from "react";

const NAME = "SANKALP";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$/<>[]{}";
// The template re-mounts on every navigation; play only once per page load.
let played = false;

export default function IntroShutter() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (played || !root.classList.contains("ap-first") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setOn(false));
      return () => cancelAnimationFrame(id);
    }
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    played = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(root);
    const amber = css.getPropertyValue("--os-accent").trim() || "#f5a623";
    const INK = "#0e0d0b", PAPER = "#f2eee6";
    const display = getComputedStyle(document.body).getPropertyValue("--font-display").trim() || "system-ui";

    const size = Math.max(36, Math.min(W / 14, 104));
    const cols = Math.ceil(W / size), rows = Math.ceil(H / size);
    const tiles: { x: number; y: number; d: number; rot: number }[] = [];
    const cx = W / 2, cy = H / 2, maxD = Math.hypot(cx, cy);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * size, y = r * size;
      tiles.push({ x, y, d: Math.hypot(x + size / 2 - cx, y + size / 2 - cy) / maxD, rot: (Math.random() - 0.5) * 0.9 });
    }

    const DECODE = 900, SHATTER = 950;
    const t0 = performance.now();
    let raf = 0;
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);

    const frame = (now: number) => {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      if (t < DECODE) {
        ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
        const fs = Math.min(W / 6.5, 150);
        ctx.font = `800 ${fs}px ${display}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const settled = Math.floor((t / DECODE) * (NAME.length + 2));
        const text = NAME.split("").map((ch, i) => (i < settled - 1 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join("");
        ctx.fillStyle = PAPER; ctx.fillText(text, cx, cy);
        const lw = ease(Math.min(1, t / (DECODE * 0.8))) * Math.min(W * 0.5, 520);
        ctx.fillStyle = amber; ctx.fillRect(cx - lw / 2, cy + fs * 0.62, lw, 3);
        ctx.fillStyle = "rgba(242,238,230,.55)"; ctx.font = `500 13px ${getComputedStyle(document.body).fontFamily}`;
        ctx.fillText(t > DECODE * 0.55 ? "AI PRODUCT ENGINEER" : "", cx, cy + fs * 0.62 + 28);
      } else {
        const k = (t - DECODE) / SHATTER;
        if (k >= 1) { setOn(false); return; }
        for (const tl of tiles) {
          const local = Math.min(1, Math.max(0, (k - tl.d * 0.55) / 0.45));
          if (local >= 1) continue;
          const e = ease(local);
          ctx.save();
          ctx.translate(tl.x + size / 2, tl.y + size / 2 + e * size * 1.6);
          ctx.rotate(tl.rot * e);
          const s = 1 - e * 0.85;
          ctx.scale(s, s);
          ctx.fillStyle = INK; ctx.globalAlpha = 1 - e;
          ctx.fillRect(-size / 2 - 0.5, -size / 2 - 0.5, size + 1, size + 1);
          if (local > 0 && local < 0.35) { ctx.strokeStyle = amber; ctx.globalAlpha = 0.6 * (1 - local / 0.35); ctx.strokeRect(-size / 2, -size / 2, size, size); }
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!on) return null;
  return <canvas ref={ref} className="ap-shutter" aria-hidden />;
}
