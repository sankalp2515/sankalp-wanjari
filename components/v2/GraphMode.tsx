"use client";

// GraphMode v2 — the portfolio as a semantic knowledge graph.
//
// v1 drew a category tree: hubs with leaves hanging off them. Pretty, but it
// only said "these things exist". v2 draws the thing a résumé can never show —
// WHY the parts hold each other up. Every line is a typed relationship
// (GraphEdge) carrying a relation, a strength, and a note explaining itself,
// so clicking a node opens a relationship inspector rather than a popup.
//
// Kept from v1 (deliberately): starfield, orbit controls, static precomputed
// layout (no physics — the graph must be cheap), the three.js architecture it
// shares with NeuralField, node cards, "Open in portfolio", and the guided
// tour. Everything else is new.
//
// Lazy-mounted only when opened; shares the three.js chunk with NeuralField,
// so entering graph mode costs no extra vendor weight.

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { X, ArrowRight, Play, Square, Volume2, VolumeX, Info, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { projects, research, experience, education, graphLinks } from "@/config/portfolio";
import { helios } from "@/lib/voice";
import { GRAPH_TOUR } from "@/lib/cinema/graphTourScript";
import CanvasLifecycle from "./CanvasLifecycle";

// Minimal structural type for the OrbitControls instance we drive
interface ControlsLike { target: THREE.Vector3; update: () => void }

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
    const r = 20 + rand() * 28;
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

// ── Semantic model ──────────────────────────────────────────────

type Relation =
  | "demonstrates"
  | "built_with"
  | "career"
  | "education"
  | "research"
  | "frontend"
  | "backend"
  | "product"
  | "validated_by"
  | "inspired_by";

interface GraphEdge {
  from: string;
  to: string;
  relation: Relation;
  strength: 1 | 2 | 3;
  note: string;
}

type NodeKind = "root" | "hub" | "project" | "research" | "career" | "education" | "capability";

interface GNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  desc: string;
  color: string;
  size: number;
  pos: [number, number, number];
  action?: { event: "stage:nav" | "stage:case"; detail: string };
}

// Palette. Node colours stay close to v1 so the graph still reads as the same
// product; edge colours are new and carry the relationship taxonomy.
const AMBER = "#F5A623";
const TEAL = "#2DC7B0";
const GREEN = "#5FD08A";
const ORANGE = "#FF8A5C";
const VIOLET = "#9B8CFF";
const INK = "#F8F3EA";

// Edge colour + human meaning per relation. This object is the single source
// for both the renderer and the on-screen legend, so they can never drift.
const RELATION_META: Record<Relation, { color: string; label: string; group: string; meaning: string }> = {
  demonstrates: { color: "#F5A623", label: "demonstrates", group: "Product", meaning: "This node is proof of that capability in production." },
  built_with: { color: "#2DC7B0", label: "built with", group: "Engineering", meaning: "The system was built on this capability." },
  career: { color: "#5FD08A", label: "career", group: "Career", meaning: "Professional experience that shaped the work." },
  education: { color: "#FF8A5C", label: "education", group: "Education", meaning: "Formal grounding behind the capability." },
  research: { color: "#9B8CFF", label: "research", group: "Research", meaning: "Published work supporting the claim." },
  frontend: { color: "#6FB7FF", label: "frontend", group: "Engineering", meaning: "Interface and interaction engineering." },
  backend: { color: "#7FE3C7", label: "backend", group: "Engineering", meaning: "Services, data, and runtime engineering." },
  product: { color: "#FFD166", label: "product", group: "Product", meaning: "Strategy, positioning, and outcome thinking." },
  validated_by: { color: "#4ADE80", label: "validated by", group: "Research", meaning: "Evidence — tests, evals, or benchmarks — backs this." },
  inspired_by: { color: "#FF9BD2", label: "inspired by", group: "Research", meaning: "An earlier idea that seeded this one." },
};

// Legend groups, ordered the way the tour tells the story.
const LEGEND_GROUPS: { group: string; relations: Relation[] }[] = [
  { group: "Career", relations: ["career"] },
  { group: "Research", relations: ["research", "validated_by", "inspired_by"] },
  { group: "Education", relations: ["education"] },
  { group: "Product", relations: ["product", "demonstrates"] },
  { group: "Engineering", relations: ["built_with", "backend", "frontend"] },
];

// ── Layout helpers (precomputed — no physics engine needed) ─────

function polar(angleDeg: number, r: number, y: number): [number, number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [Math.cos(a) * r, y, Math.sin(a) * r];
}

/** Evenly spaced ring around a hub, with a gentle vertical wave so a large
 *  ring (the nine capabilities) reads as a sculpted constellation, not a disc. */
function orbit(
  hub: [number, number, number],
  i: number,
  n: number,
  r: number,
  phase = 0,
  wave = 0.42,
): [number, number, number] {
  const a = phase + (i / n) * Math.PI * 2;
  return [
    hub[0] + Math.cos(a) * r,
    hub[1] + Math.sin(a * 2) * wave,
    hub[2] + Math.sin(a) * r,
  ];
}

// The nine capabilities that actually describe the work. Ordered so related
// disciplines sit next to each other around the Skills hub: AI craft first,
// then platform, then engineering, then product.
const CAPABILITIES: { id: string; label: string; desc: string }[] = [
  { id: "cap-agentic", label: "Agentic AI", desc: "Multi-agent orchestration with LangGraph — planning, tool use, self-repair, and hard failure boundaries." },
  { id: "cap-rag", label: "RAG Systems", desc: "Retrieval pipelines with vector search, chunking strategy, and verification gates before anything is claimed as fact." },
  { id: "cap-finetune", label: "LLM Fine-Tuning", desc: "LoRA and DPO training for structured, schema-faithful model outputs." },
  { id: "cap-infra", label: "AI Infrastructure", desc: "Provider fallback, circuit breakers, caching, sandboxed execution, containers, and cost/latency tracing." },
  { id: "cap-eval", label: "Evaluation", desc: "Test harnesses, LLM evaluation gates, and benchmarking — the discipline that turns a demo into a system." },
  { id: "cap-devplat", label: "Developer Platforms", desc: "Tooling other engineers run: local model platforms, SQL optimisation, benchmarking surfaces." },
  { id: "cap-backend", label: "Backend Engineering", desc: "Python, FastAPI, SQL, data pipelines, and enterprise-grade migration tooling." },
  { id: "cap-frontend", label: "Frontend Systems", desc: "Next.js and TypeScript interfaces built for performance and motion, not just layout." },
  { id: "cap-product", label: "Product Strategy", desc: "AI product lifecycle, positioning, and deciding what is worth building at all." },
];

