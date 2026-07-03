"use client";

// NeuralField — the hero's signature 3D moment.
// A rotating constellation of nodes and synapses that *physically
// reacts* when the AI concierge is thinking: rotation speeds up,
// colors intensify, signals race along the edges.
//
// Load discipline (this is the ONLY three.js on the site):
// - dynamically imported by the hero, desktop-pointer + no-reduced-motion only
// - unmounted entirely when the hero scrolls out of view
// - fixed buffers, no per-frame allocations

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// The field is a *skill constellation*, not decoration: these concepts
// anchor real nodes, so visitors can read what the network is made of.
const CONCEPTS = ["LangGraph", "RAG", "Evals", "Agents", "Python", "FastAPI", "MLOps", "Product"];

const NODE_COUNT = 150;
const LINK_DIST = 1.12;
const FIELD_RADIUS = 3.3;
const SIGNAL_COUNT = 14; // pulses that travel along edges

// Deterministic pseudo-random (stable field between mounts)
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildField() {
  const rand = mulberry32(42);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    // Spherical shell distribution with jitter — reads as a "mind", not a blob
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const r = FIELD_RADIUS * (0.5 + 0.5 * rand());
    pts.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.7, // slightly flattened
      r * Math.cos(phi)
    ));
  }

  // Split nodes into two tones: amber majority, teal accents
  const amber: number[] = [];
  const teal: number[] = [];
  pts.forEach((v, i) => (i % 4 === 0 ? teal : amber).push(v.x, v.y, v.z));

  // Synapses between near nodes; remember edge endpoints for signals
  const linkVerts: number[] = [];
  const edges: [THREE.Vector3, THREE.Vector3][] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (pts[i].distanceTo(pts[j]) < LINK_DIST) {
        linkVerts.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
        edges.push([pts[i], pts[j]]);
      }
    }
  }

  // Anchor concept labels on well-spread nodes (every ~17th point)
  const labelAnchors: [number, number, number][] = CONCEPTS.map((_, i) => {
    const p = pts[(i * 17 + 5) % pts.length];
    return [p.x, p.y, p.z];
  });

  return {
    amber: new Float32Array(amber),
    teal: new Float32Array(teal),
    linkPositions: new Float32Array(linkVerts),
    edges,
    labelAnchors,
  };
}

interface Signal { edge: number; t: number; speed: number }

function makeSignals(edgeCount: number): Signal[] {
  const rand = mulberry32(7);
  return Array.from({ length: SIGNAL_COUNT }, () => ({
    edge: Math.floor(rand() * Math.max(edgeCount, 1)),
    t: rand(),
    speed: 0.25 + rand() * 0.5,
  }));
}

// The field is deterministic (seeded PRNG) and this module is only ever
// loaded client-side via dynamic import — build once at module scope.
// SIGNALS and SIGNAL_POSITIONS are frame-mutated scratch state, which is
// why they live outside React entirely.
const FIELD = buildField();
const SIGNALS = makeSignals(FIELD.edges.length);
const SIGNAL_POSITIONS = new Float32Array(SIGNAL_COUNT * 3);

const IDLE_NODE = new THREE.Color("#F5A623");
const FIRE_NODE = new THREE.Color("#FFDf9E");
const IDLE_TEAL = new THREE.Color("#2DC7B0");
const FIRE_TEAL = new THREE.Color("#7FFFE8");
const IDLE_LINK = new THREE.Color("#2DC7B0");
const FIRE_LINK = new THREE.Color("#5FE8CE");

