"use client";

// GraphMode — approach #3: the portfolio as a 3D knowledge graph.
// Same data as the document view, different retrieval strategy:
// center = Sankalp, hubs = sections, leaves = projects / papers /
// roles / credentials / skill clusters. Click a node → info card →
// "Open in portfolio" jumps to the real content.
//
// Lazy-mounted only when opened; shares the three.js chunk with
// NeuralField, so entering graph mode costs no extra vendor weight.

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// Minimal structural type for the OrbitControls instance we drive
interface ControlsLike { target: THREE.Vector3; update: () => void }
import { X, ArrowRight, Play, Square } from "lucide-react";
import { projects, research, experience, education } from "@/config/portfolio";

// ── Starfield: the graph floats in space (engagement, cheaply) ──
const STAR_COUNT = 900;
function makeStars(): Float32Array {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const arr = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    // Distant shell so stars never collide with the graph
    const r = 18 + rand() * 26;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}
const STARS = makeStars();

function Starfield() {
  const ref = useRef<THREE.Points>(null);
  useFrame((_s, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.008; // barely drifting
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[STARS, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} sizeAttenuation transparent opacity={0.55}
        color="#C9BEAC" depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ── Graph data (positions precomputed — no physics engine needed) ──

interface GNode {
  id: string;
  label: string;
  sub?: string;
  desc: string;
  color: string;
  size: number;
  pos: [number, number, number];
  action?: { event: "stage:nav" | "stage:case"; detail: string };
}

const HUB_R = 2.4;
const LEAF_R = 1.35;

function ring(i: number, n: number, r: number, y = 0, phase = 0): [number, number, number] {
  const a = phase + (i / n) * Math.PI * 2;
  return [Math.cos(a) * r, y, Math.sin(a) * r];
}

function around(hub: [number, number, number], i: number, n: number, phase = 0): [number, number, number] {
  const a = phase + (i / n) * Math.PI * 2;
  return [
    hub[0] + Math.cos(a) * LEAF_R,
    hub[1] + (i % 2 === 0 ? 0.45 : -0.45),
    hub[2] + Math.sin(a) * LEAF_R,
  ];
}

function buildGraph(): { nodes: GNode[]; edges: [string, string][] } {
  const AMBER = "#F5A623", TEAL = "#2DC7B0", GREEN = "#5FD08A", ORANGE = "#FF8A5C", INK = "#F8F3EA";

  const hubs: GNode[] = [
    { id: "hub-work", label: "Work", desc: "Three production AI systems.", color: AMBER, size: 0.22, pos: ring(0, 5, HUB_R, 0.3), action: { event: "stage:nav", detail: "work" } },
    { id: "hub-research", label: "Research", desc: "Two peer-reviewed papers (2023).", color: TEAL, size: 0.2, pos: ring(1, 5, HUB_R, -0.2), action: { event: "stage:nav", detail: "research" } },
    { id: "hub-career", label: "Career", desc: "FIS Global + internship.", color: GREEN, size: 0.2, pos: ring(2, 5, HUB_R, 0.25), action: { event: "stage:nav", detail: "arc" } },
    { id: "hub-education", label: "Credentials", desc: "IIIT Pune + BITSoM.", color: ORANGE, size: 0.19, pos: ring(3, 5, HUB_R, -0.3), action: { event: "stage:nav", detail: "education" } },
    { id: "hub-skills", label: "Skills", desc: "AI/ML · Engineering · Product.", color: TEAL, size: 0.19, pos: ring(4, 5, HUB_R, 0.15), action: { event: "stage:nav", detail: "skills" } },
  ];

  const nodes: GNode[] = [
    { id: "me", label: "Sankalp", sub: "AI Engineer · AI PM", desc: "I build AI products — from model to market.", color: INK, size: 0.3, pos: [0, 0, 0] },
    ...hubs,
    ...projects.map((p, i): GNode => ({
      id: `p-${p.id}`, label: p.name, sub: p.year,
      desc: p.description, color: AMBER, size: 0.14,
      pos: around(hubs[0].pos, i, projects.length, 0.6),
      action: { event: "stage:case", detail: p.id },
    })),
    ...research.map((r, i): GNode => ({
      id: r.id, label: r.title.length > 34 ? r.title.slice(0, 32) + "…" : r.title, sub: r.year,
      desc: r.abstract, color: TEAL, size: 0.12,
      pos: around(hubs[1].pos, i, research.length, 1.2),
      action: { event: "stage:nav", detail: "research" },
    })),
    ...experience.map((e, i): GNode => ({
      id: `e-${i}`, label: e.company, sub: e.title,
      desc: e.description, color: GREEN, size: 0.12,
      pos: around(hubs[2].pos, i, experience.length, 2),
      action: { event: "stage:nav", detail: "arc" },
    })),
    {
      id: "edu-degree", label: education.degree.school, sub: "B.E. + AI/ML Honors",
      desc: education.degree.description, color: ORANGE, size: 0.12,
      pos: around(hubs[3].pos, 0, 2, 2.6),
      action: { event: "stage:nav", detail: "education" },
    },
    {
      id: "edu-cert", label: "BITSoM", sub: "AI Product Management",
      desc: education.featuredCert.title, color: ORANGE, size: 0.12,
      pos: around(hubs[3].pos, 1, 2, 2.6),
      action: { event: "stage:nav", detail: "education" },
    },
    ...["AI / ML & Agents", "Engineering & MLOps", "Product"].map((label, i): GNode => ({
      id: `sk-${i}`, label, desc: "Skill cluster — see the full chips in the Skills section.",
      color: TEAL, size: 0.11,
      pos: around(hubs[4].pos, i, 3, 0.4),
      action: { event: "stage:nav", detail: "skills" },
    })),
  ];

  const edges: [string, string][] = [
    ...hubs.map((h): [string, string] => ["me", h.id]),
    ...projects.map((p): [string, string] => ["hub-work", `p-${p.id}`]),
    ...research.map((r): [string, string] => ["hub-research", r.id]),
    ...experience.map((_, i): [string, string] => ["hub-career", `e-${i}`]),
    ["hub-education", "edu-degree"], ["hub-education", "edu-cert"],
    ["hub-skills", "sk-0"], ["hub-skills", "sk-1"], ["hub-skills", "sk-2"],
    // Cross-links — the graph's whole point: relationships
    ["p-001", "sk-0"],       // AutoML ↔ AI/ML cluster
    ["p-003", "sk-1"],       // Portfolio OS ↔ Engineering
    ["e-0", "p-001"],        // FIS experience fed the flagship
    ["edu-cert", "sk-2"],    // BITSoM ↔ Product
    ["p-002", "hub-research"], // Research System ↔ published work mindset
  ];

  return { nodes, edges };
}

// ── 3D pieces ───────────────────────────────────────────────────

function NodeMesh({ node, selected, onSelect }: {
  node: GNode; selected: boolean; onSelect: (n: GNode) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hovered]);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const target = selected ? 1.6 : hovered ? 1.3 : 1;
    m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, target, 0.12));
    if (node.id === "me") {
      m.rotation.y = state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <group position={node.pos}>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[node.size, 1]} />
        <meshBasicMaterial color={node.color} wireframe={node.id === "me"} transparent opacity={selected || hovered ? 1 : 0.85} />
      </mesh>
      {/* Soft glow shell */}
      <mesh scale={1.6}>
        <sphereGeometry args={[node.size, 12, 12]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <Html center distanceFactor={7} style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        position={[0, node.size + 0.22, 0]}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.03em",
          color: selected || hovered ? node.color : "rgba(248,243,234,0.82)",
          textShadow: "0 1px 6px rgba(0,0,0,0.9)",
          transform: "translateZ(0)",
        }}>
          {node.label}
        </div>
      </Html>
    </group>
  );
}

