"use client";

// FirewallScene — the firewall playground as a picture (AWARD_VFX).
//
//   [email] ··words··▶ │Normalise│ ··▶ ◯Detector◯ ··▶ ●Agent● ══tool call══▶ ▌Guard▌ ──▶ out
//
// The email's words travel as particles. Words the visitor added are
// "hostile": they look like the rest until the Normalise gate's scan beam
// passes, then glow red. What happens next follows the real result:
//   detector  the shield ring flares and the hostile words shatter into sparks
//   guard     hostile words slip through, the agent orb turns red (hijacked)
//             and fires a tool-call packet that hits the guard wall and explodes
//   through   everything passes; a red streak leaves the frame and the exit flashes
//   harmless  everything passes; the exit glows green
// `phase` (0–4) is the stage the playground has revealed, so the picture and
// the text stay in step. Canvas 2D; the loop runs only while on screen; under
// reduced motion a still frame of the current state is drawn instead.

import { useEffect, useRef } from "react";

export type SceneOutcome = "detector" | "guard" | "through" | "harmless" | "offline" | null;

type P = { x: number; y: number; vx: number; vy: number; hostile: boolean; revealed: boolean; dead: boolean; r: number; word: string };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const GATES = [0.24, 0.44, 0.64, 0.84]; // x positions (fraction of width)
const LABELS = ["Normalise", "Detect", "Agent", "Guard"];

