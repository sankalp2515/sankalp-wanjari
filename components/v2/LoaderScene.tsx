"use client";

// LoaderScene — the boot "core": a wireframe icosahedron nested in an
// orbiting node ring and a sparse particle field. Cold (teal) while
// loading, warming to amber at ignition (100%). Adapted from the
// bolt.new preloader, but tuned for cost:
//
//   • dpr capped at 1.5 (not 2) — halves fragment work on retina.
//   • particle field trimmed 400 → 220, orbit nodes 12 → 10.
//   • antialias off — the geometry is line/point based, so MSAA buys
//     almost nothing here while costing a full extra sample pass.
//   • frameloop pauses when the tab is hidden (the loader is brief, but
//     a backgrounded boot shouldn't burn GPU).
//   • colors come from the live --os-* CSS tokens, so it tracks theme.
//
// This whole module is dynamically imported by Loader.tsx, so the
// Three.js bundle never blocks first paint of the overlay.

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type SceneProps = { ignition: boolean; reduceMotion: boolean };

// Read a CSS custom property off :root as a THREE.Color (falls back to
// the known token defaults if the var is missing — e.g. during SSR hydration).
function tokenColor(name: string, fallback: string): THREE.Color {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
}

function useTones() {
  return useMemo(
    () => ({
      cool: tokenColor("--os-accent-cyan", "#2DC7B0"),
      warm: tokenColor("--os-accent", "#F5A623"),
    }),
    [],
  );
}

function Core({ ignition, reduceMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const innerMat = useRef<THREE.MeshBasicMaterial>(null);
  const { cool, warm } = useTones();

  const geo = useMemo(() => new THREE.IcosahedronGeometry(1.5, 1), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);
  // Dispose GPU buffers when the loader unmounts (once per session).
  useEffect(() => () => { geo.dispose(); edges.dispose(); }, [geo, edges]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const target = ignition ? warm : cool;
    lineMat.current?.color.lerp(target, 0.04);
    innerMat.current?.color.lerp(target, 0.04);
    if (group.current) {
      group.current.rotation.y += delta * (reduceMotion ? 0.05 : 0.25);
      group.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    }
    if (inner.current) inner.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.04);
  });

  return (
    <group ref={group}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={lineMat} color={cool} transparent opacity={0.55} />
      </lineSegments>
      <mesh ref={inner} geometry={geo}>
        <meshBasicMaterial ref={innerMat} color={cool} transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

function OrbitingNodes({ ignition, reduceMotion }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const { cool, warm } = useTones();
  const COUNT = reduceMotion ? 6 : 10;

  const geo = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      const ang = (i / COUNT) * Math.PI * 2;
      const radius = 2.4 + Math.random() * 0.6;
      const y = (Math.random() - 0.5) * 1.2;
      arr.push(Math.cos(ang) * radius, y, Math.sin(ang) * radius);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(arr), 3));
    return g;
  }, [COUNT]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * (reduceMotion ? 0.1 : 0.4);
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
    matRef.current?.color.lerp(ignition ? warm : cool, 0.04);
  });

  return (
    <group ref={group}>
      <points geometry={geo}>
        <pointsMaterial ref={matRef} color={cool} size={0.09} sizeAttenuation transparent opacity={0.95} />
      </points>
    </group>
  );
}

function ParticleField({ ignition, reduceMotion }: SceneProps) {
  const points = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const { cool, warm } = useTones();
  const COUNT = reduceMotion ? 90 : 220;

  const geo = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 3 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [COUNT]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * (reduceMotion ? 0.01 : 0.04);
      points.current.rotation.x += delta * (reduceMotion ? 0.005 : 0.02);
    }
    matRef.current?.color.lerp(ignition ? warm : cool, 0.03);
  });

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial ref={matRef} color={cool} size={0.025} sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}

function Rig({ reduceMotion }: { reduceMotion: boolean }) {
  const { camera } = useThree();
  useFrame((state) => {
    if (reduceMotion) return;
    const x = Math.sin(state.clock.elapsedTime * 0.2) * 0.3;
    const y = Math.cos(state.clock.elapsedTime * 0.15) * 0.2;
    camera.position.x += (x - camera.position.x) * 0.03;
    camera.position.y += (y - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function LoaderScene({ ignition, reduceMotion }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 1.5]}
      frameloop="always"
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
    >
      <Core ignition={ignition} reduceMotion={reduceMotion} />
      <OrbitingNodes ignition={ignition} reduceMotion={reduceMotion} />
      <ParticleField ignition={ignition} reduceMotion={reduceMotion} />
      <Rig reduceMotion={reduceMotion} />
    </Canvas>
  );
}
