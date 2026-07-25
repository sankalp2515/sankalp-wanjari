"use client";

// Scroll-reveal wrapper. Content is visible in SSR markup (SEO-safe):
// the hidden state is only applied client-side by Framer once mounted.

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export default function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  // Subtle 3D tip — content hinges up from just below the viewer's eyeline.
  // Set to 0 for a flat rise (e.g. wide media that shouldn't skew).
  depth = 7,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  depth?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    // Cinematic entrance: content resolves out of depth — it hinges up in 3D,
    // rises, sharpens from a blur, and settles to scale. One shared component
    // = every section on the site gets the same dimensional lens language.
    <motion.div
      className={className}
      style={{ transformPerspective: 1100, transformOrigin: "50% 100%" }}
      initial={{ opacity: 0, y, scale: 0.975, rotateX: depth, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
