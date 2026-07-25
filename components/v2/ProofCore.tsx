"use client";

// The hero's signature object: a physical "proof core" instead of a generic
// particle field. It responds to the visitor and is built from the same ideas
// that define the work: claims, evidence, and a system that holds under load.

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useCanvasVisible } from "@/hooks/useCanvasVisible";

// Theme palettes. `dark` reproduces the original values EXACTLY, so the dark
// experience is byte-identical. `light` swaps the near-black core + additive
// brights (which go muddy / invisible on warm paper) for a crisp metallic
// object with deepened accents that read against cream.
type CorePalette = {
  ringA: string; ringB: string; ringC: string; ringCOpacity: number;
  coreColor: string; coreEmissive: string; coreEmissiveBase: number; coreEmissivePulse: number;
  coreRoughness: number; coreMetalness: number; wire: string;
  keyLight: string; keyBase: number; keyPulse: number; fillLight: string; fillIntensity: number;
  ambient: number; field: string; fieldOpacity: number; sparkle: string;
};
const PALETTES: Record<"dark" | "light", CorePalette> = {
  dark: {
    ringA: "#F5A623", ringB: "#2DC7B0", ringC: "#F8F4E8", ringCOpacity: 0.3,
    coreColor: "#15130F", coreEmissive: "#F5A623", coreEmissiveBase: 0.32, coreEmissivePulse: 0.7,
    coreRoughness: 0.18, coreMetalness: 0.84, wire: "#2DC7B0",
    keyLight: "#F5A623", keyBase: 4, keyPulse: 5, fillLight: "#2DC7B0", fillIntensity: 3,
    ambient: 0.4, field: "#F8F4E8", fieldOpacity: 0.65, sparkle: "#F5A623",
  },
  light: {
    ringA: "#B26A05", ringB: "#0B8477", ringC: "#6B5A3A", ringCOpacity: 0.55,
    coreColor: "#241C12", coreEmissive: "#B26A05", coreEmissiveBase: 0.16, coreEmissivePulse: 0.4,
    coreRoughness: 0.22, coreMetalness: 0.92, wire: "#0B8477",
    keyLight: "#F5A623", keyBase: 2.4, keyPulse: 3, fillLight: "#0B8477", fillIntensity: 1.6,
    ambient: 0.85, field: "#5A4A2E", fieldOpacity: 0.5, sparkle: "#B26A05",
  },
};

function Rings({ pulse, p }: { pulse: number; p: CorePalette }) {
  const root = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringC = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const energy = 1 + pulse * 0.16;
    if (root.current) {
      root.current.rotation.y += delta * (0.16 + pulse * 0.55);
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, state.pointer.y * 0.18, 0.04);
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, -state.pointer.x * 0.12, 0.04);
      root.current.scale.lerp(new THREE.Vector3(energy, energy, energy), 0.08);
    }
    if (ringA.current) ringA.current.rotation.z += delta * (0.56 + pulse * 1.4);
    if (ringB.current) ringB.current.rotation.z -= delta * (0.34 + pulse);
    if (ringC.current) ringC.current.rotation.z += delta * (0.22 + pulse * 0.7);
  });

  return (
    <group ref={root}>
      <mesh rotation={[1.05, 0.18, 0]} ref={ringA}>
        <torusGeometry args={[1.75, 0.016, 10, 128]} />
        <meshBasicMaterial color={p.ringA} transparent opacity={0.78} toneMapped={false} />
      </mesh>
      <mesh rotation={[-0.68, 0.55, 0.25]} ref={ringB}>
        <torusGeometry args={[1.35, 0.021, 10, 128]} />
        <meshBasicMaterial color={p.ringB} transparent opacity={0.72} toneMapped={false} />
      </mesh>
      <mesh rotation={[0.1, -0.92, 0.7]} ref={ringC}>
        <torusGeometry args={[2.15, 0.009, 8, 128]} />
        <meshBasicMaterial color={p.ringC} transparent opacity={p.ringCOpacity} toneMapped={false} />
      </mesh>
      <Float speed={1.5} rotationIntensity={0.24} floatIntensity={0.35}>
        <mesh>
          <icosahedronGeometry args={[0.68, 3]} />
        <meshPhysicalMaterial
          color={p.coreColor}
            emissive={p.coreEmissive}
            emissiveIntensity={p.coreEmissiveBase + pulse * p.coreEmissivePulse}
            roughness={p.coreRoughness}
            metalness={p.coreMetalness}
            transmission={0.18}
            transparent
            opacity={0.94}
          />
        </mesh>
        <mesh scale={0.79}>
          <icosahedronGeometry args={[0.68, 2]} />
          <meshBasicMaterial color={p.wire} wireframe transparent opacity={0.38 + pulse * 0.25} toneMapped={false} />
        </mesh>
      </Float>
      <pointLight color={p.keyLight} intensity={p.keyBase + pulse * p.keyPulse} distance={7} />
      <pointLight color={p.fillLight} intensity={p.fillIntensity} distance={6} position={[1.8, -0.8, 1.8]} />
    </group>
  );
}

function Field({ pulse, p }: { pulse: number; p: CorePalette }) {
  const points = useMemo(() => {
    // Deterministic pseudo-random sequence: stable under React re-renders,
    // yet visually irregular enough for the surrounding evidence field.
    const noise = (n: number) => {
      const value = Math.sin(n * 12.9898) * 43758.5453;
      return value - Math.floor(value);
    };
    const result = new Float32Array(360 * 3);
    for (let i = 0; i < 360; i++) {
      const radius = 1.6 + noise(i + 1) * 2.3;
      const theta = noise(i + 101) * Math.PI * 2;
      const phi = Math.acos(2 * noise(i + 211) - 1);
      result[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      result[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      result[i * 3 + 2] = radius * Math.cos(phi);
    }
    return result;
  }, []);
  const cloud = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (cloud.current) cloud.current.rotation.y += delta * (0.025 + pulse * 0.14);
  });
  return (
    <points ref={cloud}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry>
      <pointsMaterial size={0.022} sizeAttenuation color={p.field} transparent opacity={p.fieldOpacity} depthWrite={false} />
    </points>
  );
}

export default function ProofCore({ pulse, theme = "dark" }: { pulse: number; theme?: "light" | "dark" }) {
  const p = PALETTES[theme];
  const { ref, visible } = useCanvasVisible();
  return (
    <div ref={ref} className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 42 }}
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"} // pause the loop off-screen
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={p.ambient} />
        <Field pulse={pulse} p={p} />
        <Rings pulse={pulse} p={p} />
        <Sparkles count={42} scale={5.5} size={1.3} speed={0.3} color={p.sparkle} />
      </Canvas>
    </div>
  );
}