export default function FirewallScene({ words, hostile, busy, phase, outcome, tool }: {
  words: string[];
  hostile: Set<string>;
  busy: boolean;
  phase: number;
  outcome: SceneOutcome;
  tool?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ busy, phase, outcome, tool, words, hostile });
  useEffect(() => { state.current = { busy, phase, outcome, tool, words, hostile }; }, [busy, phase, outcome, tool, words, hostile]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(cv);
    const C = {
      ink: css.getPropertyValue("--os-text").trim() || "#f2eee6",
      muted: css.getPropertyValue("--os-text-muted").trim() || "#9b9488",
      line: css.getPropertyValue("--os-border").trim() || "#2c2823",
      amber: css.getPropertyValue("--os-accent").trim() || "#f5a623",
      red: "#ff4d4d",
      green: "#3ddc84",
    };
    const sans = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
    const mono = css.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace";
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ps: P[] = [];
    const sparks: Spark[] = [];
    let packet: { x: number; y: number; done: boolean } | null = null;
    let flash = { gate: -1, t: 0, color: C.red };
    let exitGlow = { t: 0, color: C.green };
    let streak: { x: number } | null = null;
    let lastPhase = -1, lastOutcome: SceneOutcome = null, spawnAcc = 0, t = 0, wi = 0;
    let orbHijack = 0, scanX = -1;

    const spawn = () => {
      const s = state.current;
      const list = s.words.length ? s.words : ["…"];
      const word = list[wi++ % list.length];
      const hostileWord = s.hostile.has(word.toLowerCase());
      ps.push({ x: W * 0.07, y: H * 0.5 + (Math.random() - 0.5) * H * 0.42, vx: 0, vy: 0, hostile: hostileWord, revealed: false, dead: false, r: hostileWord ? 3.2 : 2.2, word });
    };
    const burst = (x: number, y: number, color: string, n = 18, speed = 3) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * speed;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color });
      }
    };

    const step = () => {
      const s = state.current;
      t += 1 / 60;
      // Phase events (fire once per change).
      if (s.phase !== lastPhase || s.outcome !== lastOutcome) {
        if (s.phase === 0) { packet = null; streak = null; orbHijack = 0; exitGlow.t = 0; }
        if (s.phase >= 1 && lastPhase < 1) scanX = W * GATES[0];
        if (s.phase >= 2 && lastPhase < 2 && s.outcome === "detector") flash = { gate: 1, t: 1, color: C.red };
        if (s.phase >= 3 && lastPhase < 3 && s.outcome === "guard") { orbHijack = 1; packet = { x: W * GATES[2], y: H * 0.5, done: false }; }
        if (s.phase >= 4 && lastPhase < 4) {
          if (s.outcome === "through") { streak = { x: W * GATES[3] }; exitGlow = { t: 1, color: C.red }; }
          if (s.outcome === "harmless") exitGlow = { t: 1, color: C.green };
        }
        lastPhase = s.phase; lastOutcome = s.outcome;
      }
      // Spawn rate: calm idle stream, a rush while attacking.
      spawnAcc += s.busy ? 0.9 : s.phase > 0 && s.phase < 4 ? 0.5 : 0.18;
      while (spawnAcc >= 1) { spawnAcc -= 1; if (ps.length < 160) spawn(); }

      const detGate = W * GATES[1], guardGate = W * GATES[3];
      for (const p of ps) {
        if (p.dead) continue;
        const target = s.busy ? 2.4 : 1.1;
        p.vx += (target - p.vx) * 0.05;
        p.vy += (H * 0.5 - p.y) * 0.0006 + (Math.random() - 0.5) * 0.08;
        p.vy *= 0.96;
        // Funnel through gate openings.
        for (const g of GATES) {
          const gx = W * g;
          if (Math.abs(p.x - gx) < 30) p.vy += (H * 0.5 - p.y) * 0.004;
        }
        p.x += p.vx; p.y += p.vy;
        if (!p.revealed && p.hostile && p.x > W * GATES[0] && (s.phase >= 1 || s.busy)) p.revealed = true;
        // Detector: when it caught the attack, hostile words shatter at the shield.
        if (p.hostile && s.outcome === "detector" && s.phase >= 2 && p.x > detGate - 8) {
          p.dead = true; burst(p.x, p.y, C.red, 14, 2.6); flash = { gate: 1, t: 1, color: C.red };
        }
        if (p.x > W + 10) p.dead = true;
        // Words stop at the shield once the detector has flagged the email.
        if (s.outcome === "detector" && s.phase >= 2 && p.x > detGate - 4 && p.x < detGate + 4) { p.vx = 0; p.dead = Math.random() < 0.05; if (p.dead) burst(p.x, p.y, C.muted, 4, 1.2); }
        // After the guard blocked, nothing hostile passes the wall.
        if (s.outcome === "guard" && s.phase >= 4 && p.hostile && p.x > guardGate - 6) { p.dead = true; burst(p.x, p.y, C.amber, 10, 2); }
      }
      for (let i = ps.length - 1; i >= 0; i--) if (ps[i].dead) ps.splice(i, 1);

      if (packet && !packet.done) {
        packet.x += 5.2;
        if (packet.x >= guardGate - 10) {
          packet.done = true; burst(guardGate - 10, packet.y, C.red, 46, 5); burst(guardGate - 10, packet.y, C.amber, 30, 3.5);
          flash = { gate: 3, t: 1, color: C.red };
        }
      }
      if (streak) streak.x += 14;
      if (scanX >= 0) { scanX += 9; if (scanX > W * GATES[0] + 40) scanX = -1; }
      for (const sp of sparks) { sp.x += sp.vx; sp.y += sp.vy; sp.vx *= 0.95; sp.vy = sp.vy * 0.95 + 0.04; sp.life -= 0.022; }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
      flash.t *= 0.93; exitGlow.t *= s.phase >= 4 ? 0.995 : 0.9; orbHijack *= 0.999;
    };

    const draw = () => {
      const s = state.current;
      ctx.clearRect(0, 0, W, H);
      const cy = H * 0.5;
      // Track
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(W * 0.07, cy); ctx.lineTo(W * 0.97, cy); ctx.stroke(); ctx.setLineDash([]);
      // Source document
      ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5;
      const dx = W * 0.035, dw = Math.min(34, W * 0.05), dh = dw * 1.3;
      ctx.strokeRect(dx - dw / 2 + 4, cy - dh / 2, dw, dh);
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(dx - dw / 2 + 10, cy - dh / 2 + 9 + i * 8); ctx.lineTo(dx + dw / 2 - 2, cy - dh / 2 + 9 + i * 8); ctx.stroke(); }

      GATES.forEach((g, i) => {
        const gx = W * g;
        const active = s.phase > i || (s.busy && i === 0);
        const fl = flash.gate === i ? flash.t : 0;
        ctx.save();
        if (i === 0) { // scanner gate: two bars + beam
          ctx.strokeStyle = active ? C.ink : C.muted; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(gx, cy - H * 0.36); ctx.lineTo(gx, cy - 18); ctx.moveTo(gx, cy + 18); ctx.lineTo(gx, cy + H * 0.36); ctx.stroke();
          if (scanX >= 0 || s.busy) {
            const bx = scanX >= 0 ? scanX : gx + Math.sin(t * 8) * 8;
            const grd = ctx.createLinearGradient(bx - 30, 0, bx + 6, 0);
            grd.addColorStop(0, "transparent"); grd.addColorStop(1, C.amber);
            ctx.fillStyle = grd; ctx.globalAlpha = 0.35; ctx.fillRect(bx - 30, cy - H * 0.36, 36, H * 0.72); ctx.globalAlpha = 1;
          }
        } else if (i === 1) { // detector: shield ring
          const r = Math.min(H * 0.34, 64);
          ctx.lineWidth = 2 + fl * 6;
          ctx.strokeStyle = fl > 0.05 ? C.red : active ? C.ink : C.muted;
          ctx.shadowColor = C.red; ctx.shadowBlur = fl * 40;
          ctx.beginPath(); ctx.arc(gx, cy, r, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([2, 7]); ctx.lineWidth = 1; ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(gx, cy, r - 10, t * 0.6, t * 0.6 + Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        } else if (i === 2) { // agent orb
          const r = Math.min(H * 0.2, 30) + Math.sin(t * 3) * 1.5;
          const hij = orbHijack;
          const g2 = ctx.createRadialGradient(gx - r * 0.3, cy - r * 0.3, 2, gx, cy, r);
          g2.addColorStop(0, hij > 0.05 ? C.red : active ? C.amber : C.muted);
          g2.addColorStop(1, "transparent");
          ctx.shadowColor = hij > 0.05 ? C.red : C.amber; ctx.shadowBlur = active ? 24 + hij * 30 : 6;
          ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(gx, cy, r, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0; ctx.strokeStyle = hij > 0.05 ? C.red : C.line; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(gx, cy, r + 6, 0, Math.PI * 2); ctx.stroke();
        } else { // guard wall
          const h = H * 0.74;
          ctx.fillStyle = fl > 0.05 ? C.red : active ? C.ink : C.muted;
          ctx.shadowColor = C.red; ctx.shadowBlur = fl * 50;
          for (let k = 0; k < 7; k++) ctx.fillRect(gx - 3, cy - h / 2 + k * (h / 7) + 2, 6, h / 7 - 5);
        }
        ctx.restore();
        ctx.fillStyle = s.phase > i ? C.ink : C.muted;
        ctx.font = `600 ${W < 520 ? 10 : 12}px ${sans}`;
        ctx.textAlign = "center";
        ctx.fillText(`${i + 1}. ${LABELS[i]}`, gx, H - 10);
      });

      // Particles
      for (const p of ps) {
        const hostileShown = p.hostile && p.revealed && s.outcome !== "harmless";
        ctx.fillStyle = hostileShown ? C.red : C.ink;
        ctx.globalAlpha = hostileShown ? 1 : 0.55;
        if (hostileShown) { ctx.shadowColor = C.red; ctx.shadowBlur = 10; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      // Tool-call packet
      if (packet && !packet.done) {
        ctx.save(); ctx.shadowColor = C.red; ctx.shadowBlur = 22; ctx.fillStyle = C.red;
        const label = `${s.tool ?? "tool"}()`;
        ctx.font = `600 11px ${mono}`;
        const tw = ctx.measureText(label).width + 16;
        ctx.fillRect(packet.x - tw / 2, packet.y - 11, tw, 22);
        ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(label, packet.x, packet.y + 4);
        ctx.restore();
      }
      if (streak && streak.x < W + 200) {
        const g3 = ctx.createLinearGradient(streak.x - 160, 0, streak.x, 0);
        g3.addColorStop(0, "transparent"); g3.addColorStop(1, C.red);
        ctx.fillStyle = g3; ctx.fillRect(streak.x - 160, cy - 3, 160, 6);
      }
      if (exitGlow.t > 0.02) {
        const g4 = ctx.createRadialGradient(W * 0.97, cy, 0, W * 0.97, cy, H * 0.6);
        g4.addColorStop(0, exitGlow.color); g4.addColorStop(1, "transparent");
        ctx.globalAlpha = exitGlow.t * 0.6; ctx.fillStyle = g4; ctx.fillRect(W * 0.86, 0, W * 0.14, H); ctx.globalAlpha = 1;
      }
      for (const sp of sparks) {
        ctx.globalAlpha = Math.max(0, sp.life); ctx.fillStyle = sp.color;
        ctx.fillRect(sp.x, sp.y, 2.2, 2.2);
      }
      ctx.globalAlpha = 1;
    };

    if (reduced) {
      for (let i = 0; i < 40; i++) spawn();
      ps.forEach((p, i) => { p.x = W * (0.08 + (i / 40) * 0.86); p.revealed = true; });
      draw();
      return;
    }
    let raf = 0, visible = false;
    const loop = () => { step(); draw(); raf = visible ? requestAnimationFrame(loop) : 0; };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); });
    io.observe(cv);
    const ro = new ResizeObserver(resize); ro.observe(cv);
    return () => { io.disconnect(); ro.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={ref} className="fw__scene" aria-hidden />;
}
