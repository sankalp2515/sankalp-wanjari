// The portfolio story — a SERVER component (no "use client").
// app/page.tsx renders it and hands it to the client <Landing> as `story`, so
// sections with no interactivity (ProofStrip shell, Achievements, Research,
// Reliability, SectionShell headers) render to HTML on the server and ship no
// JavaScript; interactive sections stay client components as islands.
//
// Order = design-system/MASTER.md §8. Section ids are a contract with the tour
// and the agent's [NAV:x] tool. Every section below the hero sits in its own
// <Suspense> boundary so React hydrates the client islands as separate small
// tasks instead of one long main-thread block.

import { Suspense, type ReactNode } from "react";
import Hero from "./Hero";
import ProofStrip from "./ProofStrip";
import DecisionsSection from "./DecisionsSection";
import ProjectsSection from "./ProjectsSection";
import CaseStudiesSection from "./CaseStudiesSection";
import RadarSection from "./RadarSection";
import AchievementsSection from "./AchievementsSection";
import AboutSection from "./AboutSection";
import CareerSection from "./CareerSection";
import ReliabilityPreview from "./ReliabilityPreview";
import ResearchSection from "./ResearchSection";
import EducationSection from "./EducationSection";
import SkillsSection from "./SkillsSection";
import ContactSection from "./ContactSection";
import Footer from "./Footer";

const S = ({ children }: { children: ReactNode }) => <Suspense fallback={null}>{children}</Suspense>;

export default function Story() {
  return (
    <div id="top" className="relative z-[1]">
      <Hero />
      <S><ProofStrip /></S>
      <S><DecisionsSection /></S>
      <S><ProjectsSection /></S>
      <S><CaseStudiesSection /></S>
      <S><RadarSection /></S>
      <S><AchievementsSection /></S>
      <S><AboutSection /></S>
      <S><CareerSection /></S>
      <S><ReliabilityPreview /></S>
      <S><ResearchSection /></S>
      <S><EducationSection /></S>
      <S><SkillsSection /></S>
      <S><ContactSection /></S>
      <Footer />
    </div>
  );
}
