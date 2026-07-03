"use client";

// Two-level project modal: Overview ⇄ Case Study.
// Opaque surface (no bleed-through), focus-trapped, Esc closes,
// body scroll locked while open.

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { GithubIcon } from "@/components/ui/Icons";
import { projects } from "@/config/portfolio";

export default function ProjectModal({
  projectId,
  caseView,
  setCaseView,
  onClose,
}: {
  projectId: string | null;
  caseView: boolean;
  setCaseView: (v: boolean) => void;
  onClose: () => void;
}) {
  const project = projects.find((p) => p.id === projectId) ?? null;
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    onClose();
    restoreFocusRef.current?.focus();
  }, [onClose]);

  // Esc + body scroll lock + initial focus
  useEffect(() => {
    if (!project) return;
    restoreFocusRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (caseView) setCaseView(false);
        else close();
      }
      // Rudimentary focus trap
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          "button, a[href], [tabindex]:not([tabindex='-1'])"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [project, caseView, setCaseView, close]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="project-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6"
          style={{ background: "color-mix(in srgb, var(--os-bg) 72%, transparent)", backdropFilter: "blur(8px)" }}
          onClick={close}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${project.name} — ${caseView ? "case study" : "project overview"}`}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[88vh] rounded-3xl border overflow-hidden flex flex-col outline-none"
            style={{
              background: "var(--os-bg-window)", // fully opaque — no content bleed
              borderColor: "var(--os-border)",
              boxShadow: "var(--os-shadow-accent)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-4 border-b shrink-0"
              style={{ borderColor: "var(--os-border-subtle)" }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-mono mb-1.5" style={{ color: "var(--os-text-muted)" }}>
                  {caseView && (
                    <button
                      onClick={() => setCaseView(false)}
                      className="flex items-center gap-1 hover:opacity-75 transition-opacity"
                      style={{ color: "var(--os-accent)" }}
                    >
                      <ArrowLeft size={11} aria-hidden /> Overview
                    </button>
                  )}
                  <span>{caseView ? "/ Case study" : `${project.year} · ${project.category} · ${project.status}`}</span>
                </div>
                <h3 className="font-display font-bold text-[24px] leading-tight truncate" style={{ color: "var(--os-text)" }}>
                  {project.name}
                </h3>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="grid place-items-center w-9 h-9 rounded-xl shrink-0 transition-colors hover:bg-[var(--os-bg-hover)]"
                style={{ background: "var(--os-bg-surface)", color: "var(--os-text-muted)" }}
              >
                <X size={15} aria-hidden />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
              {!caseView ? (
                <>
                  <p className="text-[14.5px] leading-relaxed mb-6" style={{ color: "var(--os-text-secondary)" }}>
                    {project.longDescription}
                  </p>

                  <div className="text-[11px] font-mono mono-small tracking-widest mb-3" style={{ color: "var(--os-accent)" }}>
                    KEY HIGHLIGHTS
                  </div>
                  <ul className="space-y-2.5 mb-7">
                    {project.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: "var(--os-text-secondary)" }}>
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--os-accent-green)" }} aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="text-[11px] font-mono mono-small tracking-widest mb-3" style={{ color: "var(--os-accent)" }}>
                    STACK
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((s) => (
                      <span key={s} className="text-[12px] font-mono px-2.5 py-1 rounded-lg"
                        style={{ background: "var(--os-bg-surface)", color: "var(--os-text-secondary)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-7">
                  {([
                    ["THE PROBLEM", project.caseStudy.problem],
                    ["THE APPROACH", project.caseStudy.approach],
                  ] as const).map(([label, text]) => (
                    <div key={label}>
                      <div className="text-[11px] font-mono mono-small tracking-widest mb-2.5" style={{ color: "var(--os-accent)" }}>
                        {label}
                      </div>
                      <p className="text-[14px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>{text}</p>
                    </div>
                  ))}

                  <div>
                    <div className="text-[11px] font-mono mono-small tracking-widest mb-2.5" style={{ color: "var(--os-accent)" }}>
                      RESULTS
                    </div>
                    <ul className="space-y-2.5">
                      {project.caseStudy.results.map((r) => (
                        <li key={r} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: "var(--os-text-secondary)" }}>
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--os-accent-green)" }} aria-hidden />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono mono-small tracking-widest mb-2.5" style={{ color: "var(--os-accent)" }}>
                      WHAT I LEARNED
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
                      {project.caseStudy.lessons}
                    </p>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono mono-small tracking-widest mb-2.5" style={{ color: "var(--os-accent)" }}>
                      MY ROLE
                    </div>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
                      {project.caseStudy.role}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t shrink-0"
              style={{ borderColor: "var(--os-border-subtle)" }}>
              <div className="flex items-center gap-2">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12.5px] font-mono px-3 py-2 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
                    style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)" }}
                  >
                    <GithubIcon size={13} /> GitHub
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12.5px] font-mono px-3 py-2 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
                    style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)" }}
                  >
                    <ArrowUpRight size={13} aria-hidden /> Live
                  </a>
                )}
              </div>

              {!caseView ? (
                <button
                  onClick={() => setCaseView(true)}
                  className="flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "#fff" }}
                >
                  Read the full case study <ArrowUpRight size={13} aria-hidden />
                </button>
              ) : (
                <span className="text-[11.5px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                  Esc to go back
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
