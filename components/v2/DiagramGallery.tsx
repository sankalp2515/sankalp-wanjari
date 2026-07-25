"use client";

// Shared visual block for architecture diagrams (project breakdowns) and
// user-flow / journey maps (case studies). Renders each Diagram as a framed
// figure with an optional caption, and opens a full-screen, zoomable lightbox
// on click — diagrams carry fine print that must be legible up close.
//
// The lightbox listens for Escape in the CAPTURE phase and stops propagation,
// so pressing Esc closes the zoom WITHOUT also closing the modal underneath
// (both modals attach their own Esc handler on window in the bubble phase).

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";
import type { Diagram } from "@/config/portfolio";

export default function DiagramGallery({ label, diagrams }: { label: string; diagrams?: Diagram[] }) {
  const [zoom, setZoom] = useState<Diagram | null>(null);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setZoom(null); }
    };
    window.addEventListener("keydown", onKey, true); // capture — beats the modal's handler
    return () => window.removeEventListener("keydown", onKey, true);
  }, [zoom]);

  if (!diagrams || diagrams.length === 0) return null;

  return (
    <div>
      <div className="text-[11px] font-mono mono-small tracking-widest mb-3" style={{ color: "var(--os-accent)" }}>
        {label}
      </div>

      <div className="space-y-5">
        {diagrams.map((d) => (
          <figure key={d.src} className="m-0">
            {d.label && (
              <figcaption className="text-[10.5px] font-mono mono-small tracking-[0.14em] mb-2" style={{ color: "var(--os-text-muted)" }}>
                {d.label}
              </figcaption>
            )}
            <button
              type="button"
              onClick={() => setZoom(d)}
              className="diagram-frame group"
              aria-label={`Enlarge ${d.label ?? d.caption ?? "diagram"}`}
            >
              <img
                src={d.src}
                alt={d.alt ?? d.caption ?? d.label ?? "diagram"}
                loading="lazy"
                decoding="async"
                onError={(e) => { (e.currentTarget.closest("figure") as HTMLElement | null)?.style.setProperty("display", "none"); }}
              />
              <span className="diagram-frame__zoom" aria-hidden>
                <Maximize2 size={13} /> Zoom
              </span>
            </button>
            {d.caption && (
              <figcaption className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--os-text-muted)" }}>
                {d.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {zoom && (
          <motion.div
            key="diagram-lightbox"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[1300] flex items-center justify-center p-4 sm:p-10"
            style={{ background: "color-mix(in srgb, var(--os-bg) 88%, black)", backdropFilter: "blur(6px)" }}
            onClick={() => setZoom(null)}
          >
            <button
              onClick={() => setZoom(null)}
              aria-label="Close"
              className="absolute top-5 right-5 grid place-items-center w-10 h-10 rounded-xl transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ background: "var(--os-bg-surface)", color: "var(--os-text-secondary)", border: "1px solid var(--os-border)" }}
            >
              <X size={17} aria-hidden />
            </button>
            <motion.figure
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="m-0 max-w-[95vw] max-h-[90vh] flex flex-col items-center gap-3"
            >
              <img
                src={zoom.src}
                alt={zoom.alt ?? zoom.caption ?? zoom.label ?? "diagram"}
                className="max-w-full max-h-[82vh] object-contain rounded-xl"
                style={{ border: "1px solid var(--os-border)", background: "var(--os-bg-surface)" }}
              />
              {(zoom.caption || zoom.label) && (
                <figcaption className="text-center text-[12.5px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                  {zoom.caption ?? zoom.label}
                </figcaption>
              )}
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
