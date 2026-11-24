// About — who Sankalp is (server component; the reel is the only client island).
//
// A full-width motion stage leads: a Remotion-rendered loop (AboutReel) of
// Sankalp inside a turning ring while verified facts surface around him, with
// his status card pinned on top. Below it, the bio reads itself: as each line scrolls up, its words turn from muted to
// ink, and the key phrases get an amber underline that draws in. All of it is a
// CSS scroll-driven animation (animation-timeline: view()), so it costs no
// JavaScript and runs off the main thread. Browsers without scroll timelines,
// and reduced motion, show the finished text. Replaces the old BioScanner,
// which ran a per-frame JS magnifier.

import { FileText, MapPin } from "lucide-react";
import { personal, education } from "@/config/portfolio";
import SectionShell from "./SectionShell";
import Metric from "./Metric";
import ResumeButton from "./ResumeButton";
import AboutReel from "./AboutReel";

// Split a paragraph into words, marking the ones inside a key phrase.
function words(paragraph: string, phrases: string[]) {
  const marks = new Array(paragraph.length).fill(false);
  for (const p of phrases) {
    const at = paragraph.indexOf(p);
    if (at >= 0) for (let i = at; i < at + p.length; i++) marks[i] = true;
  }
  const out: { w: string; key: boolean }[] = [];
  const re = /\S+/g;
  let mt: RegExpExecArray | null;
  while ((mt = re.exec(paragraph))) out.push({ w: mt[0], key: marks[mt.index] });
  return out;
}

export default function AboutSection() {
  const paragraphs = personal.bio.split(/\n\s*\n/);
  return (
    <SectionShell
      layout="stack"
      index="06"
      id="section-about"
      kicker="About"
      title="The person behind the systems."
      subtitle={personal.tagline}
      aside={
        <div className="about3__actions">
          <ResumeButton className="ds-btn ds-btn--primary">
            <FileText size={16} aria-hidden /> See the full record
          </ResumeButton>
          <a className="ds-btn ds-btn--ghost" href={personal.resumeUrl} download>Download PDF</a>
        </div>
      }
    >
      <div className="about3 about3--stage">
        <figure className="about3__stage">
          <AboutReel alt={`${personal.name}, surrounded by verified milestones from education, FIS and national hackathons`} />
          <figcaption className="about3__card">
            <p className="about3__name">{personal.name}</p>
            <p className="about3__roles">{personal.roles.join(" · ")}</p>
            <p className="about3__status"><i aria-hidden /> {personal.availability} · {personal.noticePeriod}</p>
            <p className="about3__loc"><MapPin size={13} aria-hidden /> {personal.location}</p>
          </figcaption>
        </figure>

        <div className="about3__text">
          {paragraphs.map((p, pi) => (
            <p key={pi} className="about3__para">
              {words(p, personal.bioKeywords).map((t, i) => (
                <span key={i} className={t.key ? "about3__w about3__w--key" : "about3__w"}>{t.w} </span>
              ))}
            </p>
          ))}

          <ul className="about3__stats">
            {personal.stats.map((s) => (
              <li key={s.label}>
                <p className="about3__stat"><Metric value={s.value} /></p>
                <p className="about3__statlabel">{s.label}</p>
              </li>
            ))}
          </ul>

          <p className="about3__edu">
            <span className="ds-label">Education</span>
            {education.degree.title}, {education.degree.school} (CGPA 8.54) · {education.featuredCert.title}, {education.featuredCert.issuer}
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
