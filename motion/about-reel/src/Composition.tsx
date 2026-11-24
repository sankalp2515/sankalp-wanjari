// About reel: Sankalp's cutout inside a slowly turning instrument ring, with
// verified facts surfacing one by one around him. Transparent background, so
// the page's own surface (light or dark theme) shows through. Seamless loop:
// the ring makes exactly one turn per loop and every fact's timing wraps.
//
// Every fact below is taken from config/portfolio.ts; nothing is invented.

import { AbsoluteFill, Composition, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/InterTight";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily } = loadFont("normal", { weights: ["600", "800"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

const FPS = 30;
const LOOP = 12 * FPS; // 360 frames
const W = 1600;
const H = 900;
const CX = W / 2;
const CY = 470;
const R = 330;

const AMBER = "#F5A623";
const INK = "#121110";

// side: which column the chip sits in; y: its vertical slot.
type Fact = { k: string; v: string; side: -1 | 1; y: number };

const FACTS: Fact[] = [
  { k: "IIIT Pune", v: "B.E., Honors in AI/ML", side: -1, y: 250 },
  { k: "FIS Global · 3 yrs", v: "90% less manual entry", side: 1, y: 470 },
  { k: "BITSoM", v: "AI Product Management", side: -1, y: 690 },
  { k: "ET AI Hackathon", v: "2nd nationally", side: 1, y: 250 },
  { k: "SerpApi India", v: "AI Agents track winner", side: -1, y: 470 },
  { k: "HackerRank", v: "7th of 3,062", side: 1, y: 690 },
];

const STEP = LOOP / FACTS.length; // 60 frames between facts
const LIFE = 150; // each fact is on screen for 5 s, so 2–3 overlap

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const FactChip: React.FC<{ fact: Fact; index: number }> = ({ fact, index }) => {
  const frame = useCurrentFrame();
  const local = (frame - index * STEP + LOOP) % LOOP;
  // Anchor where the chip's row meets the ring; the chip sits in its column.
  const dy = fact.y - CY;
  const ax = CX + fact.side * Math.sqrt(Math.max(0, R * R - dy * dy));
  const ay = fact.y;
  // Chips hang off a fixed inner edge, outside the ring.
  const edge = CX + fact.side * (R + 40);
  const chipY = fact.y;
  const lineLeft = Math.min(ax, edge);
  const lineLen = Math.abs(edge - ax);

  const enter = Easing.bezier(0.16, 1, 0.3, 1);
  const visible = local < LIFE;
  if (!visible) return null;

  return (
    <>
      {/* Anchor dot on the ring */}
      <div
        style={{
          position: "absolute",
          left: ax - 9,
          top: ay - 9,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: AMBER,
          boxShadow: `0 0 0 ${interpolate(local, [0, 24], [0, 14], { ...clampOpts })}px rgba(245,166,35,${interpolate(local, [0, 24], [0.45, 0], { ...clampOpts })})`,
          scale: interpolate(local, [0, 10, LIFE - 12, LIFE], [0, 1, 1, 0], { ...clampOpts, easing: enter }),
        }}
      />
      {/* Connector from ring to chip, drawn outward */}
      <div
        style={{
          position: "absolute",
          top: ay - 1,
          left: lineLeft,
          width: lineLen,
          height: 2,
          background: "rgba(245,166,35,.7)",
          transformOrigin: fact.side > 0 ? "left center" : "right center",
          scale: `${interpolate(local, [0, 16, LIFE - 12, LIFE], [0, 1, 1, 0], { ...clampOpts, easing: enter })} 1`,
        }}
      />
      {/* Chip */}
      <div
        style={{
          position: "absolute",
          left: fact.side > 0 ? edge : undefined,
          right: fact.side < 0 ? W - edge : undefined,
          top: chipY,
          translate: "0 -50%",
          padding: "16px 22px",
          borderRadius: 18,
          background: "#FFFFFF",
          color: INK,
          boxShadow: "0 18px 40px -14px rgba(18,17,16,.45), 0 0 0 1px rgba(18,17,16,.08)",
          whiteSpace: "nowrap",
          opacity: interpolate(local, [4, 18, LIFE - 14, LIFE], [0, 1, 1, 0], clampOpts),
          scale: interpolate(local, [4, 22], [0.86, 1], { ...clampOpts, easing: enter }),
          transformOrigin: fact.side > 0 ? "left center" : "right center",
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 22, letterSpacing: "0.04em", textTransform: "uppercase", color: "#6B6459" }}>{fact.k}</div>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 33, letterSpacing: "-0.02em", marginTop: 4 }}>
          {fact.v}
        </div>
        {/* Amber underline that draws in */}
        <div
          style={{
            height: 4,
            borderRadius: 2,
            marginTop: 8,
            background: AMBER,
            width: `${interpolate(local, [16, 40], [0, 100], { ...clampOpts, easing: enter })}%`,
          }}
        />
      </div>
    </>
  );
};

const Ring: React.FC = () => {
  const frame = useCurrentFrame();
  const turn = (frame / LOOP) * 360;
  const ticks = Array.from({ length: 72 });
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(245,166,35,.55)" strokeWidth={2.5} />
      <circle cx={CX} cy={CY} r={R - 34} fill="none" stroke="rgba(245,166,35,.18)" strokeWidth={1.5} strokeDasharray="4 10" />
      <g style={{ transformOrigin: `${CX}px ${CY}px`, rotate: `${turn}deg` }}>
        {ticks.map((_, i) => {
          const a = (i / ticks.length) * Math.PI * 2;
          const long = i % 6 === 0;
          const r1 = R + 10;
          const r2 = R + (long ? 30 : 18);
          return (
            <line
              key={i}
              x1={CX + Math.cos(a) * r1}
              y1={CY + Math.sin(a) * r1}
              x2={CX + Math.cos(a) * r2}
              y2={CY + Math.sin(a) * r2}
              stroke={long ? AMBER : "rgba(245,166,35,.45)"}
              strokeWidth={long ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      {/* A sweeping arc, one lap per loop in the opposite direction */}
      <g style={{ transformOrigin: `${CX}px ${CY}px`, rotate: `${-turn * 2}deg` }}>
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={AMBER}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * R * 0.12} ${2 * Math.PI * R}`}
        />
      </g>
    </svg>
  );
};

export const AboutReel: React.FC = () => {
  const frame = useCurrentFrame();
  // Gentle breathing on the figure, period = loop length.
  const breathe = Math.sin((frame / LOOP) * Math.PI * 2);
  return (
    <AbsoluteFill>
      <Ring />
      <Img
        src={staticFile("sankalp-cutout.png")}
        style={{
          position: "absolute",
          left: CX - 220,
          bottom: 0,
          width: 440,
          translate: `0 ${breathe * 4}px`,
        }}
      />
      {FACTS.map((f, i) => (
        <FactChip key={f.k} fact={f} index={i} />
      ))}
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="AboutReel"
      component={AboutReel}
      durationInFrames={LOOP}
      fps={FPS}
      width={W}
      height={H}
      calculateMetadata={() => ({
        defaultCodec: "vp9",
        defaultVideoImageFormat: "png",
        defaultPixelFormat: "yuva420p",
      })}
    />
  );
};
