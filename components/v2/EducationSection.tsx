"use client";

// Education & Certifications — degree card, featured BITSoM cert,
// and a certificate gallery previewed in a lightbox (no downloads).
// The gallery renders only entries present in config — no placeholders.

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Award, BadgeCheck, X, ArrowUpRight } from "lucide-react";
import { education, certificates } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import Reveal from "./Reveal";

type Cert = (typeof certificates)[number];

function CertLightbox({ cert, onClose }: { cert: Cert | null; onClose: () => void }) {
  useEffect(() => {
    if (!cert) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [cert, onClose]);

  return (
    <AnimatePresence>
      {cert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
          style={{ background: "color-mix(in srgb, var(--os-bg) 80%, transparent)", backdropFilter: "blur(10px)" }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${cert.title} certificate preview`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full rounded-3xl border overflow-hidden"
            style={{ background: "var(--os-bg-window)", borderColor: "var(--os-border)", boxShadow: "var(--os-shadow-accent)" }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--os-border-subtle)" }}>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "var(--os-text)" }}>{cert.title}</div>
                <div className="text-[11.5px] font-mono" style={{ color: "var(--os-text-muted)" }}>{cert.issuer} · {cert.year}</div>
              </div>
              <button onClick={onClose} aria-label="Close preview"
                className="grid place-items-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                style={{ color: "var(--os-text-muted)" }}>
                <X size={14} aria-hidden />
              </button>
            </div>
            {cert.image ? (
              <div className="relative w-full" style={{ maxHeight: "70vh" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary aspect certificate scans */}
                <img src={cert.image} alt={`${cert.title} certificate`} className="w-full h-auto object-contain" style={{ maxHeight: "70vh" }} />
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-[13px]" style={{ color: "var(--os-text-secondary)" }}>
                Preview image coming soon.
                {cert.url && (
                  <a href={cert.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 mt-3 text-[12.5px] font-mono"
                    style={{ color: "var(--os-accent)" }}>
                    Verify credential <ArrowUpRight size={11} aria-hidden />
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function EducationSection() {
  const [preview, setPreview] = useState<Cert | null>(null);
  const { degree, featuredCert } = education;

  return (
    <SectionShell
      id="section-education"
      kicker="EDUCATION & CREDENTIALS"
      title="Engineering degree, PM certification"
      subtitle="The formal backbone behind the hybrid: AI/ML honors engineering plus an executive AI product management program."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {/* Degree */}
        <Reveal>
          <div className="glass-card rounded-3xl p-6 sm:p-7 h-full">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-xl"
                style={{ background: "color-mix(in srgb, var(--os-accent-cyan) 14%, transparent)", color: "var(--os-accent-cyan)" }}>
                <GraduationCap size={16} aria-hidden />
              </span>
              <span className="text-[11px] font-mono mono-small tracking-widest" style={{ color: "var(--os-accent-cyan)" }}>
                DEGREE · 2018–2022
              </span>
            </div>
            <h3 className="font-display font-bold text-[18px] leading-snug mb-1" style={{ color: "var(--os-text)" }}>
              {degree.title}
            </h3>
            <div className="text-[13.5px] font-medium mb-4" style={{ color: "var(--os-text-secondary)" }}>
              {degree.school} · {degree.location}
            </div>
            <ul className="space-y-1.5">
              {degree.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-[13px]" style={{ color: "var(--os-text-secondary)" }}>
                  <BadgeCheck size={13} className="mt-0.5 shrink-0" style={{ color: "var(--os-accent-green)" }} aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Featured certification */}
        <Reveal delay={0.08}>
          <div className="glass-card rounded-3xl p-6 sm:p-7 h-full relative overflow-hidden">
            <div
              className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--os-accent) 22%, transparent), transparent 70%)" }}
              aria-hidden
            />
            <div className="flex items-center gap-2.5 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-xl"
                style={{ background: "color-mix(in srgb, var(--os-accent) 14%, transparent)", color: "var(--os-accent)" }}>
                <Award size={16} aria-hidden />
              </span>
              <span className="text-[11px] font-mono mono-small tracking-widest" style={{ color: "var(--os-accent)" }}>
                EXECUTIVE CERTIFICATION · {featuredCert.year}
              </span>
            </div>
            <h3 className="font-display font-bold text-[18px] leading-snug mb-1" style={{ color: "var(--os-text)" }}>
              {featuredCert.title}
            </h3>
            <div className="text-[13.5px] font-medium mb-4" style={{ color: "var(--os-text-secondary)" }}>
              {featuredCert.issuer}
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
              {featuredCert.description}
            </p>
          </div>
        </Reveal>
      </div>

      {/* Certificate gallery — only renders when populated */}
      {certificates.length > 0 && (
        <Reveal delay={0.1}>
          <div className="mt-8">
            <div className="text-[10.5px] font-mono mono-small tracking-widest mb-4" style={{ color: "var(--os-text-muted)" }}>
              MORE CERTIFICATES — CLICK TO PREVIEW
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
              {certificates.map((c) => (
                <button
                  key={c.title}
                  onClick={() => setPreview(c)}
                  className="glass-card rounded-2xl shrink-0 w-[220px] text-left p-4 snap-start transition-all hover:-translate-y-1"
                  aria-label={`Preview certificate: ${c.title}`}
                >
                  {c.image && (
                    <div className="relative w-full h-[110px] rounded-lg overflow-hidden mb-3" style={{ background: "var(--os-bg-surface)" }}>
                      <Image src={c.image} alt="" fill className="object-cover" sizes="220px" />
                    </div>
                  )}
                  <div className="text-[12.5px] font-semibold leading-snug mb-1" style={{ color: "var(--os-text)" }}>
                    {c.title}
                  </div>
                  <div className="text-[10.5px] font-mono" style={{ color: "var(--os-text-muted)" }}>
                    {c.issuer} · {c.year}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <CertLightbox cert={preview} onClose={() => setPreview(null)} />
    </SectionShell>
  );
}