// Legacy skill-cluster ids still referenced by config/portfolio.ts graphLinks.
// Mapping them keeps the config file authoritative without needing an edit.
const LEGACY_SKILL_ALIAS: Record<string, string> = {
  "sk-0": "cap-agentic",
  "sk-1": "cap-infra",
  "sk-2": "cap-product",
};

// ── buildGraph — typed nodes + semantic, de-duplicated edges ────

function buildGraph(): { nodes: GNode[]; edges: GraphEdge[]; adjacency: Map<string, GraphEdge[]> } {
  // Hubs sit on a wide ring with staggered heights so no two clusters ever
  // project onto the same patch of screen. Skills sits further out because it
  // carries nine capabilities and needs the room.
  const HUB_WORK = polar(90, 3.4, 0.65);
  const HUB_RESEARCH = polar(162, 3.4, -0.6);
  const HUB_CAREER = polar(234, 3.4, 0.5);
  const HUB_EDU = polar(306, 3.4, -0.65);
  const HUB_SKILLS = polar(18, 4.3, 0.2);

  const hubs: GNode[] = [
    { id: "hub-work", kind: "hub", label: "Work", desc: "Production AI systems — each one opens a full technical breakdown.", color: AMBER, size: 0.21, pos: HUB_WORK, action: { event: "stage:nav", detail: "work" } },
    { id: "hub-research", kind: "hub", label: "Research", desc: "Two peer-reviewed papers (2023) standing behind the engineering claims.", color: VIOLET, size: 0.2, pos: HUB_RESEARCH, action: { event: "stage:nav", detail: "research" } },
    { id: "hub-career", kind: "hub", label: "Career", desc: "Three years at FIS Global plus an earlier data internship.", color: GREEN, size: 0.2, pos: HUB_CAREER, action: { event: "stage:nav", detail: "arc" } },
    { id: "hub-education", kind: "hub", label: "Credentials", desc: "IIIT Pune AI/ML honours engineering + the BITSoM AI product programme.", color: ORANGE, size: 0.19, pos: HUB_EDU, action: { event: "stage:nav", detail: "education" } },
    { id: "hub-skills", kind: "hub", label: "Capabilities", desc: "Nine capabilities that describe the work — each one wired to the systems that prove it.", color: TEAL, size: 0.2, pos: HUB_SKILLS, action: { event: "stage:nav", detail: "skills" } },
  ];

  const nodes: GNode[] = [
    { id: "me", kind: "root", label: "Sankalp", sub: "AI Engineer · AI PM", desc: "I build AI products — from model to market. Everything on this map connects back here.", color: INK, size: 0.3, pos: [0, 0, 0] },
    ...hubs,
    ...projects.map((p, i): GNode => ({
      id: `p-${p.id}`,
      kind: "project",
      label: p.name,
      sub: `${p.category} · ${p.year}`,
      desc: p.description,
      color: AMBER,
      size: 0.14,
      pos: orbit(HUB_WORK, i, projects.length, 1.65, 0.5, 0.4),
      action: { event: "stage:case", detail: p.id },
    })),
    ...research.map((r, i): GNode => ({
      id: r.id,
      kind: "research",
      label: r.title.length > 34 ? r.title.slice(0, 32) + "…" : r.title,
      sub: `${r.journal} · ${r.year}`,
      desc: r.abstract,
      color: VIOLET,
      size: 0.12,
      pos: orbit(HUB_RESEARCH, i, Math.max(research.length, 2), 1.35, 1.2, 0.32),
      action: { event: "stage:nav", detail: "research" },
    })),
    ...experience.map((e, i): GNode => ({
      id: `e-${i}`,
      kind: "career",
      label: e.company,
      sub: e.title,
      desc: e.description,
      color: GREEN,
      size: 0.12,
      pos: orbit(HUB_CAREER, i, Math.max(experience.length, 2), 1.35, 2, 0.32),
      action: { event: "stage:nav", detail: "arc" },
    })),
    {
      id: "edu-degree",
      kind: "education",
      label: education.degree.school,
      sub: "B.E. + AI/ML Honors",
      desc: education.degree.description,
      color: ORANGE,
      size: 0.12,
      pos: orbit(HUB_EDU, 0, 2, 1.35, 2.6, 0.32),
      action: { event: "stage:nav", detail: "education" },
    },
    {
      id: "edu-cert",
      kind: "education",
      label: "BITSoM",
      sub: "AI Product Management",
      desc: education.featuredCert.description,
      color: ORANGE,
      size: 0.12,
      pos: orbit(HUB_EDU, 1, 2, 1.35, 2.6, 0.32),
      action: { event: "stage:nav", detail: "education" },
    },
    ...CAPABILITIES.map((c, i): GNode => ({
      id: c.id,
      kind: "capability",
      label: c.label,
      desc: c.desc,
      color: TEAL,
      size: 0.115,
      pos: orbit(HUB_SKILLS, i, CAPABILITIES.length, 2.05, 0.25, 0.58),
      action: { event: "stage:nav", detail: "skills" },
    })),
  ];

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Edges go through a Map keyed by an undirected pair, so a relationship
  // declared twice (once here, once in config) is drawn exactly once. The
  // stronger declaration wins — a link's importance is the max of its claims.
  const edgeMap = new Map<string, GraphEdge>();
  const link = (from: string, to: string, relation: Relation, strength: 1 | 2 | 3, note: string) => {
    if (!byId.has(from) || !byId.has(to) || from === to) return; // config can never break the render
    const key = [from, to].sort().join("::");
    const existing = edgeMap.get(key);
    if (existing && existing.strength >= strength) return;
    edgeMap.set(key, { from, to, relation, strength, note });
  };

  // 1. Spine — the root to each hub.
  link("me", "hub-work", "demonstrates", 3, "The work is the argument: six systems that actually run.");
  link("me", "hub-research", "research", 3, "Two published papers put peer review behind the engineering.");
  link("me", "hub-career", "career", 3, "Three years of enterprise delivery is where the reliability instinct came from.");
  link("me", "hub-education", "education", 3, "AI/ML honours engineering plus an executive AI product programme.");
  link("me", "hub-skills", "built_with", 3, "Nine capabilities — every one of them attached to something shipped.");

  // 2. Hubs to their members.
  for (const p of projects) link("hub-work", `p-${p.id}`, "demonstrates", 2, `${p.name} — ${p.category}, ${p.year}.`);
  for (const r of research) link("hub-research", r.id, "research", 2, `Published in ${r.journal}, ${r.year}.`);
  experience.forEach((e, i) => link("hub-career", `e-${i}`, "career", 2, `${e.title} at ${e.company}.`));
  link("hub-education", "edu-degree", "education", 2, "Four years of computer engineering with an AI/ML honours track.");
  link("hub-education", "edu-cert", "education", 2, "Executive certification in Generative & Agentic AI product management.");

  // 3. Capabilities hang off the Skills hub, typed by discipline.
  for (const c of CAPABILITIES) {
    const rel: Relation =
      c.id === "cap-frontend" ? "frontend"
        : c.id === "cap-backend" ? "backend"
          : c.id === "cap-product" ? "product"
            : "built_with";
    link("hub-skills", c.id, rel, 2, c.desc);
  }

  // 4. The point of the whole view — capabilities wired to the systems that
  //    prove them. Every note is a claim you can go and check in the work.
  link("p-001", "cap-agentic", "built_with", 3, "Ten LangGraph agents, one per pipeline stage, with the LLM driving every decision.");
  link("p-001", "cap-infra", "built_with", 2, "Six-provider LLM fallback, circuit breaker with cooldown, and a network-isolated sandbox.");
  link("p-001", "cap-eval", "validated_by", 3, "132 automated tests including a full end-to-end LangGraph harness.");
  link("p-001", "cap-backend", "backend", 2, "FastAPI service with MLflow registry and Prometheus tracing behind it.");

  link("p-002", "cap-rag", "built_with", 3, "Retrieval over Qdrant with a verification gate before anything is stated as fact.");
  link("p-002", "cap-agentic", "built_with", 2, "A research loop that plans, retrieves, and re-checks itself instead of answering once.");
  link("p-002", "cap-eval", "validated_by", 2, "Claims are gated on verification, not on model confidence.");
  link("p-002", "cap-backend", "backend", 2, "FastAPI, PostgreSQL, and Docker carry the pipeline.");

  link("p-003", "cap-finetune", "built_with", 3, "LoRA plus DPO training to make structured outputs schema-faithful.");
  link("p-003", "cap-eval", "validated_by", 2, "Structured-output accuracy is measured, not asserted.");
  link("p-003", "cap-infra", "built_with", 2, "Training and serving wrapped in reproducible, containerised runs.");

  link("p-004", "cap-devplat", "built_with", 3, "A platform other engineers run locally to compare models on their own hardware.");
  link("p-004", "cap-eval", "validated_by", 3, "Benchmarking is the product — latency, quality, and cost side by side.");
  link("p-004", "cap-infra", "built_with", 2, "Local model orchestration, containerised and reproducible.");

  link("p-005", "cap-devplat", "built_with", 3, "An AI developer tool that rewrites and explains slow SQL.");
  link("p-005", "cap-backend", "backend", 2, "Query planning and database internals, not prompt wrapping.");
  link("p-005", "cap-rag", "built_with", 1, "Schema context is retrieved so suggestions are grounded in the real database.");

  link("p-006", "cap-frontend", "frontend", 3, "This interface: Next.js, TypeScript, and motion engineered for performance.");
  link("p-006", "cap-product", "demonstrates", 3, "The portfolio is itself the product argument — you are inside the proof.");
  link("p-006", "cap-agentic", "built_with", 1, "The concierge and guided tour are agentic surfaces, not scripted popups.");

  // 5. Research → capability, and research → the work it stands behind.
  link("paper-001", "cap-finetune", "research", 2, "Sequence modelling with LSTMs — the groundwork for later model-training work.");
  link("paper-002", "cap-devplat", "research", 2, "YOLOv5 plus OCR turning sketches into code — tooling research, published.");
  link("paper-002", "cap-frontend", "inspired_by", 1, "Generating interfaces from sketches is where UI first became a model output.");
  link("edu-degree", "hub-research", "education", 2, "The AI/ML honours track is where the research habit started.");

  // 6. Career → capability. Enterprise engineering is the reliability lineage.
  link("e-0", "cap-backend", "career", 3, "Config-driven PDF extraction across 50+ layouts cut manual entry by 90%.");
  link("e-0", "cap-infra", "career", 2, "Bank data migrations across US and UK — failure was not an abstract concern.");
  link("e-0", "cap-product", "career", 1, "An LLM SQL generator built for an org-wide innovation challenge, pitched as a product.");
  link("e-1", "e-0", "career", 2, "Six months of graduate training became the engineering role.");

  // 7. Education → capability.
  link("edu-degree", "cap-backend", "education", 2, "Computer engineering fundamentals under everything else on this map.");
  link("edu-cert", "cap-product", "education", 3, education.featuredCert.description);
  link("edu-cert", "hub-work", "inspired_by", 1, "The product programme changed how these systems get framed — outcomes before architecture.");

  // 8. Author-declared cross-links from config/portfolio.ts. These are the
  //    ones Sankalp maintains by hand; legacy skill ids are mapped forward.
  for (const l of graphLinks) {
    const from = LEGACY_SKILL_ALIAS[l.from] ?? l.from;
    const to = LEGACY_SKILL_ALIAS[l.to] ?? l.to;
    const a = byId.get(from);
    const b = byId.get(to);
    if (!a || !b) continue;
    const kinds = [a.kind, b.kind];
    const relation: Relation =
      kinds.includes("career") ? "career"
        : kinds.includes("education") ? "education"
          : kinds.includes("research") ? "research"
            : b.id === "hub-research" || a.id === "hub-research" ? "research"
              : "built_with";
    link(from, to, relation, 2, l.note);
  }

  const edges = [...edgeMap.values()];

  const adjacency = new Map<string, GraphEdge[]>();
  for (const e of edges) {
    if (!adjacency.has(e.from)) adjacency.set(e.from, []);
    if (!adjacency.has(e.to)) adjacency.set(e.to, []);
    adjacency.get(e.from)!.push(e);
    adjacency.get(e.to)!.push(e);
  }

  return { nodes, edges, adjacency };
}

