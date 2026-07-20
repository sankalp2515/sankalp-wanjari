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
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    // Cinematic entrance: content resolves out of depth — rises, sharpens
    // from a blur, and settles to scale. One shared component = every
    // section on the site gets the same lens language.
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.975, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
