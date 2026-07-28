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
import { startPerfGovernor } from "@/lib/perf";
import { MOBILE_TUNING } from "@/config/mobileTuning";

// Only mounts when the visitor enters graph mode
const GraphMode = dynamic(() => import("./GraphMode"), { ssr: false });

import Nav from "./Nav";
import Loader from "./Loader";
import CursorDot from "./CursorDot";
import Magnetic from "./Magnetic";
import SignalRail from "./SignalRail";
import Interlude from "./Interlude";
import FilmLanding from "./FilmLanding";
import Hero from "./Hero";
import MarqueeStrip from "./MarqueeStrip";
import AboutSection from "./AboutSection";
import ProjectsSection from "./ProjectsSection";
import CaseStudiesSection from "./CaseStudiesSection";
import ResearchSection from "./ResearchSection";
import CareerSection from "./CareerSection";
import EducationSection from "./EducationSection";
import SkillsSection from "./SkillsSection";
import ContactSection from "./ContactSection";
import AgentDock from "./AgentDock";
import ResumeModal from "./ResumeModal";
import FilmMode from "./FilmMode";
import NudgeLayer from "./NudgeLayer";
import BehaviorTracker from "./BehaviorTracker";
import FeedbackWidget from "./FeedbackWidget";
import SoundPrompt from "./SoundPrompt";
import { helios } from "@/lib/voice";

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

function LandingInner({ variant }: { variant: "a" | "b" }) {
  const { setPersona, open, setOpen, tourRunning } = useConcierge();
  const [graphOpen, setGraphOpen] = useState(false);
  // Floating Ask-AI pill appears only after the hero is scrolled past —
  // inside the hero the nav button and the hero CTA already cover it.
  const [pastHero, setPastHero] = useState(false);
  // Scale the experience to the device (WebGL, blur, animation budget).
  useEffect(() => { startPerfGovernor(); }, []);
  // Master switch for the mobile tuning pass. One class gates every scoped
  // CSS rule; flip MOBILE_TUNING to false to remove it and revert instantly.
  useEffect(() => {
    document.documentElement.classList.toggle("mobile-tuned", MOBILE_TUNING);
  }, []);
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Persona from URL (?for=recruiter)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("for");
    if (p && VALID_PERSONAS.includes(p)) setPersona(p as Persona);
  }, [setPersona]);

  // EMBER announces graph mode — one line, spoken, never repeated back-to-back
  useEffect(() => {
    if (graphOpen) {
      helios.speak("Graph mode. Every node here is a real skill, project, or credential — hover and drag to trace how the system connects.");
    } else {
      helios.stop();
    }
  }, [graphOpen]);

  // Agent tool: [NAV:x] scrolls to a section
  useEffect(() => {
    const onNav = (e: Event) => {
      const target = NAV_TARGET[(e as CustomEvent<string>).detail];
      if (target) document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
    };
    const onGraphToggle = () => setGraphOpen((v) => !v);
    // Spotlight: while the film runs, only the active section stays bright.
    const onSpotlight = (e: Event) => {
      const target = (e as CustomEvent<string>).detail;
      // Engage dimming as soon as any section is spotlit — not only when a
      // synced cue fires (cue-less acts must dim too).
      document.documentElement.classList.add("film-spotlight");
      document.querySelectorAll<HTMLElement>("[id^='section-']").forEach((el) => {
        el.classList.toggle("film-active", el.id === target);
      });
    };
    const onFilmExit = () => {
      document.documentElement.classList.remove("film-spotlight");
      document.querySelectorAll<HTMLElement>(".film-active").forEach((el) => el.classList.remove("film-active"));
    };
    window.addEventListener("stage:nav", onNav);
    window.addEventListener("graph:toggle", onGraphToggle);
    window.addEventListener("film:spotlight", onSpotlight);
    window.addEventListener("film:exit", onFilmExit);
    return () => {
      window.removeEventListener("stage:nav", onNav);
      window.removeEventListener("graph:toggle", onGraphToggle);
      window.removeEventListener("film:spotlight", onSpotlight);
      window.removeEventListener("film:exit", onFilmExit);
    };
  }, []);

  return (
    <div className="relative" data-experience={variant} style={{ color: "var(--os-text)" }}>
      <Loader />
      {variant === "b" ? <FilmLanding /> : <>
      <AmbientBackground />
      <SignalRail variant="a" />
      <Nav variant="a" />

      <div className="relative z-[1]">
        <Hero variant={variant} />
        <MarqueeStrip />
        <AboutSection />
        <Interlude
          index="01"
          kicker="THE PREMISE"
          lines={["MAKE IT", "MATTER."]}
          caption="Models are easy to demo. The difficult part is making them dependable enough to earn a place in someone’s real workflow."
        />
        <ProjectsSection />
        {/* Renders only when config/portfolio.ts caseStudies has real entries. */}
        <CaseStudiesSection />
        <Interlude
          index="02"
          kicker="THE STANDARD"
          lines={["VERIFY", "EVERYTHING."]}
          caption="A confident answer is not evidence. Systems should show their work before people are asked to trust them."
          tone="cool"
        />
        <ResearchSection />
        <CareerSection />
        <Interlude
          index="03"
          kicker="THE THROUGHLINE"
          lines={["SHIP THE", "HARD PART."]}
          caption="Good AI work does not stop at the model. It reaches the edge cases, the operators, the evaluation loop, and the outcome."
          tone="green"
        />
        <EducationSection />
        <SkillsSection />
        <ContactSection />
      </div>
      </>}

      {/* Floating Ask-AI pill — discoverable after scrolling, hidden while dock open */}
      {!open && pastHero && !tourRunning && (
        <div className="ask-fab fixed bottom-5 right-5 z-[1250]">
          <Magnetic strength={0.3}>
            <button
              onClick={() => {
                setOpen(true);
                setTimeout(() => window.dispatchEvent(new CustomEvent("concierge-focus-input")), 80);
              }}
              aria-label="Open AI concierge (Ctrl+K)"
              className="flex items-center gap-2 text-[13px] font-medium pl-3.5 pr-4 py-3 rounded-full transition-all hover:scale-[1.04] active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))",
                color: "var(--os-on-accent)",
                boxShadow: "var(--os-shadow-accent)",
              }}
            >
              <MessageSquare size={15} aria-hidden />
              <span className="hidden sm:inline">Ask Helios</span>
              <kbd className="hidden md:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/15">
                Ctrl K
              </kbd>
            </button>
          </Magnetic>
        </div>
      )}

      <CursorDot />
      {/* Feedback is a Variant-A feature — Variant B is intentionally untouched */}
      {/* Feedback pill is hidden in graph mode — the graph overlay owns the frame */}
      {variant === "a" && !graphOpen && <FeedbackWidget />}
      {variant === "a" && <SoundPrompt />}
      <AgentDock />
      <PersonaLayer variant={variant} />
      <ResumeModal />
      <FilmMode />
      <NudgeLayer />
      <BehaviorTracker />

      {/* Graph mode — the same portfolio as a knowledge graph */}
      <AnimatePresence>
        {graphOpen && <GraphMode onClose={() => setGraphOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function Landing({ variant = "a" }: { variant?: "a" | "b" }) {
  return (
    <ConciergeProvider>
      <LandingInner variant={variant} />
    </ConciergeProvider>
  );
}
