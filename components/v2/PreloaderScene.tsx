"use client";

// PreloaderScene — the boot "core" behind the HELIOS preloader: a
// noise-displaced fresnel shell, an orbiting knowledge-graph (nodes +
// edges + packets travelling the edges), and a dust field. Cold (sky)
// while loading, warming to gold at ignition.
//
// The visual design is taken verbatim from the supplied preloader. What
// changed here is only *how it runs*, because the original was written as
// one big component-local effect:
//
//   • Dynamically imported by Loader.tsx (ssr:false), so the Three.js
//     bundle never blocks first paint of the overlay.
//   • Real delta time drives every animation. The original advanced a
//     fixed `clock += 0.016` and lerped by a fixed 0.04 per frame, so the
//     whole sequence ran ~2x fast on a 120Hz display and slow on a
//     throttled one. Rotation, ignition warm-up and packet travel are all
//     time-based now, so the boot looks identical on any refresh rate.
//   • rAF stops while the tab is hidden — a backgrounded boot shouldn't
//     burn GPU (and the loader can outlive a tab switch).
//   • No per-frame allocation. The original called
//     `COOL.clone().lerp(GOLD, v)` every frame, minting a Color object
//     per frame; there's one reusable scratch Color instead.
//   • Tier-scaled cost: dpr cap, antialias, core tessellation, graph node
//     count and dust count all scale down on weak devices. The fresnel
//     shader is per-vertex 3D simplex noise, so core detail is the single
//     most expensive knob — detail 4 is 2562 verts, detail 3 is 642.
//   • Teardown forces context loss. `renderer.dispose()` alone leaves the
//     WebGL context (and its buffers) alive; without forceContextLoss the
//     loader leaks a live context for the life of the page.

import { useEffect, useRef } from "react";

import * as THREE from "three";

export type DeviceTier = "low" | "medium" | "high";

type Props = { ignition: boolean; tier: DeviceTier };

const COOL = new THREE.Color("#38bdf8");
const GOLD = new THREE.Color("#D4AF37");

// ============================================================================
// GLSL — 3D fresnel noise core (unchanged from the supplied shader)
// ============================================================================
const fresnelVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uDistort;

  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);
    const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;

    float n = snoise(position * 1.4 + uTime * 0.3);
    vec3 displaced = position + normal * n * uDistort;
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fresnelFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPos;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  uniform float uIgnition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
    vec3 color = mix(uColorA, uColorB, uIgnition);
    float glow = fresnel * 2.2;
    float pulse = 0.5 + 0.5 * sin(uTime * 1.5);
    color += fresnel * pulse * 0.35;
    gl_FragColor = vec4(color * (0.2 + glow * 1.5), glow * 0.95 + 0.05);
  }
