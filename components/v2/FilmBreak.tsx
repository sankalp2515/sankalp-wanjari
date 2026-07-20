"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function FilmBreak({ index, lines, note }: { index: string; lines: [string, string]; note: string }) {
  const reduced = useReducedMotion();
  return (
    <section className="film-break">
      <motion.div
        initial={reduced ? undefined : { opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="film-break__index">{index} / STATEMENT</span>
        <h2><span>{lines[0]}</span><strong>{lines[1]}</strong></h2>
        <p>{note}</p>
      </motion.div>
    </section>
  );
}
