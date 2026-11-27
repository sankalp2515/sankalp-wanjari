"use client";

// FieldLens — the background that follows (FX_FIELD, config/awardPass.ts).
//
// The page's paper carries a faint ink dot grid (CSS on <body>, so it is
// printed on the document and scrolls with it). This canvas sits between that
// paper and the content and only ever draws one disc: a lens that trails the
// cursor on a spring. Inside it, the printed dots are covered and redrawn
// pushed outward from the centre, a little larger and darker, with an amber
// core. Outside the lens nothing is drawn, so the cost is ~200 dots a frame,
// and the loop stops as soon as the lens settles. Sections with their own
// background (the ink bands) simply cover it.
//
// Mouse only: touch and reduced motion keep the still grid.

import { useEffect, useRef } from "react";

const GAP = 28;          // must match background-size in globals.css
const R = 190;           // lens radius, CSS px
const PUSH = 16;         // max outward displacement, px

export default function FieldLens() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)").matches) return;
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    let W = 0, H = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    // Colours come from the theme tokens, re-read when the theme flips.
    let paper = "#f2eee6", ink = "20,18,14", amber = "245,166,35";
    const rgb = (c: string) => {
      const m = c.match(/\d+(\.\d+)?/g);
      return m && m.length >= 3 ? `${m[0]},${m[1]},${m[2]}` : null;
    };
    const readColours = () => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;color:var(--os-text);background:var(--os-bg);border-color:var(--os-accent);border-style:solid";
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      paper = cs.backgroundColor || paper;
      ink = rgb(cs.color) ?? ink;
      amber = rgb(cs.borderTopColor) ?? amber;
      probe.remove();
    };
    readColours();
    const mo = new MutationObserver(() => { readColours(); kick(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

    // Spring-follow: the lens trails the pointer, and grows in / shrinks out.
    const tgt = { x: W / 2, y: H / 2, r: 0 };
    const cur = { x: W / 2, y: H / 2, r: 0 };
    let raf = 0, lastY = -1;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (cur.r < 1) return;
      const sy = window.scrollY, sx = window.scrollX;
      const r = cur.r;
      // Cover the printed dots inside the lens with paper.
      ctx.fillStyle = paper;
      ctx.beginPath(); ctx.arc(cur.x, cur.y, r + 1, 0, Math.PI * 2); ctx.fill();
      // The grid's dots sit at (1 + k*GAP) in document space (see CSS).
      const x0 = Math.floor((cur.x - r + sx) / GAP) * GAP + 1 - sx;
      const y0 = Math.floor((cur.y - r + sy) / GAP) * GAP + 1 - sy;
      for (let y = y0; y <= cur.y + r; y += GAP) {
        for (let x = x0; x <= cur.x + r; x += GAP) {
          const dx = x - cur.x, dy = y - cur.y;
          const d = Math.hypot(dx, dy);
          if (d >= r) continue; // outside the disc: the printed dot shows

          const k = 1 - d / r;               // 1 at centre, 0 at the rim
          const e = k * k;
          const push = d > 0.001 ? (PUSH * e * (r / R)) / d : 0;
          const px = x + dx * push, py = y + dy * push;
          const rad = 1 + e * 1.6;
          const core = k > 0.72;
          ctx.fillStyle = core
            ? `rgba(${amber},${(0.35 + (k - 0.72) * 1.6).toFixed(3)})`
            : `rgba(${ink},${(0.09 + e * 0.32).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
        }
      }
    };

    const tick = () => {
      cur.x += (tgt.x - cur.x) * 0.11;
      cur.y += (tgt.y - cur.y) * 0.11;
      cur.r += (tgt.r - cur.r) * 0.09;
      draw();
      lastY = window.scrollY;
      const moving = Math.abs(tgt.x - cur.x) > 0.3 || Math.abs(tgt.y - cur.y) > 0.3 || Math.abs(tgt.r - cur.r) > 0.3;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tgt.x = e.clientX; tgt.y = e.clientY; tgt.r = R;
      kick();
    };
    const onLeave = () => { tgt.r = 0; kick(); };
    // The dots scroll with the paper: redraw on scroll even when the lens is still.
    // (Scroll events fire before rAF in the same frame, so there is no lag.)
    const onScroll = () => { if (window.scrollY !== lastY) kick(); };
    const onResize = () => { size(); kick(); };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="fx-field__lens" aria-hidden />;
}
