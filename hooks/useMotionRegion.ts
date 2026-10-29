"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePageRenderingActive } from "@/lib/renderActivity";

/** Keep decorative loops on screen; never remove their content or alter layout. */
export function useMotionRegion<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const visible = useInView(ref, { margin: "150px" });
  const pageActive = usePageRenderingActive();
  const reduced = useReducedMotion();
  return { ref, active: visible && pageActive && !reduced };
}