// ── 3D pieces ───────────────────────────────────────────────────

function NodeMesh({ node, selected, focused, dimmed, showLabel, onSelect, onHover }: {
  node: GNode;
  selected: boolean;
  focused: boolean;
  dimmed: boolean;
  showLabel: boolean;
  onSelect: (n: GNode) => void;
  onHover: (id: string | null) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => { document.body.style.cursor = ""; };
  }, [hovered]);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const k = 1 - Math.exp(-9 * delta); // frame-rate independent easing
    const target = selected ? 1.65 : hovered || focused ? 1.3 : 1;
    m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, target, k));
    if (node.id === "me") m.rotation.y = state.clock.elapsedTime * 0.4;

    const opa = dimmed ? 0.16 : selected || hovered || focused ? 1 : 0.85;
    if (core.current) core.current.opacity = THREE.MathUtils.lerp(core.current.opacity, opa, k);
    if (glow.current) {
      const pulse = selected ? 0.17 + Math.sin(state.clock.elapsedTime * 2.4) * 0.05 : focused ? 0.15 : 0.09;
      glow.current.opacity = THREE.MathUtils.lerp(glow.current.opacity, dimmed ? 0.02 : pulse, k);
    }
  });

  return (
    <group position={node.pos}>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(node.id); }}
        onPointerOut={() => { setHovered(false); onHover(null); }}
      >
        <icosahedronGeometry args={[node.size, 1]} />
        <meshBasicMaterial ref={core} color={node.color} wireframe={node.id === "me"} transparent opacity={0.85} />
      </mesh>
      {/* Soft glow shell */}
      <mesh scale={1.45}>
        <sphereGeometry args={[node.size, 12, 12]} />
        <meshBasicMaterial ref={glow} color={node.color} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Labels are SCREEN-space, never world-space. distanceFactor would scale
          them with proximity, which turned every close camera pass into a wall
          of overlapping type. Fixed size + a visibility policy keeps the map
          legible at any zoom. Opacity is a CSS transition, not a per-frame
          setState — 28 nodes re-rendering every frame is not free. */}
      <Html center style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        position={[0, node.size + 0.2, 0]} zIndexRange={[40, 0]}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: node.kind === "root" || node.kind === "hub" ? 11 : 10,
          letterSpacing: "0.04em",
          fontWeight: node.kind === "root" || node.kind === "hub" ? 600 : 400,
          opacity: showLabel ? (dimmed ? 0.22 : 1) : 0,
          transition: "opacity 260ms ease, color 200ms ease",
          color: selected || hovered || focused ? node.color : "rgba(248,243,234,0.78)",
          textShadow: "0 1px 8px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)",
          transform: "translateZ(0)",
        }}>
          {node.label}
        </div>
      </Html>
    </group>
  );
}