`;

// Per-tier cost budget. `low` also drops antialias and pixel ratio, which
// together are worth more than any geometry cut on integrated GPUs.
const BUDGET: Record<DeviceTier, {
  coreDetail: number; nodes: number; flow: number; dust: number; dpr: number; aa: boolean;
}> = {
  low:    { coreDetail: 2, nodes: 8,  flow: 18, dust: 140, dpr: 1,   aa: false },
  medium: { coreDetail: 3, nodes: 12, flow: 28, dust: 260, dpr: 1.5, aa: false },
  high:   { coreDetail: 4, nodes: 16, flow: 35, dust: 380, dpr: 2,   aa: true  },
};

export default function PreloaderScene({ ignition, tier }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Read live inside the loop instead of re-creating the scene on ignition.
  const ignitionRef = useRef(ignition);
  useEffect(() => {
    ignitionRef.current = ignition;
  }, [ignition]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === "undefined") return;

    // The canvas is created here rather than rendered by React, because
    // cleanup calls forceContextLoss() and a canvas element that has had its
    // context force-lost can NEVER acquire another one. With a React-owned
    // canvas, StrictMode's mount → cleanup → mount cycle handed the second
    // mount a permanently dead element, which Chrome paints as a white box
    // with a frowning face. One fresh element per effect run makes teardown
    // and re-entry both safe.
    const canvas = document.createElement("canvas");
    canvas.className = "w-full h-full block";
    host.appendChild(canvas);

    const budget = BUDGET[tier];
    const width = host.clientWidth || 320;
    const height = host.clientHeight || 180;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: budget.aa,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, budget.dpr));
    } catch {
      // No WebGL (blocked, or context limit hit) — the overlay still boots.
      canvas.remove();
      return;
    }

    // 1. Fresnel noise core
    const coreGeo = new THREE.IcosahedronGeometry(1.15, budget.coreDetail);
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: fresnelVertex,
      fragmentShader: fresnelFragment,
      uniforms: {
        uTime: { value: 0 },
        uDistort: { value: 0.08 },
        uColorA: { value: COOL.clone() },
        uColorB: { value: GOLD.clone() },
        uIgnition: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 2. Inner solid
    const innerGeo = new THREE.IcosahedronGeometry(0.9, 2);
    const innerMat = new THREE.MeshBasicMaterial({ color: COOL, transparent: true, opacity: 0.08 });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // 3. Graph nodes & edges
    const nodePts: THREE.Vector3[] = [];
    for (let i = 0; i < budget.nodes; i++) {
      const ang = (i / budget.nodes) * Math.PI * 2 + Math.random() * 0.3;
      const radius = 1.8 + Math.random() * 0.7;
      const y = (Math.random() - 0.5) * 1.2;
      nodePts.push(new THREE.Vector3(Math.cos(ang) * radius, y, Math.sin(ang) * radius));
    }

    const linePos: number[] = [];
    const edgePairs: [number, number][] = [];
    for (let i = 0; i < nodePts.length; i++) {
      const nearest = nodePts
        .map((p, j) => ({ j, d: nodePts[i].distanceTo(p) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      for (const o of nearest) {
        if (o.j > i) {
          linePos.push(
            nodePts[i].x, nodePts[i].y, nodePts[i].z,
            nodePts[o.j].x, nodePts[o.j].y, nodePts[o.j].z,
          );
          edgePairs.push([i, o.j]);
        }
      }
    }

    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: COOL, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending,
    });
    graphGroup.add(new THREE.LineSegments(lineGeo, lineMat));

    // Node points
    const nodeArr = new Float32Array(nodePts.length * 3);
    for (let i = 0; i < nodePts.length; i++) {
      nodeArr[i * 3] = nodePts[i].x;
      nodeArr[i * 3 + 1] = nodePts[i].y;
      nodeArr[i * 3 + 2] = nodePts[i].z;
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodeArr, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: COOL, size: 0.09, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
    });
    graphGroup.add(new THREE.Points(nodeGeo, nodeMat));

    // 4. Data-flow packets riding the edges
    const flowCount = Math.min(budget.flow, Math.max(1, edgePairs.length * 2));
    const flowArr = new Float32Array(flowCount * 3);
    const flowProgress = new Float32Array(flowCount);
    for (let i = 0; i < flowCount; i++) flowProgress[i] = Math.random();
    const flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute("position", new THREE.BufferAttribute(flowArr, 3));
    const flowMat = new THREE.PointsMaterial({
      color: COOL, size: 0.05, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending,
    });
    graphGroup.add(new THREE.Points(flowGeo, flowMat));

    // 5. Dust field
    const dustArr = new Float32Array(budget.dust * 3);
    for (let i = 0; i < budget.dust; i++) {
      const r = 2.8 + Math.random() * 4.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustArr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustArr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      dustArr[i * 3 + 2] = r * Math.cos(phi);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: COOL, size: 0.025, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending,
    });
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    scene.add(dustMesh);

    // Track the element, not the window — the canvas lives in a flex box
    // whose size can change without a window resize.
    const resize = () => {
      const w = host.clientWidth || 320;
      const h = host.clientHeight || 180;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let warm = 0; // eased 0→1 ignition, framerate-independent
    const scratch = new THREE.Color();
    const flowPos = flowGeo.attributes.position.array as Float32Array;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // Clamp dt so a tab-switch or a long GC pause can't teleport the
      // animation forward by seconds.
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      elapsed += dt;

      coreMat.uniforms.uTime.value = elapsed;
      warm = THREE.MathUtils.damp(warm, ignitionRef.current ? 1 : 0, 2.4, dt);
      coreMat.uniforms.uIgnition.value = warm;

      coreMesh.rotation.y = elapsed * 0.15;
      coreMesh.rotation.x = Math.sin(elapsed * 0.1) * 0.1;
      graphGroup.rotation.y = elapsed * 0.25;
      graphGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.12;
      dustMesh.rotation.y = elapsed * 0.03;

      scratch.copy(COOL).lerp(GOLD, warm);
      innerMat.color.copy(scratch);
      lineMat.color.copy(scratch);
      nodeMat.color.copy(scratch);
      flowMat.color.copy(scratch);
      dustMat.color.copy(scratch);

      for (let i = 0; i < flowCount; i++) {
        flowProgress[i] = (flowProgress[i] + dt * 0.72) % 1;
        const [a, b] = edgePairs[i % edgePairs.length];
        const pA = nodePts[a];
        const pB = nodePts[b];
        const t = flowProgress[i];
        flowPos[i * 3] = pA.x + (pB.x - pA.x) * t;
        flowPos[i * 3 + 1] = pA.y + (pB.y - pA.y) * t;
        flowPos[i * 3 + 2] = pA.z + (pB.z - pA.z) * t;
      }
      flowGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      stop();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      flowGeo.dispose();
      flowMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      // dispose() frees Three's caches but keeps the GL context alive;
      // this actually releases it so the boot canvas doesn't count against
      // the browser's context limit for the rest of the session. It also
      // permanently poisons this canvas element — hence discarding it.
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [tier]);

  return <div ref={hostRef} className="w-full h-full" />;
}
