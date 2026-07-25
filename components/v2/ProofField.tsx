"use client";

// A scroll-driven point field for the proof hero. The form moves from a
// concentrated claim, through a visible evidence loop, into a stable verdict.

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import * as THREE from "three";
import { useCanvasVisible } from "@/hooks/useCanvasVisible";

export type EvidenceNodeId = "001" | "002" | "003";
export type FieldTheme = "light" | "dark";
// Deepened accents so nodes read on warm paper (bright originals only work
// against near-black). Dark values are unchanged — dark stays byte-identical.
const NODE_COLORS: Record<FieldTheme, Record<EvidenceNodeId, string>> = {
  dark:  { "001": "#F5A623", "002": "#2DC7B0", "003": "#5FD08A" },
  light: { "001": "#B26A05", "002": "#0B8477", "003": "#2C8F52" },
};
const NODES: { id: EvidenceNodeId; position: [number, number, number]; color: string }[] = [
  { id: "001", position: [1.65, .62, .3], color: "#F5A623" },
  { id: "002", position: [-1.55, .35, .55], color: "#2DC7B0" },
  { id: "003", position: [.05, -1.5, .18], color: "#5FD08A" },
];

function makeSeed(index: number) {
  const value = Math.sin(index * 78.233 + 0.46) * 43758.5453;
  return value - Math.floor(value);
}

// The three evidence nodes wire back to a shared core — the picture is a
// SYSTEM, not scattered points. Edges are dim until their node is selected,
// so choosing a node visibly "activates" that path through the system.
function Edges({ activeId, theme }: { activeId: EvidenceNodeId; theme: FieldTheme }) {
  const refs = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const geoms = useMemo(() => NODES.map((n) =>
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(...n.position),
    ])
  ), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    NODES.forEach((n, i) => {
      const mat = refs.current[i];
      if (!mat) return;
      // Active edge breathes; idle edges stay faint.
      mat.opacity = n.id === activeId ? 0.32 + Math.sin(t * 2.4) * 0.12 : 0.08;
    });
  });
  return <>{NODES.map((n, i) => (
    <lineSegments key={n.id} geometry={geoms[i]}>
      <lineBasicMaterial ref={(m) => { refs.current[i] = m; }} color={NODE_COLORS[theme][n.id]} transparent opacity={0.08} />
    </lineSegments>
  ))}</>;
}

function EvidenceNode({ node, active, onSelect, theme }: {
  node: (typeof NODES)[number]; active: boolean; onSelect: (id: EvidenceNodeId) => void; theme: FieldTheme;
}) {
  const color = NODE_COLORS[theme][node.id];
  const [hovered, setHovered] = useState(false);
  const pulse = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Selected node emits an expanding ring — a live "this is the signal" pulse.
    if (pulse.current) {
      const phase = (t * 0.9) % 1;
      const mat = pulse.current.material as THREE.MeshBasicMaterial;
      if (active) {
        pulse.current.visible = true;
        pulse.current.scale.setScalar(0.6 + phase * 1.9);
        mat.opacity = (1 - phase) * 0.5;
      } else {
        pulse.current.visible = false;
      }
    }
    // Idle nodes gently invite a click; hover/active hold steady and bright.
    if (core.current) {
      const s = active ? 1.42 : hovered ? 1.25 : 1 + Math.sin(t * 1.6 + node.position[0]) * 0.08;
      core.current.scale.setScalar(s);
    }
  });
  return (
    <group position={node.position}>
      <mesh
        ref={core}
        onClick={(event) => { event.stopPropagation(); onSelect(node.id); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ""; }}
      >
        <sphereGeometry args={[.1, 20, 20]} />
        <meshBasicMaterial color={color} transparent opacity={active || hovered ? 1 : .7} />
      </mesh>
      <mesh rotation={[1.1, .2, 0]}>
        <torusGeometry args={[active ? .26 : .18, .008, 6, 48]} />
        <meshBasicMaterial color={color} transparent opacity={active ? .95 : .4} />
      </mesh>
      <mesh ref={pulse} rotation={[1.1, .2, 0]} visible={false}>
        <torusGeometry args={[.22, .006, 6, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0} />
      </mesh>
    </group>
  );
}

function EvidenceNodes({ activeId, onSelect, theme }: { activeId: EvidenceNodeId; onSelect: (id: EvidenceNodeId) => void; theme: FieldTheme }) {
  const root = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (root.current) root.current.rotation.y += delta * .1; });
  return <group ref={root}>
    <Edges activeId={activeId} theme={theme} />
    {NODES.map((node) => (
      <EvidenceNode key={node.id} node={node} active={node.id === activeId} onSelect={onSelect} theme={theme} />
    ))}
  </group>;
}

