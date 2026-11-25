"use client";

// Landing — composition root for the v2 portfolio.
// A normal scrollable document + a floating agent layer.
// The agent operates the page via CustomEvents: stage:nav,
// stage:case, stage:highlight (dispatched by ConciergeContext).

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, LazyMotion } from "framer-motion";

// Animation features load async so Framer is not in the first-paint budget.
const loadMotionFeatures = () => import("@/lib/motionFeatures").then((r) => r.default);
import { MessageSquare } from "lucide-react";
import { Persona } from "@/types";
import { ConciergeProvider, useConcierge } from "@/contexts/ConciergeContext";
// PersonaLayer is PARKED (see docs/FEATURES.md §4) — the upfront "What brings
// you here?" chooser was friction and the persona reorder was invisible. It was
// replaced by HighlightStrip (the one-line strip under the nav). Import kept for
// an easy revival, but it is intentionally NOT rendered.
// import PersonaLayer from "./PersonaLayer";
import { startPerfGovernor } from "@/lib/perf";
import { MOBILE_TUNING } from "@/config/mobileTuning";
import { CLUTTER_OFF } from "@/config/premiumPass";

// NOTE: the experimental "projects helix" (spiral) is deliberately kept OUT of
// the build. Its stylesheet (app/spiral.css), config flag, rAF/Lenis scroll
// driver and ProjectSpiral component are not imported here, so none of them can
// ship or leak memory — the projects section is the plain ProjectsSection grid.
// The spiral source is left unreferenced on disk in case it's revisited.

// Only mounts when the visitor enters graph mode
const GraphMode = dynamic(() => import("./GraphMode"), { ssr: false });
// Overlays are not part of the first paint. They load as separate chunks and
// mount once the browser is idle (or at once if the visitor opens Helios or
// starts the tour), which keeps their hydration out of Total Blocking Time.
const HeliosIntro = dynamic(() => import("./HeliosIntro"), { ssr: false });
const ExitRecap = dynamic(() => import("./ExitRecap"), { ssr: false });
const AgentDock = dynamic(() => import("./AgentDock"), { ssr: false });
const FilmMode = dynamic(() => import("./FilmMode"), { ssr: false });
const NudgeLayer = dynamic(() => import("./NudgeLayer"), { ssr: false });
const BehaviorTracker = dynamic(() => import("./BehaviorTracker"), { ssr: false });
const FeedbackWidget = dynamic(() => import("./FeedbackWidget"), { ssr: false });
const SoundPrompt = dynamic(() => import("./SoundPrompt"), { ssr: false });
// The Graph button opens the light 2D Product Map first; 3D is one click in.
const ProductMap = dynamic(() => import("./ProductMap"), { ssr: false });

import Nav from "./Nav";
import SmoothCursor from "./SmoothCursor";
// Event-driven ("resume:open"), so it stays mounted from the start: a click
// before idle must not be lost.
import ResumeModal from "./ResumeModal";
import Magnetic from "./Magnetic";
const FilmLanding = dynamic(() => import("./FilmLanding"));
import { helios } from "@/lib/voice";

const VALID_PERSONAS = ["recruiter", "cto", "developer", "explorer"];

// Parent overlay updates must not reconcile the complete portfolio story.
// Order = design-system/MASTER.md §8: who → proof → how I decide → work →
// product case study → AI radar → the person and the record → contact.
// Section ids are a contract with the tour and the agent's [NAV:x] tool.
// The story itself is a SERVER component (components/v2/Story.tsx), rendered
// by app/page.tsx and passed in as `story`, so static sections ship no JS.


// Agent nav targets → DOM section ids
const NAV_TARGET: Record<string, string> = {
  about: "section-about",
  decisions: "section-decisions",
  radar: "section-radar",
  reliability: "section-reliability",
  work: "section-work",
  achievements: "section-achievements",
  research: "section-research",
  arc: "section-arc",
  education: "section-education",
  skills: "section-skills",
  contact: "section-contact",
};

