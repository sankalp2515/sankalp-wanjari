"use client";

// A living constellation of Sankalp's skills — each point is a real skill,
// sized larger when it's a core strength, coloured by discipline, and wired
// back to a shared core. It slowly rotates, leans toward the pointer, and any
// node is clickable: the same "ask the concierge for proof" gesture as the
// chips below, but in three dimensions. Variant A only.

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useCanvasVisible } from "@/hooks/useCanvasVisible";
import { skills } from "@/config/portfolio";

const CAT_COLOR: Record<string, string> = {
  "AI/ML": "#F5A623",
  Engineering: "#2DC7B0",
  Product: "#5FD08A",
};

type Placed = { name: string; core: boolean; color: string; pos: [number, number, number] };

// Fibonacci sphere — even, organic distribution of the skill points.
function place(): Placed[] {
  const n = skills.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const R = 1.95;
  return skills.map((s, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    return {
      name: s.name,
      core: s.core,
      color: CAT_COLOR[s.category] ?? "#F5A623",
      pos: [Math.cos(theta) * r * R, y * R, Math.sin(theta) * r * R] as [number, number, number],
    };
  });
}

function Node({ node, onSelect, onHover }: {
  node: Placed; onSelect: (n: string) => void; onHover: (n: string | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const mesh = useRef<THREE.Mesh>(null);
  const base = node.core ? 0.12 : 0.075;
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    // Core skills breathe a little; hover pops the node forward.
    const pulse = node.core ? 1 + Math.sin(clock.elapsedTime * 1.4 + node.pos[0]) * 0.12 : 1;
    mesh.current.scale.setScalar((hovered ? 1.7 : pulse));
  });
  return (
    <group position={node.pos}>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onSelect(node.name); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(node.name); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); onHover(null); document.body.style.cursor = ""; }}
      >
        <sphereGeometry args={[base, 16, 16]} />
        <meshBasicMaterial color={node.color} transparent opacity={hovered ? 1 : node.core ? 0.95 : 0.7} />
      </mesh>
      {hovered && (
        <Html center distanceFactor={9} position={[0, base + 0.2, 0]} zIndexRange={[100, 0]} style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
            padding: "3px 8px", borderRadius: 7, display: "inline-block",
            color: "#fff", background: "rgba(0,0,0,0.72)",
            border: `1px solid ${node.color}`, boxShadow: `0 0 14px ${node.color}66`,
          }}>
            {node.name}
          </span>
        </Html>
      )}
    </group>
  );
}

function Edges({ nodes }: { nodes: Placed[] }) {
  const geoms = useMemo(
    () => nodes.map((n) => new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(...n.pos),
    ])),
    [nodes],
  );
  return <>{nodes.map((n, i) => (
    <lineSegments key={n.name} geometry={geoms[i]}>
      <lineBasicMaterial color={n.color} transparent opacity={n.core ? 0.14 : 0.06} />
    </lineSegments>
  ))}</>;
}

function Constellation({ onSelect, onHover }: { onSelect: (n: string) => void; onHover: (n: string | null) => void }) {
  const root = useRef<THREE.Group>(null);
  const nodes = useMemo(place, []);
  useFrame((state, delta) => {
    if (!root.current) return;
    root.current.rotation.y += delta * 0.12;
    // Lean toward the pointer — the field feels responsive, not on rails.
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, state.pointer.y * -0.25, 0.05);
    root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, state.pointer.x * 0.12, 0.05);
  });
  return (
    <group ref={root}>
      <Edges nodes={nodes} />
      {/* The shared core every skill wires back to */}
      <mesh>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshBasicMaterial color="#F5A623" transparent opacity={0.9} />
      </mesh>
      {nodes.map((n) => <Node key={n.name} node={n} onSelect={onSelect} onHover={onHover} />)}
    </group>
  );
}

export default function SkillConstellation({ onSelect }: { onSelect: (name: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { ref, visible } = useCanvasVisible();
  return (
    <div className="skill-constellation" aria-hidden ref={ref}>
      <Canvas camera={{ position: [0, 0, 5.9], fov: 45 }} dpr={[1, 1.5]} frameloop={visible ? "always" : "never"} gl={{ alpha: true, antialias: true }}>
        <Constellation onSelect={onSelect} onHover={setHovered} />
      </Canvas>
      <div className="skill-constellation__label">
        {hovered ?? "A live map of the stack — hover a node, click to ask where it was used"}
      </div>
    </div>
  );
}
