"use client";

// The hero's signature object: a physical "proof core" instead of a generic
// particle field. It responds to the visitor and is built from the same ideas
// that define the work: claims, evidence, and a system that holds under load.

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function Rings({ pulse }: { pulse: number }) {
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
        <meshBasicMaterial color="#F5A623" transparent opacity={0.78} toneMapped={false} />
      </mesh>
      <mesh rotation={[-0.68, 0.55, 0.25]} ref={ringB}>
        <torusGeometry args={[1.35, 0.021, 10, 128]} />
        <meshBasicMaterial color="#2DC7B0" transparent opacity={0.72} toneMapped={false} />
      </mesh>
      <mesh rotation={[0.1, -0.92, 0.7]} ref={ringC}>
        <torusGeometry args={[2.15, 0.009, 8, 128]} />
        <meshBasicMaterial color="#F8F4E8" transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <Float speed={1.5} rotationIntensity={0.24} floatIntensity={0.35}>
        <mesh>
          <icosahedronGeometry args={[0.68, 3]} />
        <meshPhysicalMaterial
          color="#15130F"
            emissive="#F5A623"
            emissiveIntensity={0.32 + pulse * 0.7}
            roughness={0.18}
            metalness={0.84}
            transmission={0.18}
            transparent
            opacity={0.94}
          />
        </mesh>
        <mesh scale={0.79}>
          <icosahedronGeometry args={[0.68, 2]} />
          <meshBasicMaterial color="#2DC7B0" wireframe transparent opacity={0.38 + pulse * 0.25} toneMapped={false} />
        </mesh>
      </Float>
      <pointLight color="#F5A623" intensity={4 + pulse * 5} distance={7} />
      <pointLight color="#2DC7B0" intensity={3} distance={6} position={[1.8, -0.8, 1.8]} />
    </group>
  );
}

function Field({ pulse }: { pulse: number }) {
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
      <pointsMaterial size={0.022} sizeAttenuation color="#F8F4E8" transparent opacity={0.65} depthWrite={false} />
    </points>
  );
}

export default function ProofCore({ pulse }: { pulse: number }) {
  return (
    <Canvas camera={{ position: [0, 0, 6.5], fov: 42 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.4} />
      <Field pulse={pulse} />
      <Rings pulse={pulse} />
      <Sparkles count={42} scale={5.5} size={1.3} speed={0.3} color="#F5A623" />
    </Canvas>
  );
}
