"use client";

// Landing — composition root for the v2 portfolio.
// A normal scrollable document + a floating agent layer.
// The agent operates the page via CustomEvents: stage:nav,
// stage:case, stage:highlight (dispatched by ConciergeContext).

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Persona } from "@/types";
import { ConciergeProvider, useConcierge } from "@/contexts/ConciergeContext";
import AmbientBackground from "./AmbientBackground";
import PersonaLayer from "./PersonaLayer";

// Only mounts when the visitor enters graph mode
const GraphMode = dynamic(() => import("./GraphMode"), { ssr: false });
import Nav from "./Nav";
import Loader from "./Loader";
import Hero from "./Hero";
import MarqueeStrip from "./MarqueeStrip";
import AboutSection from "./AboutSection";
import ProjectsSection from "./ProjectsSection";
import ResearchSection from "./ResearchSection";
import CareerSection from "./CareerSection";
import EducationSection from "./EducationSection";
import SkillsSection from "./SkillsSection";
import ContactSection from "./ContactSection";
import AgentDock from "./AgentDock";
import ResumeModal from "./ResumeModal";
import ChapterTitle from "./ChapterTitle";
import NudgeLayer from "./NudgeLayer";

const VALID_PERSONAS = ["recruiter", "cto", "developer", "explorer"];

// Agent nav targets → DOM section ids
const NAV_TARGET: Record<string, string> = {
  about: "section-about",
  work: "section-work",
  research: "section-research",
  arc: "section-arc",
  education: "section-education",
  skills: "section-skills",
  contact: "section-contact",
};

function LandingInner() {
  const { setPersona, open, setOpen } = useConcierge();
  const [graphOpen, setGraphOpen] = useState(false);

  // Persona from URL (?for=recruiter)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("for");
    if (p && VALID_PERSONAS.includes(p)) setPersona(p as Persona);
  }, [setPersona]);

  // Agent tool: [NAV:x] scrolls to a section
  useEffect(() => {
    const onNav = (e: Event) => {
      const target = NAV_TARGET[(e as CustomEvent<string>).detail];
      if (target) document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
    };
    const onGraphToggle = () => setGraphOpen((v) => !v);
    window.addEventListener("stage:nav", onNav);
    window.addEventListener("graph:toggle", onGraphToggle);
    return () => {
      window.removeEventListener("stage:nav", onNav);
      window.removeEventListener("graph:toggle", onGraphToggle);
    };
  }, []);

  return (
    <div className="relative" style={{ color: "var(--os-text)" }}>
      <Loader />
      <AmbientBackground />
      <Nav />

      <div className="relative z-[1]">
        <Hero />
        <MarqueeStrip />
        <AboutSection />
        <ProjectsSection />
        <ResearchSection />
        <CareerSection />
        <EducationSection />
        <SkillsSection />
        <ContactSection />
      </div>

      {/* Floating Ask-AI pill — discoverable after scrolling, hidden while dock open */}
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => window.dispatchEvent(new CustomEvent("concierge-focus-input")), 80);
          }}
          aria-label="Open AI concierge (Ctrl+K)"
          className="fixed bottom-5 right-5 z-[1250] flex items-center gap-2 text-[13px] font-medium pl-3.5 pr-4 py-3 rounded-full transition-all hover:scale-[1.04] active:scale-95"
          style={{
            background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))",
            color: "#fff",
            boxShadow: "var(--os-shadow-accent)",
          }}
        >
          <MessageSquare size={15} aria-hidden />
          <span className="hidden sm:inline">Ask AI</span>
          <kbd className="hidden md:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20">
            Ctrl K
          </kbd>
        </button>
      )}

      <AgentDock />
      <PersonaLayer />
      <ResumeModal />
      <ChapterTitle />
      <NudgeLayer />

      {/* Graph mode — the same portfolio as a knowledge graph */}
      <AnimatePresence>
        {graphOpen && <GraphMode onClose={() => setGraphOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function Landing() {
  return (
    <ConciergeProvider>
      <LandingInner />
    </ConciergeProvider>
  );
}