/**
 * All edges in one draw call. Per-edge colour is written every frame from an
 * eased intensity, which is how "fade everything else" stays cheap: with
 * additive blending, dimming the colour IS dimming the line. Strength sets the
 * base brightness (and a slow pulse on the strongest highlighted links), so a
 * load-bearing relationship reads as heavier than an incidental one.
 */
function EdgeWeb({ nodes, edges, focus, boost }: {
  nodes: GNode[];
  edges: GraphEdge[];
  focus: string | null;
  boost: boolean;
}) {
  const geom = useMemo(() => {
    const posOf = new Map(nodes.map((n) => [n.id, n.pos]));
    const positions = new Float32Array(edges.length * 6);
    const colors = new Float32Array(edges.length * 6);
    edges.forEach((e, i) => {
      const a = posOf.get(e.from)!;
      const b = posOf.get(e.to)!;
      positions.set(a, i * 6);
      positions.set(b, i * 6 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [nodes, edges]);

  useEffect(() => () => geom.dispose(), [geom]);

  const base = useMemo(
    () => edges.map((e) => new THREE.Color(RELATION_META[e.relation].color)),
    [edges],
  );
  const intensity = useRef<Float32Array>(new Float32Array(edges.length));

  useFrame((state, delta) => {
    const attr = geom.getAttribute("color") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const k = 1 - Math.exp(-5.5 * delta);
    const t = state.clock.elapsedTime;

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const connected = !focus || e.from === focus || e.to === focus;
      const weight = 0.42 + e.strength * 0.16;      // strength → base brightness
      let target: number;
      if (!focus) target = weight * (boost ? 1.6 : 1);
      else if (connected) target = Math.min(1.5, weight * 1.85 + (e.strength === 3 ? Math.sin(t * 3) * 0.12 : 0));
      else target = 0.05;

      intensity.current[i] = THREE.MathUtils.lerp(intensity.current[i], target, k);
      const c = base[i];
      const v = intensity.current[i];
      const o = i * 6;
      arr[o] = arr[o + 3] = c.r * v;
      arr[o + 1] = arr[o + 4] = c.g * v;
      arr[o + 2] = arr[o + 5] = c.b * v;
    }
    attr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial vertexColors transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
}

// ── Camera rig: cinematic damped flight ─────────────────────────
function CameraRig({ flyTarget, controlsRef }: {
  flyTarget: { pos: THREE.Vector3; look: THREE.Vector3 } | null;
  controlsRef: React.MutableRefObject<ControlsLike | null>;
}) {
  const { camera } = useThree();
  useFrame((_s, delta) => {
    if (!flyTarget) return;
    // Exponential damping — smooth and identical at 60 or 120fps, where a
    // fixed lerp alpha would fly twice as fast on a high-refresh display.
    camera.position.lerp(flyTarget.pos, 1 - Math.exp(-2.1 * delta));
    const c = controlsRef.current;
    if (c) {
      c.target.lerp(flyTarget.look, 1 - Math.exp(-2.6 * delta));
      c.update();
    }
  });
  return null;
}

/** Frame a node: settle slightly above and outside it, looking straight at it.
 *  Distance scales with the node's importance so hubs get room to breathe. */
function frameNode(node: GNode): { pos: THREE.Vector3; look: THREE.Vector3 } {
  const look = new THREE.Vector3(...node.pos);
  if (node.id === "me") return { pos: new THREE.Vector3(0, 2, 6), look };
  // Stand back far enough that a hub's whole cluster fits the frame — flying
  // in tight looked dramatic but buried the labels in each other.
  const dist = node.kind === "hub" ? 4.1 : node.kind === "capability" ? 3.0 : 3.2;
  const dir = look.clone().normalize();
  const pos = look.clone().add(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, node.kind === "hub" ? 1.5 : 1.1, 0));
  return { pos, look };
}

const OVERVIEW = { pos: new THREE.Vector3(0.5, 4.2, 10.4), look: new THREE.Vector3(0.4, 0, 0.2) };

// The graph tour's data (GraphStep + GRAPH_TOUR) now lives in
// lib/cinema/graphTourScript.ts so the build-time voice generator can import
// the narration without pulling in React/three.js. Every line here is Helios.

// ── Overlay ─────────────────────────────────────────────────────

export default function GraphMode({ onClose }: { onClose: () => void }) {
  const { nodes, edges, adjacency } = useMemo(() => buildGraph(), []);
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const [selected, setSelected] = useState<GNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tourNarration, setTourNarration] = useState<string | null>(null);
  const [tourProg, setTourProg] = useState<{ i: number; n: number } | null>(null);
  const [touring, setTouring] = useState(false);
  const [tourFocus, setTourFocus] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);
  const [boost, setBoost] = useState(false);
  const [showWhy, setShowWhy] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  // On a phone the inspector covers the graph, so it can be collapsed to a
  // pill WITHOUT clearing the selection — the node stays lit and framed, and
  // one tap brings the card back. Desktop ignores this (the card sits in a
  // corner and never blocks the map).
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [showMobileNote, setShowMobileNote] = useState(false);
  const controlsRef = useRef<ControlsLike | null>(null);
  const tourAbort = useRef(false);

  // Hover wins over selection for highlighting — it's the faster gesture.
  const focus = touring ? tourFocus : hovered ?? selected?.id ?? null;

  // Everything one hop from the focus stays lit; the rest fades out.
  const litNodes = useMemo(() => {
    if (!focus) return null;
    const s = new Set<string>([focus]);
    for (const e of adjacency.get(focus) ?? []) { s.add(e.from); s.add(e.to); }
    return s;
  }, [focus, adjacency]);

  // Label policy — the single biggest readability lever. At rest only the
  // root and the five hubs are named, so the graph reads as a constellation
  // instead of a wall of text. Focusing a node names its subgraph and nothing
  // else, which is also what makes hovering feel like an answer.
  const labelled = useCallback(
    (n: GNode) => (litNodes ? litNodes.has(n.id) : n.kind === "root" || n.kind === "hub"),
    [litNodes],
  );

  useEffect(() => {
    setVoiceOn(helios.isEnabled());
    const onVoiceChange = (e: Event) => setVoiceOn(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener("helios-voice-change", onVoiceChange);
    return () => window.removeEventListener("helios-voice-change", onVoiceChange);
  }, []);

  const stopGraphTour = useCallback(() => {
    tourAbort.current = true;
    helios.stop();
    setTouring(false);
    setTourNarration(null);
    setTourProg(null);
    setTourFocus(null);
    setBoost(false);
    setFlyTarget(null);
  }, []);

  const startGraphTour = useCallback(() => {
    if (touring) return;
    // Bless the shared audio element inside this tap — mobile autoplay policy
    // only lets audio started from a user gesture play, and the tour speaks
    // many lines long after the gesture ends.
    helios.unlock();
    tourAbort.current = false;
    setTouring(true);
    setSelected(null);
    setHovered(null);
    (async () => {
      for (let idx = 0; idx < GRAPH_TOUR.length; idx++) {
        if (tourAbort.current) break;
        const step = GRAPH_TOUR[idx];
        const node = nodeById.get(step.nodeId);

        // The tour never opens the inspector — a 380px panel over a moving
        // camera is exactly the clutter this view is trying to avoid. The lit
        // subgraph plus the caption carries it.
        if (step.overview) {
          setTourFocus(null);
          setBoost(true);
          setFlyTarget({ pos: OVERVIEW.pos.clone(), look: OVERVIEW.look.clone() });
        } else if (node) {
          setBoost(false);
          setTourFocus(node.id);
          setFlyTarget(frameNode(node));
        }

        setTourProg({ i: idx + 1, n: GRAPH_TOUR.length });
        setTourNarration(step.say);

        // Sync to the voice when it's on — the caption never outruns the line.
        // Silent mode falls back to a read-speed hold.
        if (helios.isEnabled()) {
          await helios.narrate(step.say, "helios");
          if (tourAbort.current) break;
          await new Promise((r) => setTimeout(r, 700)); // beat between steps
        } else {
          const words = step.say.split(/\s+/).length;
          await new Promise((r) => setTimeout(r, Math.max(step.holdMs, words * 210 + 900)));
        }
      }
      if (!tourAbort.current) {
        setTouring(false);
        setTourNarration(null);
        setTourProg(null);
        setTourFocus(null);
        setBoost(false);
        setFlyTarget(null);
      }
    })();
  }, [touring, nodeById]);

  // Auto-zoom to a clicked node, then hand the camera back to the visitor so
  // orbit controls never feel locked. During the tour the rig owns the camera.
  // A fresh selection always opens the card (un-collapses it).
  useEffect(() => {
    if (touring || !selected) return;
    setInspectorCollapsed(false);
    setFlyTarget(frameNode(selected));
    const t = setTimeout(() => setFlyTarget(null), 1600);
    return () => clearTimeout(t);
  }, [selected, touring]);

  // One-time creative nudge for touch/small screens: the graph is gorgeous on
  // a phone but the tour is built for a big dark room. Shown once per session.
  useEffect(() => {
    const isSmall = typeof window !== "undefined"
      && (window.matchMedia("(max-width: 640px)").matches || window.matchMedia("(pointer: coarse)").matches);
    if (!isSmall) return;
    try { if (sessionStorage.getItem("graph-mobile-note") === "1") return; } catch { /* ignore */ }
    setShowMobileNote(true);
  }, []);

  const dismissMobileNote = useCallback(() => {
    setShowMobileNote(false);
    try { sessionStorage.setItem("graph-mobile-note", "1"); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      helios.stop(); // never keep talking after the overlay is gone
    };
  }, [onClose]);

  const openInPortfolio = (n: GNode) => {
    if (!n.action) return;
    helios.stop();
    onClose();
    // Let the overlay unmount + scroll unlock before navigating
    setTimeout(() => window.dispatchEvent(new CustomEvent(n.action!.event, { detail: n.action!.detail })), 120);
  };

  // ── Relationship inspector data for the selected node ──────────
  const inspector = useMemo(() => {
    if (!selected) return null;
    const rows = (adjacency.get(selected.id) ?? []).map((e) => {
      const otherId = e.from === selected.id ? e.to : e.from;
      return { edge: e, other: nodeById.get(otherId)! };
    }).filter((r) => r.other);
    rows.sort((a, b) => b.edge.strength - a.edge.strength);
    const pick = (...kinds: NodeKind[]) => rows.filter((r) => kinds.includes(r.other.kind));
    return {
      total: rows.length,
      groups: [
        { title: "Capabilities", rows: pick("capability") },
        { title: "Projects", rows: pick("project") },
        { title: "Research", rows: pick("research") },
        { title: "Education", rows: pick("education") },
        { title: "Career", rows: pick("career") },
        { title: "Sections", rows: pick("hub", "root") },
      ].filter((g) => g.rows.length > 0),
    };
  }, [selected, adjacency, nodeById]);

  return (
    // Force dark: the graph is designed for a black void — light theme washes
    // it out. data-theme="dark" re-declares the dark tokens for this subtree.
    <div data-theme="dark" className="fixed inset-0 z-[1150]" style={{ background: "var(--os-bg)" }} role="dialog" aria-label="Knowledge graph view">
      <Canvas camera={{ position: [0, 2.2, 8.2], fov: 50 }} dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        onPointerMissed={() => { if (!touring) setSelected(null); }}>
        <CanvasLifecycle />
        <OrbitControls
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={controlsRef as any}
          enablePan={false}
          minDistance={3.4}
          maxDistance={15}
          autoRotate={!selected && !touring && !hovered}
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.08}
          enabled={!touring}
        />
        <CameraRig flyTarget={flyTarget} controlsRef={controlsRef} />
        <Starfield />
        <EdgeWeb nodes={nodes} edges={edges} focus={focus} boost={boost} />
        {nodes.map((n) => (
          <NodeMesh
            key={n.id}
            node={n}
            selected={selected?.id === n.id}
            focused={focus === n.id}
            dimmed={!!litNodes && !litNodes.has(n.id)}
            showLabel={labelled(n)}
            onSelect={(node) => { if (!touring) setSelected(node); }}
            onHover={(id) => { if (!touring) setHovered(id); }}
          />
        ))}
      </Canvas>

      {/* Tour narration — a lower-third caption with progress. The key on the
          text remounts it, so each line fades in cleanly as the camera moves. */}
      {touring && tourNarration && (
        <div
          className="absolute bottom-24 sm:bottom-20 inset-x-0 flex flex-col items-center gap-2.5 px-4 pointer-events-none"
          aria-live="polite"
        >
          {tourProg && (
            <div className="flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: tourProg.n }).map((_, k) => (
                <span
                  key={k}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: k === tourProg.i - 1 ? 18 : 6,
                    background: k < tourProg.i ? "var(--os-accent-cyan)" : "color-mix(in srgb, var(--os-text) 25%, transparent)",
                  }}
                />
              ))}
            </div>
          )}
          <div
            key={tourNarration}
            className="graph-caption max-w-xl text-center text-[13.5px] leading-relaxed px-5 py-3 rounded-2xl border"
            style={{
              background: "color-mix(in srgb, var(--os-bg-window) 92%, transparent)",
              borderColor: "color-mix(in srgb, var(--os-accent-cyan) 35%, var(--os-border))",
              color: "var(--os-text)",
              backdropFilter: "blur(12px)",
              boxShadow: "var(--os-shadow)",
            }}
          >
            {tourNarration}
          </div>
        </div>
      )}

      {/* Header — on a phone every control collapses to a square icon so the
          row never wraps over the canvas; the labels return at ≥sm. The hint
          line is desktop-only (touch has no hover to hint at anyway). */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between gap-3 px-3 sm:px-5 h-14 sm:h-16 pointer-events-none">
        <div className="pointer-events-auto min-w-0">
          <div className="text-[10.5px] sm:text-[11px] font-mono mono-small tracking-widest" style={{ color: "var(--os-accent)" }}>
            KNOWLEDGE GRAPH
          </div>
          <div className="hidden sm:block text-[12px]" style={{ color: "var(--os-text-muted)" }}>
            Hover a node to name its neighbours · click to read why they connect
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => helios.setEnabled(!voiceOn)}
            aria-label={voiceOn ? "Mute narration" : "Unmute narration"}
            aria-pressed={voiceOn}
            className="grid place-items-center w-9 h-9 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
            style={{
              borderColor: voiceOn ? "color-mix(in srgb, var(--os-accent) 45%, transparent)" : "var(--os-border)",
              color: voiceOn ? "var(--os-accent)" : "var(--os-text-secondary)",
              background: voiceOn ? "color-mix(in srgb, var(--os-accent) 10%, transparent)" : "var(--os-bg-surface)",
            }}
          >
            {voiceOn ? <Volume2 size={15} aria-hidden /> : <VolumeX size={15} aria-hidden />}
          </button>
          <button
            onClick={() => setShowLegend((v) => !v)}
            aria-label="Toggle graph legend"
            aria-pressed={showLegend}
            className="hidden sm:grid place-items-center w-9 h-9 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
            style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)", background: "var(--os-bg-surface)" }}
          >
            <Info size={15} aria-hidden />
          </button>
          <button
            onClick={touring ? stopGraphTour : startGraphTour}
            aria-label={touring ? "Stop tour" : "Play guided tour"}
            className="grid sm:flex place-items-center sm:items-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto text-[12px] font-mono sm:px-3.5 sm:py-2 rounded-xl border transition-colors hover:opacity-85"
            style={{
              borderColor: "color-mix(in srgb, var(--os-accent-cyan) 40%, transparent)",
              color: "var(--os-accent-cyan)",
              background: "color-mix(in srgb, var(--os-accent-cyan) 8%, transparent)",
            }}
          >
            {touring
              ? <><Square size={11} aria-hidden /> <span className="hidden sm:inline">Stop tour</span></>
              : <><Play size={11} aria-hidden /> <span className="hidden sm:inline">Fly me through</span></>}
          </button>
          <button
            onClick={onClose}
            aria-label="Exit graph view"
            className="grid sm:flex place-items-center sm:items-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto text-[12px] font-mono sm:px-3.5 sm:py-2 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
            style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)", background: "var(--os-bg-surface)" }}
          >
            <X size={13} aria-hidden /> <span className="hidden sm:inline">Document view</span>
          </button>
        </div>
      </div>

      {/* Legend — what the edge colours mean. Desktop only; on a phone the
          inspector needs the whole screen more than the key does. */}
      {showLegend && !touring && (
        <div
          className="hidden sm:block absolute top-20 right-5 w-[232px] rounded-2xl border p-3.5"
          style={{
            background: "color-mix(in srgb, var(--os-bg-window) 94%, transparent)",
            borderColor: "var(--os-border)",
            boxShadow: "var(--os-shadow)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono mono-small tracking-widest" style={{ color: "var(--os-accent)" }}>
              EDGE LEGEND
            </span>
            <button onClick={() => setShowLegend(false)} aria-label="Hide legend"
              className="grid place-items-center w-5 h-5 rounded-md transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ color: "var(--os-text-muted)" }}>
              <X size={11} aria-hidden />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {LEGEND_GROUPS.map((g) => (
              <div key={g.group}>
                <div className="text-[9.5px] font-mono tracking-widest mb-1" style={{ color: "var(--os-text-muted)" }}>
                  {g.group.toUpperCase()}
                </div>
                {g.relations.map((rel) => (
                  <div key={rel} className="flex items-center gap-2 py-[2px]">
                    <span className="w-4 h-[2px] rounded-full shrink-0" style={{ background: RELATION_META[rel].color }} aria-hidden />
                    <span className="text-[11px]" style={{ color: "var(--os-text-secondary)" }}>{RELATION_META[rel].label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[10.5px] leading-relaxed mt-2.5 pt-2.5 border-t" style={{ color: "var(--os-text-muted)", borderColor: "var(--os-border)" }}>
            Brighter, thicker-feeling lines are stronger relationships. Hover a node to isolate its subgraph.
          </p>
        </div>
      )}

      {/* Why-this-exists explainer — the product thinking behind the graph.
          Shows until the visitor selects a node or starts the tour. */}
      {!selected && !touring && showWhy && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] sm:w-[440px] rounded-2xl border p-4"
          style={{
            background: "color-mix(in srgb, var(--os-bg-window) 96%, transparent)",
            borderColor: "color-mix(in srgb, var(--os-accent) 32%, var(--os-border))",
            boxShadow: "var(--os-shadow)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <span className="text-[11px] font-mono mono-small tracking-widest" style={{ color: "var(--os-accent)" }}>
              WHY A KNOWLEDGE GRAPH?
            </span>
            <button onClick={() => setShowWhy(false)} aria-label="Dismiss"
              className="grid place-items-center w-6 h-6 -mt-0.5 -mr-0.5 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ color: "var(--os-text-muted)" }}>
              <X size={12} aria-hidden />
            </button>
          </div>
          <p className="text-[12.5px] leading-relaxed mb-2.5" style={{ color: "var(--os-text-secondary)" }}>
            A résumé is a list. Real work is a <strong style={{ color: "var(--os-text)" }}>system</strong> — every
            project draws on specific capabilities, past roles, and research. Here those links are literal and
            <em> typed</em>: each line knows what kind of relationship it is, how load-bearing it is, and why it exists.
          </p>
          <p className="text-[12px]" style={{ color: "var(--os-text-muted)" }}>
            Click any node to open the inspector, or <span style={{ color: "var(--os-accent-cyan)" }}>Fly me through</span> for the narrated story.
          </p>
        </div>
      )}

      {/* Collapsed inspector (mobile) — a slim pill that keeps the node
          selected, lit, and framed while handing the whole screen back to the
          graph. Tap it to bring the full card back. */}
      {selected && inspector && inspectorCollapsed && !touring && (
        <div className="sm:hidden absolute bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)]">
          <button
            onClick={() => setInspectorCollapsed(false)}
            className="w-full flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-left"
            style={{
              background: "color-mix(in srgb, var(--os-bg-window) 92%, transparent)",
              borderColor: `color-mix(in srgb, ${selected.color} 45%, var(--os-border))`,
              boxShadow: "var(--os-shadow)",
              backdropFilter: "blur(14px)",
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selected.color }} aria-hidden />
            <span className="min-w-0 grow">
              <span className="block text-[13px] font-semibold truncate" style={{ color: "var(--os-text)" }}>{selected.label}</span>
              <span className="block text-[10px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                {inspector.total} connection{inspector.total === 1 ? "" : "s"} · tap to expand
              </span>
            </span>
            <ChevronUp size={16} aria-hidden style={{ color: selected.color }} />
            <span
              role="button"
              tabIndex={0}
              aria-label="Close inspector"
              onClick={(e) => { e.stopPropagation(); setSelected(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setSelected(null); } }}
              className="grid place-items-center w-7 h-7 rounded-lg shrink-0"
              style={{ color: "var(--os-text-muted)" }}
            >
              <X size={13} aria-hidden />
            </span>
          </button>
        </div>
      )}

      {/* ── Relationship inspector ──────────────────────────────────
          Not a popup: a panel that answers "what is this connected to, and
          WHY" — grouped by kind, with the note from every GraphEdge. */}
      {selected && inspector && !(inspectorCollapsed && !touring) && (
        <div
          className={`${inspectorCollapsed ? "hidden sm:flex" : "flex"} absolute bottom-5 left-1/2 -translate-x-1/2 sm:left-5 sm:translate-x-0 w-[calc(100%-2.5rem)] sm:w-[382px] max-h-[58vh] sm:max-h-[calc(100vh-8rem)] sm:bottom-5 rounded-2xl border flex-col overflow-hidden`}
          style={{
            background: "color-mix(in srgb, var(--os-bg-window) 97%, transparent)",
            borderColor: `color-mix(in srgb, ${selected.color} 40%, var(--os-border))`,
            boxShadow: "var(--os-shadow)",
            backdropFilter: "blur(14px)",
          }}
        >
          {/* Header */}
          <div className="p-4 pb-3 border-b shrink-0" style={{ borderColor: "var(--os-border)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: selected.color }} aria-hidden />
                  <span className="text-[14px] font-semibold truncate" style={{ color: "var(--os-text)" }}>{selected.label}</span>
                </div>
                <div className="text-[10.5px] font-mono mt-0.5" style={{ color: "var(--os-text-muted)" }}>
                  {selected.sub ? `${selected.sub} · ` : ""}{inspector.total} connection{inspector.total === 1 ? "" : "s"}
                </div>
              </div>
              {!touring && (
                <div className="flex items-center gap-1 shrink-0">
                  {/* Collapse to a pill — phone only; keeps the node selected. */}
                  <button onClick={() => setInspectorCollapsed(true)} aria-label="Collapse inspector"
                    className="sm:hidden grid place-items-center w-7 h-7 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                    style={{ color: "var(--os-text-muted)" }}>
                    <ChevronDown size={15} aria-hidden />
                  </button>
                  <button onClick={() => setSelected(null)} aria-label="Close inspector"
                    className="grid place-items-center w-7 h-7 sm:w-6 sm:h-6 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                    style={{ color: "var(--os-text-muted)" }}>
                    <X size={13} aria-hidden />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[12px] leading-relaxed mt-2" style={{ color: "var(--os-text-secondary)" }}>
              {selected.desc}
            </p>
          </div>

          {/* Connections, grouped — each row carries its own "why". */}
          <div className="overflow-y-auto px-4 py-3 flex flex-col gap-3.5 grow">
            {inspector.groups.map((g) => (
              <div key={g.title}>
                <div className="text-[9.5px] font-mono tracking-widest mb-1.5" style={{ color: "var(--os-text-muted)" }}>
                  {g.title.toUpperCase()} · {g.rows.length}
                </div>
                <div className="flex flex-col gap-1.5">
                  {g.rows.map(({ edge, other }) => {
                    const meta = RELATION_META[edge.relation];
                    return (
                      <button
                        key={`${edge.from}::${edge.to}`}
                        onClick={() => { if (!touring) setSelected(other); }}
                        onMouseEnter={() => { if (!touring) setHovered(other.id); }}
                        onMouseLeave={() => { if (!touring) setHovered(null); }}
                        className="text-left rounded-xl border p-2.5 transition-colors hover:bg-[var(--os-bg-hover)]"
                        style={{ borderColor: `color-mix(in srgb, ${meta.color} 28%, var(--os-border))` }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-3.5 h-[2px] rounded-full shrink-0" style={{ background: meta.color }} aria-hidden />
                          <span className="text-[12px] font-medium truncate" style={{ color: "var(--os-text)" }}>{other.label}</span>
                          <span className="text-[9px] font-mono px-1.5 py-[1px] rounded-md shrink-0 ml-auto"
                            style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-[9px] font-mono mt-[3px] shrink-0" style={{ color: "var(--os-text-muted)" }} aria-hidden>
                            {"●".repeat(edge.strength)}
                          </span>
                          <span className="text-[11.5px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
                            {edge.note}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selected.action && (
            <div className="p-4 pt-3 border-t shrink-0" style={{ borderColor: "var(--os-border)" }}>
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
            </div>
          )}
        </div>
      )}

      {/* Creative desktop nudge — shown once on touch/small screens. Not a
          "your device is unsupported" scold; an invitation. The graph works
          here; the *cinema* wants a bigger room. */}
      {showMobileNote && (
        <div className="absolute inset-0 z-[20] grid place-items-end sm:place-items-center px-4 pb-6 pointer-events-none">
          {/* Scrim so the message reads over the busy starfield. */}
          <button
            aria-label="Dismiss"
            onClick={dismissMobileNote}
            className="absolute inset-0 pointer-events-auto"
            style={{ background: "color-mix(in srgb, var(--os-bg) 55%, transparent)", backdropFilter: "blur(2px)" }}
          />
          <div
            className="relative pointer-events-auto w-full max-w-sm rounded-3xl border p-5 overflow-hidden"
            style={{
              background: "color-mix(in srgb, var(--os-bg-window) 96%, transparent)",
              borderColor: "color-mix(in srgb, var(--os-accent) 38%, var(--os-border))",
              boxShadow: "var(--os-shadow)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Amber glow bleeding from the corner — the site's signature. */}
            <div aria-hidden className="absolute -top-16 -right-16 w-40 h-40 rounded-full"
              style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--os-accent) 34%, transparent), transparent 70%)" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="grid place-items-center w-8 h-8 rounded-xl shrink-0"
                  style={{ color: "var(--os-accent)", background: "color-mix(in srgb, var(--os-accent) 12%, transparent)" }}>
                  <Sparkles size={16} aria-hidden />
                </span>
                <span className="text-[10.5px] font-mono mono-small tracking-widest" style={{ color: "var(--os-accent)" }}>
                  YOU'RE ON THE SMALL SCREEN
                </span>
              </div>
              <p className="text-[14px] leading-relaxed mb-2" style={{ color: "var(--os-text)" }}>
                This graph is <strong>alive on a phone</strong> — pan it, tap a node, trace a line.
              </p>
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--os-text-secondary)" }}>
                But the guided tour was built for a dark room and a wide screen — the camera flies, the
                edges catch light, and the whole system opens up around you. When you can,
                come back on desktop and let it play. <span style={{ color: "var(--os-accent)" }}>It&apos;s a different film.</span>
              </p>
              <button
                onClick={dismissMobileNote}
                className="w-full flex items-center justify-center gap-1.5 text-[13px] font-mono px-4 py-2.5 rounded-xl border transition-colors hover:opacity-90"
                style={{
                  borderColor: "color-mix(in srgb, var(--os-accent) 45%, transparent)",
                  color: "var(--os-accent)",
                  background: "color-mix(in srgb, var(--os-accent) 10%, transparent)",
                }}
              >
                Explore anyway <ArrowRight size={13} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