function Field({ thinkingRef, thinking }: { thinkingRef: React.MutableRefObject<boolean>; thinking: boolean }) {
  const group = useRef<THREE.Group>(null);
  const amberPts = useRef<THREE.Points>(null);
  const amberHalo = useRef<THREE.Points>(null);
  const tealPts = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const signalPts = useRef<THREE.Points>(null);
  const intensity = useRef(0); // 0 idle → 1 thinking, constant-rate ramp
  const breathePhase = useRef(0);
  const pulsePhase = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  const field = FIELD;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_state, delta) => {
    const g = group.current;
    if (!g) return;

    // Constant-rate ramp (1.1s each way) + smoothstep shaping — the
    // transition takes the same time every time and eases at both ends,
    // instead of the snappy-then-crawling exponential it replaced.
    const target = thinkingRef.current ? 1 : 0;
    const step = delta / 1.1;
    intensity.current += THREE.MathUtils.clamp(target - intensity.current, -step, step);
    const i = intensity.current;
    const k = i * i * (3 - 2 * i); // smoothstep

    // Rotation: slow idle drift, faster when thinking; cursor parallax
    g.rotation.y += delta * (0.07 + k * 0.22);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.current.y * 0.24, 0.04);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, pointer.current.x * 0.14, 0.04);

    // Phase accumulators: frequency changes blend continuously —
    // no phase jump, so speeding up never "snaps" the animation.
    breathePhase.current += delta * (0.6 + k * 1.6);
    pulsePhase.current += delta * (1.4 + k * 2.2);

    const breathe = 1 + Math.sin(breathePhase.current) * (0.02 + k * 0.04);
    g.scale.setScalar(breathe);

    const pulse = 0.5 + 0.5 * Math.sin(pulsePhase.current);

    const am = amberPts.current?.material as THREE.PointsMaterial | undefined;
    if (am) {
      am.size = 0.055 + pulse * 0.02 + k * 0.03;
      am.color.lerpColors(IDLE_NODE, FIRE_NODE, k);
    }
    const ah = amberHalo.current?.material as THREE.PointsMaterial | undefined;
    if (ah) {
      ah.size = 0.16 + pulse * 0.05 + k * 0.1;
      ah.opacity = 0.14 + pulse * 0.05 + k * 0.15;
      ah.color.lerpColors(IDLE_NODE, FIRE_NODE, k);
    }
    const tm = tealPts.current?.material as THREE.PointsMaterial | undefined;
    if (tm) {
      tm.size = 0.06 + pulse * 0.02 + k * 0.03;
      tm.color.lerpColors(IDLE_TEAL, FIRE_TEAL, k);
    }
    const lm = lines.current?.material as THREE.LineBasicMaterial | undefined;
    if (lm) {
      lm.opacity = 0.22 + pulse * 0.06 + k * 0.3;
      lm.color.lerpColors(IDLE_LINK, FIRE_LINK, k);
    }

    // Signals racing along edges — faster and brighter when thinking
    const sp = signalPts.current;
    if (sp && field.edges.length > 0) {
      const buf = SIGNAL_POSITIONS;
      for (let i = 0; i < SIGNALS.length; i++) {
        const s = SIGNALS[i];
        s.t += delta * s.speed * (0.6 + k * 2.4);
        if (s.t > 1) {
          s.t = 0;
          s.edge = (s.edge + 17) % field.edges.length; // hop to another edge
        }
        const [a, b] = field.edges[s.edge];
        buf[i * 3]     = a.x + (b.x - a.x) * s.t;
        buf[i * 3 + 1] = a.y + (b.y - a.y) * s.t;
        buf[i * 3 + 2] = a.z + (b.z - a.z) * s.t;
      }
      sp.geometry.attributes.position.needsUpdate = true;
      const sm = sp.material as THREE.PointsMaterial;
      sm.opacity = 0.7 + k * 0.3;
      sm.size = 0.09 + k * 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* Core amber nodes */}
      <points ref={amberPts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[field.amber, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.055} sizeAttenuation transparent opacity={0.95}
          color="#F5A623" depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {/* Soft halo layer behind the amber nodes — fakes bloom cheaply */}
      <points ref={amberHalo}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[field.amber, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.16} sizeAttenuation transparent opacity={0.14}
          color="#F5A623" depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {/* Teal accent nodes */}
      <points ref={tealPts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[field.teal, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} sizeAttenuation transparent opacity={0.95}
          color="#2DC7B0" depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {/* Synapses */}
      <lineSegments ref={lines}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[field.linkPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial transparent opacity={0.22} color="#2DC7B0"
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      {/* Signals traveling the network */}
      <points ref={signalPts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[SIGNAL_POSITIONS, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} sizeAttenuation transparent opacity={0.7}
          color="#FFFFFF" depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Concept labels — the constellation is made of real skills */}
      {FIELD.labelAnchors.map((pos, idx) => (
        <Html key={CONCEPTS[idx]} position={pos} center distanceFactor={8}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: idx % 2 === 0 ? "#F5A623" : "#2DC7B0",
              opacity: thinking ? 0.9 : 0.4,
              textShadow: "0 1px 8px rgba(0,0,0,0.9)",
              transition: "opacity 1.1s ease",
            }}
          >
            {CONCEPTS[idx]}
          </span>
        </Html>
      ))}
    </group>
  );
}

export default function NeuralField() {
  const thinkingRef = useRef(false);
  const [thinking, setThinking] = useState(false);
  const [visible, setVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  // React to the concierge thinking (same event the aurora uses)
  useEffect(() => {
    const on = (e: Event) => {
      const v = (e as CustomEvent<boolean>).detail;
      thinkingRef.current = v;
      setThinking(v); // drives the DOM-side label fade
    };
    window.addEventListener("agent-typing-change", on);
    return () => window.removeEventListener("agent-typing-change", on);
  }, []);

  // Pause the render loop when the hero is off-screen — zero GPU work while
  // reading, WITHOUT tearing down the WebGL context. Unmount/remount on every
  // scroll churns contexts (heavy GPU-memory cost); a single context that
  // simply stops rendering is far cheaper and leak-free.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Radial clearing: the field thins to near-zero behind the hero's
  // content column and stays dramatic at the edges — legibility without
  // dimming the whole show.
  const clearing =
    "radial-gradient(ellipse 58% 52% at 50% 46%, transparent 22%, rgba(0,0,0,0.45) 46%, black 72%)";

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, WebkitMaskImage: clearing, maskImage: clearing }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 46 }}
        dpr={[1, 1.25]} // lower cap → smaller framebuffer
        frameloop={visible ? "always" : "never"} // pause, don't destroy
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        // CRITICAL: the canvas must never intercept clicks meant for hero
        // content — R3F handles pointer events itself, so disable at the wrapper.
        style={{ opacity: 0.85, pointerEvents: "none" }}
      >
        <Field thinkingRef={thinkingRef} thinking={thinking} />
      </Canvas>
    </div>
  );
}