function LandingInner({ variant, story }: { variant: "a" | "b"; story: React.ReactNode }) {
  const { setPersona, open, setOpen, tourRunning } = useConcierge();
  const [graphOpen, setGraphOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setIdle(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setIdle(true), 1500);
    return () => window.clearTimeout(t);
  }, []);
  // First intent mounts the overlays early. Ctrl/⌘+K before the dock has
  // mounted opens Helios here so that first keypress is never lost.
  useEffect(() => {
    const wake = () => setIdle(true);
    const onKey = (e: KeyboardEvent) => {
      setIdle(true);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("pointerdown", wake, { once: true, passive: true });
    window.addEventListener("keydown", onKey, { once: true });
    return () => { window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", onKey); };
  }, [setOpen]);
  const overlays = idle || open || tourRunning;
  const graphOpenRef = useRef(false);
  useEffect(() => { graphOpenRef.current = graphOpen; }, [graphOpen]);
  // Floating Ask-AI pill appears only after the hero is scrolled past —
  // inside the hero the nav button and the hero CTA already cover it.
  const [pastHero, setPastHero] = useState(false);
  // Scale the experience to the device (WebGL, blur, animation budget).
  // Deferred to idle: the governor stamps <html> (data-tier / perf-* class),
  // and any <html> change during hydration re-styles the whole long page.
  useEffect(() => {
    let stop: (() => void) | undefined;
    const run = () => { stop = startPerfGovernor(); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 3000 });
      return () => { w.cancelIdleCallback?.(id); stop?.(); };
    }
    const t = window.setTimeout(run, 1500);
    return () => { window.clearTimeout(t); stop?.(); };
  }, []);
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
    const onGraphToggle = () => {
      // Graph button: open the Product Map, or close whichever view is open.
      if (graphOpenRef.current) { setGraphOpen(false); return; }
      setMapOpen((v) => !v);
    };
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
      {/* The 4-second first-visit Loader, the signal rail and the ambient
          scroll field were removed in the APM redesign: the page now paints
          its real content on the first frame (see design-system/MASTER.md). */}
      {variant === "b" ? <FilmLanding /> : <>
      <Nav variant="a" />
      {story}
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
                background: "var(--os-cta-bg)",
                color: "var(--os-cta-text)",
                boxShadow: "var(--os-shadow)",
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

      <SmoothCursor />
      {/* Feedback is a Variant-A feature — Variant B is intentionally untouched */}
      {/* Feedback pill is hidden in graph mode — the graph overlay owns the frame */}
      {overlays && variant === "a" && !graphOpen && !CLUTTER_OFF && <FeedbackWidget />}
      {overlays && variant === "a" && !CLUTTER_OFF && <SoundPrompt />}
      {overlays && <AgentDock />}
      {/* The one-line highlight strip under the nav (replaces the parked
          PersonaLayer). Variant A only. */}
      {/* HighlightStrip removed from the first screen in the APM redesign
          (it competed with the hero); the component is kept for reuse. */}
      {/* First-touch "there's a live AI here" heads-up + exit recap — Variant A. */}
      {/* Premium pass (config/premiumPass.ts): the first-touch intro, exit
          recap and nudges stay off; Helios is one Ctrl+K or pill away. */}
      {overlays && variant === "a" && !CLUTTER_OFF && <HeliosIntro />}
      {overlays && variant === "a" && !CLUTTER_OFF && <ExitRecap />}
      <ResumeModal />
      {/* Event-driven (film:enter fires as the tour starts): always mounted;
          still a separate chunk, so it stays out of the first bundle. */}
      <FilmMode />
      {overlays && !CLUTTER_OFF && <NudgeLayer />}
      {overlays && <BehaviorTracker />}

      {/* Graph mode — the same portfolio as a knowledge graph */}
      <AnimatePresence>
        {graphOpen && <GraphMode onClose={() => setGraphOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {mapOpen && <ProductMap onClose={() => setMapOpen(false)} onOpen3D={() => { setMapOpen(false); setGraphOpen(true); }} />}
      </AnimatePresence>
    </div>
  );
}

export default function Landing({ variant = "a", story }: { variant?: "a" | "b"; story: React.ReactNode }) {
  return (
    <ConciergeProvider>
      <LazyMotion features={loadMotionFeatures}>
        <LandingInner variant={variant} story={story} />
      </LazyMotion>
    </ConciergeProvider>
  );
}