function Edges({ nodes, edges }: { nodes: GNode[]; edges: [string, string][] }) {
  const geom = useMemo(() => {
    const map = new Map(nodes.map((n) => [n.id, n.pos]));
    const verts: number[] = [];
    for (const [a, b] of edges) {
      const pa = map.get(a), pb = map.get(b);
      if (pa && pb) verts.push(...pa, ...pb);
    }
    return new Float32Array(verts);
  }, [nodes, edges]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geom, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#2DC7B0" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
}

// ── Camera rig: flies the camera to whatever the tour points at ──
function CameraRig({
  flyTarget, controlsRef,
}: {
  flyTarget: { pos: THREE.Vector3; look: THREE.Vector3 } | null;
  controlsRef: React.MutableRefObject<ControlsLike | null>;
}) {
  const { camera } = useThree();
  useFrame(() => {
    if (!flyTarget) return;
    camera.position.lerp(flyTarget.pos, 0.045);
    const c = controlsRef.current;
    if (c) {
      c.target.lerp(flyTarget.look, 0.06);
      c.update();
    }
  });
  return null;
}

// ── Graph tour: fly hub to hub, narrating ───────────────────────
const GRAPH_TOUR: { nodeId: string; say: string; holdMs: number }[] = [
  { nodeId: "me", say: "This is the whole portfolio as a knowledge graph — every node is real work.", holdMs: 3600 },
  { nodeId: "hub-work", say: "The Work cluster: three production AI systems, each with a full case study.", holdMs: 4000 },
  { nodeId: "hub-research", say: "Research: two peer-reviewed papers from 2023 — LSTM music generation and sketch-to-HTML.", holdMs: 4000 },
  { nodeId: "hub-career", say: "The career arc: three years at FIS Global, from IT Trainee to Conversion Analyst.", holdMs: 4000 },
  { nodeId: "hub-education", say: "Credentials: AI/ML honors engineering from IIIT Pune, plus BITSoM's AI product management program.", holdMs: 4000 },
  { nodeId: "hub-skills", say: "And the skill clusters that tie it all together. Click any node to go deeper — the controls are yours.", holdMs: 3000 },
];

// ── Overlay ─────────────────────────────────────────────────────

export default function GraphMode({ onClose }: { onClose: () => void }) {
  const { nodes, edges } = useMemo(() => buildGraph(), []);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [tourNarration, setTourNarration] = useState<string | null>(null);
  const [touring, setTouring] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);
  const controlsRef = useRef<ControlsLike | null>(null);
  const tourAbort = useRef(false);

  const stopGraphTour = useCallback(() => {
    tourAbort.current = true;
    setTouring(false);
    setTourNarration(null);
    setFlyTarget(null);
  }, []);

  const startGraphTour = useCallback(() => {
    if (touring) return;
    tourAbort.current = false;
    setTouring(true);
    setSelected(null);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    (async () => {
      for (const step of GRAPH_TOUR) {
        if (tourAbort.current) break;
        const node = byId.get(step.nodeId);
        if (node) {
          const look = new THREE.Vector3(...node.pos);
          // Camera settles slightly above and back from the node
          const dir = look.clone().normalize();
          const pos = look.clone().add(dir.multiplyScalar(2.6)).add(new THREE.Vector3(0, 1.1, 0));
          if (step.nodeId === "me") pos.set(0, 1.8, 5.6);
          setFlyTarget({ pos, look });
          setSelected(node);
        }
        setTourNarration(step.say);
        await new Promise((r) => setTimeout(r, step.holdMs));
      }
      if (!tourAbort.current) {
        setTouring(false);
        setTourNarration(null);
        setFlyTarget(null);
      }
    })();
  }, [touring, nodes]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const openInPortfolio = (n: GNode) => {
    if (!n.action) return;
    onClose();
    // Let the overlay unmount + scroll unlock before navigating
    setTimeout(() => window.dispatchEvent(new CustomEvent(n.action!.event, { detail: n.action!.detail })), 120);
  };

  return (
    <div className="fixed inset-0 z-[1150]" style={{ background: "var(--os-bg)" }} role="dialog" aria-label="Knowledge graph view">
      <Canvas camera={{ position: [0, 1.6, 5.4], fov: 50 }} dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        onPointerMissed={() => { if (!touring) setSelected(null); }}>
        <OrbitControls
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={controlsRef as any}
          enablePan={false}
          minDistance={3}
          maxDistance={12}
          autoRotate={!selected && !touring}
          autoRotateSpeed={0.6}
          dampingFactor={0.08}
          enabled={!touring}
        />
        <CameraRig flyTarget={flyTarget} controlsRef={controlsRef} />
        <Starfield />
        <Edges nodes={nodes} edges={edges} />
        {nodes.map((n) => (
          <NodeMesh key={n.id} node={n} selected={selected?.id === n.id} onSelect={(node) => { if (!touring) setSelected(node); }} />
        ))}
      </Canvas>

      {/* Tour narration bar */}
      {touring && tourNarration && (
        <div
          className="absolute bottom-24 sm:bottom-20 inset-x-0 flex justify-center px-4 pointer-events-none"
          aria-live="polite"
        >
          <div className="max-w-lg text-center text-[13.5px] leading-relaxed px-5 py-3 rounded-2xl border"
            style={{
              background: "color-mix(in srgb, var(--os-bg-window) 92%, transparent)",
              borderColor: "color-mix(in srgb, var(--os-accent-cyan) 35%, var(--os-border))",
              color: "var(--os-text)",
              backdropFilter: "blur(12px)",
              boxShadow: "var(--os-shadow)",
            }}>
            {tourNarration}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 h-16 pointer-events-none">
        <div className="pointer-events-auto">
          <div className="text-[11px] font-mono mono-small tracking-widest" style={{ color: "var(--os-accent)" }}>
            KNOWLEDGE GRAPH
          </div>
          <div className="text-[12px]" style={{ color: "var(--os-text-muted)" }}>
            Same portfolio, different retrieval — drag to orbit, click a node
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={touring ? stopGraphTour : startGraphTour}
            className="flex items-center gap-1.5 text-[12px] font-mono px-3.5 py-2 rounded-xl border transition-colors hover:opacity-85"
            style={{
              borderColor: "color-mix(in srgb, var(--os-accent-cyan) 40%, transparent)",
              color: "var(--os-accent-cyan)",
              background: "color-mix(in srgb, var(--os-accent-cyan) 8%, transparent)",
            }}
          >
            {touring ? <><Square size={11} aria-hidden /> Stop tour</> : <><Play size={11} aria-hidden /> Fly me through</>}
          </button>
          <button
            onClick={onClose}
            aria-label="Exit graph view"
            className="flex items-center gap-1.5 text-[12px] font-mono px-3.5 py-2 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
            style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)", background: "var(--os-bg-surface)" }}
          >
            <X size={13} aria-hidden /> Document view
          </button>
        </div>
      </div>

      {/* Info card for the selected node */}
      {selected && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 sm:left-5 sm:translate-x-0 w-[calc(100%-2.5rem)] sm:w-[340px] rounded-2xl border p-4"
          style={{
            background: "color-mix(in srgb, var(--os-bg-window) 96%, transparent)",
            borderColor: `color-mix(in srgb, ${selected.color} 40%, var(--os-border))`,
            boxShadow: "var(--os-shadow)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: selected.color }} aria-hidden />
            <span className="text-[14px] font-semibold" style={{ color: "var(--os-text)" }}>{selected.label}</span>
            {selected.sub && (
              <span className="text-[10.5px] font-mono" style={{ color: "var(--os-text-muted)" }}>· {selected.sub}</span>
            )}
          </div>
          <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--os-text-secondary)" }}>
            {selected.desc.length > 180 ? selected.desc.slice(0, 178) + "…" : selected.desc}
          </p>
          {selected.action && (
            <button
              onClick={() => openInPortfolio(selected)}
              className="flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-lg border transition-all hover:-translate-y-0.5"
              style={{
                borderColor: `color-mix(in srgb, ${selected.color} 45%, transparent)`,
                color: selected.color,
                background: `color-mix(in srgb, ${selected.color} 9%, transparent)`,
              }}
            >
              Open in portfolio <ArrowRight size={11} aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