function Field({ progress, thinking, activeId, onSelect, theme }: { progress: React.MutableRefObject<number>; thinking: React.MutableRefObject<boolean>; activeId: EvidenceNodeId; onSelect: (id: EvidenceNodeId) => void; theme: FieldTheme }) {
  const cloud = useRef<THREE.Points>(null);
  const target = useRef(new THREE.Vector3());
  const think = useRef(0); // eased 0→1 "thinking" intensity
  const points = useMemo(() => {
    const count = 2800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    // Additive blending against black lets bright points glow; on paper it
    // washes to nothing, so light uses normal blending with deepened colors.
    const light = theme === "light";
    for (let i = 0; i < count; i++) {
      const theta = makeSeed(i * 3 + 1) * Math.PI * 2;
      const phi = Math.acos(makeSeed(i * 3 + 2) * 2 - 1);
      const r = Math.cbrt(makeSeed(i * 3 + 3)) * (0.45 + makeSeed(i + 9) * 1.15);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const cyan = makeSeed(i + 77) > .48;
      if (light) {
        colors[i * 3]     = cyan ? .043 : .698; // #0B8477 / #B26A05
        colors[i * 3 + 1] = cyan ? .518 : .416;
        colors[i * 3 + 2] = cyan ? .467 : .020;
      } else {
        colors[i * 3]     = cyan ? .16 : .96;
        colors[i * 3 + 1] = cyan ? .78 : .52;
        colors[i * 3 + 2] = cyan ? .69 : .12;
      }
    }
    return { positions, colors };
  }, [theme]);

  useFrame((state, delta) => {
    if (!cloud.current) return;
    const p = progress.current;
    // Ease the thinking intensity so it swells in and settles out smoothly.
    think.current = THREE.MathUtils.lerp(think.current, thinking.current ? 1 : 0, .08);
    const t = think.current;
    // Claim = dense thought; evidence = a wide inspectable loop; verdict = a
    // stable orbital plane. Pointer influence is intentionally subtle.
    const phase = p < .36 ? 0 : p < .7 ? 1 : 2;
    target.current.set(
      state.pointer.y * .26 + (phase === 1 ? .24 : 0),
      state.pointer.x * .18,
      phase === 2 ? -.42 : 0
    );
    cloud.current.rotation.x = THREE.MathUtils.lerp(cloud.current.rotation.x, target.current.x + p * 1.8, .035);
    // While thinking the field churns noticeably faster — visible cognition.
    cloud.current.rotation.y += delta * (.09 + phase * .09 + t * .9);
    cloud.current.rotation.z = THREE.MathUtils.lerp(cloud.current.rotation.z, target.current.z, .025);
    // A gentle breathing swell on top of the scroll scale while thinking.
    const breathe = t * Math.sin(state.clock.elapsedTime * 3.4) * .06;
    cloud.current.scale.setScalar(1 + p * .42 + t * .12 + breathe);
    const material = cloud.current.material as THREE.PointsMaterial;
    material.opacity = .91 + t * .09;
    material.size = .028 + t * .012;
    const attribute = cloud.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < attribute.count; i++) {
      const seed = makeSeed(i + 1000);
      const theta = seed * Math.PI * 2;
      const sphereX = points.positions[i * 3];
      const sphereY = points.positions[i * 3 + 1];
      const sphereZ = points.positions[i * 3 + 2];
      const ringRadius = 1.55 + (seed - .5) * .42;
      const ringX = Math.cos(theta) * ringRadius;
      const ringY = (makeSeed(i + 3000) - .5) * .18;
      const ringZ = Math.sin(theta) * ringRadius;
      const verdictX = Math.cos(theta) * (1.86 + (seed - .5) * .52);
      const verdictY = (makeSeed(i + 4000) - .5) * .065;
      const verdictZ = Math.sin(theta) * (1.86 + (seed - .5) * .52);
      const evidenceMix = THREE.MathUtils.smoothstep((p - .28) / .42, 0, 1);
      const verdictMix = THREE.MathUtils.smoothstep((p - .67) / .24, 0, 1);
      attribute.setXYZ(i,
        THREE.MathUtils.lerp(THREE.MathUtils.lerp(sphereX, ringX, evidenceMix), verdictX, verdictMix),
        THREE.MathUtils.lerp(THREE.MathUtils.lerp(sphereY, ringY, evidenceMix), verdictY, verdictMix),
        THREE.MathUtils.lerp(THREE.MathUtils.lerp(sphereZ, ringZ, evidenceMix), verdictZ, verdictMix)
      );
    }
    attribute.needsUpdate = true;
  });

  return <>
    <points ref={cloud}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[points.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={.028} sizeAttenuation vertexColors transparent opacity={theme === "light" ? 1 : .91} depthWrite={false} blending={theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending} />
    </points>
    <EvidenceNodes activeId={activeId} onSelect={onSelect} theme={theme} />
  </>;
}

export default function ProofField({ progress, thinking = false, activeId, onSelect, theme = "dark" }: { progress: MotionValue<number>; thinking?: boolean; activeId: EvidenceNodeId; onSelect: (id: EvidenceNodeId) => void; theme?: FieldTheme }) {
  const value = useRef(0);
  useMotionValueEvent(progress, "change", (next) => { value.current = next; });
  // Live ref so the render loop reads the latest thinking state without re-mounting the canvas.
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;
  const { ref, visible } = useCanvasVisible();
  // key on theme so the point cloud (colors baked in useMemo) rebuilds on switch
  return (
    <div ref={ref} className="w-full h-full">
      <Canvas key={theme} camera={{ position: [0, 0, 5.9], fov: 41 }} dpr={[1, 1.5]} frameloop={visible ? "always" : "never"} gl={{ alpha: true, antialias: true }}>
        <Field progress={value} thinking={thinkingRef} activeId={activeId} onSelect={onSelect} theme={theme} />
      </Canvas>
    </div>
  );
}
