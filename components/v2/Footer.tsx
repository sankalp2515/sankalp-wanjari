// Site footer (server component). Big-wordmark pattern: a closing line with
// one primary action, three link columns, then the name set across the full
// width, its letters rising into place as the footer scrolls in (CSS scroll
// timeline; finished state without support or with reduced motion).

import { ArrowUp, ArrowUpRight } from "lucide-react";
import { personal, social, projects, flagshipIds } from "@/config/portfolio";
import { CONTACT_BRIEF } from "@/config/premiumPass";

const NAV = [
  ["Decisions", "#section-decisions"],
  ["Work", "#section-work"],
  ["Case studies", "#section-cases"],
  ["AI Radar", "#section-radar"],
  ["Achievements", "#section-achievements"],
  ["About", "#section-about"],
  ["Career", "#section-arc"],
  ["Reliability", "#section-reliability"],
  ["Contact", "#section-contact"],
] as const;

export default function Footer() {
  const flagships = flagshipIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as typeof projects;
  const elsewhere = [
    ["GitHub", social.github],
    ["LinkedIn", social.linkedin],
    ["Résumé (PDF)", personal.resumeUrl],
    ["Reliability methods", "/reliability"],
  ].filter(([, href]) => href);
  const letters = personal.shortName.split("");

  return (
    <footer className="foot3" {...(CONTACT_BRIEF ? { "aria-label": "Site footer" } : { "aria-labelledby": "foot3-title" })}>
      <div className="ds-container">
        {!CONTACT_BRIEF && <div className="foot3__top">
          <h2 id="foot3-title" className="foot3__line">Hiring for an AI product role? Let&apos;s talk about the decision, not the demo.</h2>
          <a className="ds-btn ds-btn--primary foot3__cta" href="#section-contact">
            Start a conversation <ArrowUpRight size={16} aria-hidden />
          </a>
        </div>}

        <div className="foot3__cols">
          <nav aria-label="Footer">
            <p className="ds-label">Sections</p>
            <ul>{NAV.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
          </nav>
          <div>
            <p className="ds-label">Flagship work</p>
            <ul>{flagships.map((p) => <li key={p.id}><a href="#section-work">{p.name}</a></li>)}</ul>
          </div>
          <div>
            <p className="ds-label">Elsewhere</p>
            <ul>
              {elsewhere.map(([label, href]) => (
                <li key={label}>
                  <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {label}{href.startsWith("http") && <ArrowUpRight size={13} aria-hidden />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot3__status">
            <p className="ds-label">Status</p>
            <p><i aria-hidden /> {personal.availability}</p>
            <p>{personal.noticePeriod}</p>
            <p>{personal.location}</p>
          </div>
        </div>
      </div>

      <p className="foot3__mark" aria-hidden>
        {letters.map((l, i) => <span key={i} style={{ ["--i" as string]: i }}>{l}</span>)}
      </p>

      <div className="ds-container foot3__bar">
        <span>© {new Date().getFullYear()} {personal.name}</span>
        <span>Résumé updated {personal.resumeUpdated}</span>
        <a href="#top" className="foot3__up">Back to top <ArrowUp size={14} aria-hidden /></a>
      </div>
    </footer>
  );
}
