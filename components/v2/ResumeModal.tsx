"use client";

// Resume viewer — inline PDF so we control the focus, with download
// as a secondary action. Opens on the "resume:open" CustomEvent.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { personal } from "@/config/portfolio";

export default function ResumeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("resume:open", onOpen);
    return () => window.removeEventListener("resume:open", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1250] flex items-center justify-center p-3 sm:p-8"
          style={{ background: "color-mix(in srgb, var(--os-bg) 78%, transparent)", backdropFilter: "blur(10px)" }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Resume"
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl h-[88vh] rounded-3xl border overflow-hidden flex flex-col"
            style={{
              background: "var(--os-bg-window)",
              borderColor: "color-mix(in srgb, var(--os-accent) 28%, var(--os-border))",
              boxShadow: "var(--os-shadow-accent)",
            }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
              style={{ borderColor: "var(--os-border-subtle)" }}>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "var(--os-text)" }}>
                  {personal.name} — Resume
                </div>
                <div className="text-[11px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                  Updated {personal.resumeUpdated}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={personal.resumeUrl}
                  download
                  className="flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-xl border transition-all hover:opacity-85"
                  style={{
                    borderColor: "color-mix(in srgb, var(--os-accent) 35%, transparent)",
                    color: "var(--os-accent)",
                    background: "color-mix(in srgb, var(--os-accent) 8%, transparent)",
                  }}
                >
                  <Download size={12} aria-hidden /> Download PDF
                </a>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close resume"
                  className="grid place-items-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                  style={{ color: "var(--os-text-muted)" }}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            </div>
            {/* Inline PDF viewer */}
            <iframe
              src={`${personal.resumeUrl}#toolbar=0&navpanes=0`}
              title={`${personal.name} resume`}
              className="flex-1 w-full"
              style={{ background: "#fff", border: "none" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
