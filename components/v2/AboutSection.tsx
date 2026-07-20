"use client";

// About — who Sankalp is. Photo card on the left; education,
// expertise, and mission cards on the right (reference-inspired).

import Image from "next/image";
import { motion } from "framer-motion";
import { GraduationCap, Code2, Target, FileText, Download } from "lucide-react";
import { personal, education, skills } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import Reveal from "./Reveal";

const CORE_STACK = skills.filter((s) => s.core).map((s) => s.name).slice(0, 6);

export default function AboutSection() {
  return (
    <SectionShell
      id="section-about"
      kicker="GET TO KNOW ME"
      title="The person behind the systems"
      subtitle={personal.tagline}
    >
      <div className="grid gap-5 md:grid-cols-[340px_1fr]">
        {/* Photo card */}
        <Reveal>
          <div className="glass-card rounded-3xl overflow-hidden h-full flex flex-col">
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/4.4", background: "var(--os-bg-surface)" }}>
              {/* Slow Ken Burns drift — a still photo that breathes */}
              <motion.div
                className="absolute inset-0"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src={personal.profilePhoto}
                  alt={`Portrait of ${personal.name}`}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 340px"
                />
              </motion.div>
              <div
                className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                style={{ background: "linear-gradient(transparent, color-mix(in srgb, var(--os-bg-window) 92%, transparent))" }}
                aria-hidden
              />
            </div>
            <div className="p-5">
              <div className="font-display font-bold text-[19px]" style={{ color: "var(--os-text)" }}>
                {personal.name}
              </div>
              <div className="text-[12.5px] font-medium mt-0.5 mb-3" style={{ color: "var(--os-accent)" }}>
                {personal.roles.join(" & ")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CORE_STACK.map((s) => (
                  <span key={s} className="text-[10.5px] font-mono px-2 py-0.5 rounded-md"
                    style={{ background: "var(--os-bg-surface)", color: "var(--os-text-muted)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Info cards */}
        <div className="flex flex-col gap-4">
          <Reveal delay={0.06}>
            <div className="glass-card rounded-2xl p-5 flex gap-4">
              <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: "color-mix(in srgb, var(--os-accent-cyan) 14%, transparent)", color: "var(--os-accent-cyan)" }}>
                <GraduationCap size={17} aria-hidden />
              </span>
              <div>
                <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--os-text)" }}>Education</div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
                  <strong style={{ color: "var(--os-accent-cyan)" }}>{education.degree.title}</strong> at{" "}
                  {education.degree.school} (CGPA 8.54), topped with an executive certification in{" "}
                  <strong style={{ color: "var(--os-accent-cyan)" }}>{education.featuredCert.title}</strong> from{" "}
                  {education.featuredCert.issuer}.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="glass-card rounded-2xl p-5 flex gap-4">
              <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: "color-mix(in srgb, var(--os-accent) 14%, transparent)", color: "var(--os-accent)" }}>
                <Code2 size={17} aria-hidden />
              </span>
              <div>
                <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--os-text)" }}>What I build</div>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--os-text-secondary)" }}>
                  {personal.bio}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="glass-card rounded-2xl p-5 flex gap-4">
              <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: "color-mix(in srgb, var(--os-accent-green) 14%, transparent)", color: "var(--os-accent-green)" }}>
                <Target size={17} aria-hidden />
              </span>
              <div className="flex-1">
                <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--os-text)" }}>Mission</div>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--os-text-secondary)" }}>
                  Close the gap between what AI can do and what actually ships — systems that are
                  reliable, evaluated, and worth building. The engineer half makes it work;
                  the PM half makes it matter.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("resume:open"))}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "#fff" }}
                  >
                    <FileText size={13} aria-hidden /> View resume
                  </button>
                  <a
                    href={personal.resumeUrl}
                    download
                    className="flex items-center gap-1.5 text-[12.5px] font-mono px-4 py-2 rounded-xl border transition-colors hover:bg-[var(--os-bg-hover)]"
                    style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)" }}
                  >
                    <Download size={13} aria-hidden /> Download
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
