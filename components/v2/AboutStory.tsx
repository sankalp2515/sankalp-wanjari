// AboutStory — About as three true stories instead of a stat board
// (premium pass, config/premiumPass.ts: ABOUT_STORY).
//
// Every number on this page already appears higher up (proof strip, awards),
// so About does a different job: it shows how Sankalp works, through three
// moments from the record. No floating stat cards, no checklists, no chips:
// a portrait, a first-person headline, three short stories and the practical
// details. Server component; the only motion is CSS (each story rises as it
// scrolls in, a thin line draws down the margin), off under reduced motion.
//
// Facts restate config/portfolio.ts (experience, education, case studies).

import Image from "next/image";
import { FileText } from "lucide-react";
import { personal, education } from "@/config/portfolio";
import ResumeButton from "./ResumeButton";

const STORIES = [
  {
    when: "FIS Global · 2022–2025",
    title: "The failure nobody could trace.",
    body: "I joined FIS as an IT trainee and was promoted after six months. Then 1,000+ regulated financial documents kept failing in processing, and the existing tools could not trace why. The cause was a hidden encryption flag. I cleared the failures, then turned the fix into a detection tool the team could reuse.",
  },
  {
    when: "FIS Global · team hackathon",
    title: "Leading people more senior than me.",
    body: "In an org-wide hackathon I led a team of six, four of them senior leads, to build an LLM query optimizer. It scored three rewrites per query and fell back safely when none passed validation. It cut estimated SQL execution time by about 35%, and the team adopted it into its workflow.",
  },
  {
    when: "ArthRakshak · 2026",
    title: "Letting users change the product.",
    body: "It started as investment advice for informal earners. After ten user interviews we reframed it as a pre-loan safety check, a product that will sometimes say “don't take this loan.” Eight sprints later it ran as a 50-user pilot with gig workers and kirana owners.",
  },
];

export default function AboutStory() {
  return (
    <section id="section-about" className="ds-section story-section abs" aria-labelledby="abs-title">
      <div className="ds-container abs__grid">
        <figure className="abs__photo">
          <Image src={personal.profilePhoto} alt={personal.name} fill sizes="(max-width: 900px) 90vw, 420px" />
        </figure>

        <div className="abs__text">
          <p className="ds-kicker"><span>About</span></p>
          <h2 id="abs-title" className="abs__title">
            I started as a trainee fixing bank data. Now I build AI that <em>knows when to say no.</em>
          </h2>

          <ol className="abs__stories">
            {STORIES.map((s) => (
              <li key={s.title} className="abs__story">
                <p className="abs__when">{s.when}</p>
                <h3 className="abs__storytitle">{s.title}</h3>
                <p className="abs__body">{s.body}</p>
              </li>
            ))}
          </ol>

          <p className="abs__now">
            What I want next: a team where I make the product call <em>and</em> build the system behind it.
          </p>

          <dl className="abs__facts">
            <div><dt>Based in</dt><dd>{personal.location}</dd></div>
            <div><dt>Can start</dt><dd>{personal.noticePeriod}</dd></div>
            <div><dt>Works</dt><dd>Remote-first or hybrid; Bangalore on-site for the right role</dd></div>
            <div><dt>Studied</dt><dd>{education.degree.school}, AI/ML honours · BITSoM, product management with GenAI</dd></div>
          </dl>

          <div className="abs__actions">
            <ResumeButton className="ds-btn ds-btn--primary"><FileText size={16} aria-hidden /> Read the résumé</ResumeButton>
            <a className="ds-btn ds-btn--ghost" href={personal.resumeUrl} download>Download PDF</a>
          </div>
        </div>
      </div>
    </section>
  );
}
