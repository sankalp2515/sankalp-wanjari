import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ControlBoundary, EvidenceThemeToggle } from "@/components/v2/EvidenceVisuals";
import { reliabilityStudies } from "@/config/reliability";
import { projects } from "@/config/portfolio";
import styles from "./evidence.module.css";

export const metadata: Metadata = {
  title: "Reliability & Safety | Sankalp Wanjari",
  description: "Agent permissions, adversarial evaluation and inspectable evidence. Engineering decisions, reported results, limitations and open questions.",
};

export default function ReliabilityPage() {
  return <div className={styles.page}>
    <nav className={styles.nav} aria-label="Evidence navigation"><Link href="/" className={styles.brand} aria-label="Sankalp portfolio">SKW</Link><Link href="/">← Portfolio</Link><Link href="/#section-work">All engineering projects</Link><Link href="/reliability/intent-bound-controls">Read the technical note</Link><EvidenceThemeToggle /></nav>
    <header className={`${styles.hero} ${styles.visualHero}`}><div>
      <p className={styles.eyebrow}>Sankalp Wanjari / Engineering evidence</p>
      <h1>Useful agents need boundaries you can inspect.</h1>
      <p className={styles.lead}>I build AI products, then ask what can go wrong: who authorises an action, what supports an answer, and what happens when the evidence changes?</p>
      <p>This is a focused view of my work in reliability and safety. My broader work also covers ML orchestration, model evaluation, developer tools and product workflows.</p>
      <div className={styles.links}><Link href="/#section-work">Explore the full portfolio</Link><Link href="/#section-research">Earlier publications</Link></div>
    </div><ControlBoundary /></header>
    <nav className={styles.index} aria-label="Evidence index">{reliabilityStudies.map(study => {
      const project = projects.find(item => item.id === study.projectId)!;
      return <a key={study.slug} href={`#${study.slug}`}>
        {project.poster && <Image src={project.poster} alt="" width={1672} height={941} sizes="(max-width:600px) 100vw, 580px" className={styles.projectPoster} />}
        <strong>{study.name}</strong><span>{study.question}</span>
      </a>;
    })}</nav>
    <aside className={styles.notice}><strong>How to read the evidence</strong><p>Results below come from linked repository reports, not new experiments run for this page. Detection recall, execution containment, workflow checks and user outcomes are different claims. Small internal suites do not establish general safety.</p></aside>
    {reliabilityStudies.map(study => {
      const project = projects.find(item => item.id === study.projectId)!;
      return <article className={styles.study} id={study.slug} key={study.slug}>
        <div className={styles.studyHeader}><div><p className={styles.eyebrow}>{study.name}</p><h2>{study.question}</h2><p>{study.contribution}</p></div>{project.poster && <Image src={project.poster} alt={`${study.name} product illustration`} width={1672} height={941} sizes="(max-width:950px) 100vw, 500px" />}</div>
        <dl className={styles.rows}>
          <div className={styles.row}><dt>Threat / failure mode</dt><dd>{study.threat}</dd></div>
          <div className={styles.row}><dt>Evaluation approach</dt><dd>{study.method}</dd></div>
          <div className={styles.row}><dt>Reported evidence</dt><dd><strong>{study.result}</strong></dd></div>
          <div className={styles.row}><dt>Limits</dt><dd>{study.limitation}</dd></div>
          <div className={styles.row}><dt>Provenance</dt><dd>{study.provenance}</dd></div>
          <div className={styles.row}><dt>Next experiment<br />(not yet run)</dt><dd>{study.next}</dd></div>
        </dl>
        <details><summary>My contribution</summary><p>{project.breakdown.role}</p></details>
        <div className={styles.links}><Link href={`/work/${project.shortName}`}>Project breakdown</Link><a href={project.github} target="_blank" rel="noreferrer">Source repository ↗</a>{study.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
      </article>;
    })}
    <section className={styles.note}><h2>The question I want to test next</h2><p>How much protection comes from recognising an attack, and how much comes from independently limiting what an agent can do? The next step is a controlled comparison that measures legitimate work as carefully as unauthorised execution.</p><Link href="/reliability/intent-bound-controls">Read the engineering note and proposed experiment</Link></section>
    <footer><Link href="/#section-contact">Discuss a research or engineering opportunity</Link><p>Open to AI engineering, AI product and applied research opportunities.</p></footer>
  </div>;
}
