"use client";

import AmbientBackground from "./AmbientBackground";
import Nav from "./Nav";
import FilmHero from "./FilmHero";
import FilmBreak from "./FilmBreak";
import AboutSection from "./AboutSection";
import ProjectsSection from "./ProjectsSection";
import ResearchSection from "./ResearchSection";
import CareerSection from "./CareerSection";
import EducationSection from "./EducationSection";
import SkillsSection from "./SkillsSection";
import ContactSection from "./ContactSection";

export default function FilmLanding() {
  return (
    <div className="film-portfolio">
      <AmbientBackground />
      <Nav variant="b" />
      <main className="relative z-[1]">
        <FilmHero />
        <FilmBreak index="02" lines={["MOST AI MAKES", "A CLAIM."]} note="The difficult work begins after the demo: proving an answer, handling the edge cases, and staying useful when the model is uncertain." />
        <AboutSection />
        <FilmBreak index="03" lines={["THE WORK IS", "THE RECEIPT."]} note="Each case file opens the system, the constraints, and the decisions behind the interface." />
        <ProjectsSection />
        <ResearchSection />
        <FilmBreak index="04" lines={["SYSTEMS MUST", "HOLD."]} note="Production is where the promise meets people, operators, evaluation, and consequence." />
        <CareerSection />
        <SkillsSection />
        <EducationSection />
        <ContactSection />
      </main>
    </div>
  );
}
