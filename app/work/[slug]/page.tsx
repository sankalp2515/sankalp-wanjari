import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/config/portfolio";
import { reliabilityStudies } from "@/config/reliability";
import styles from "../../reliability/evidence.module.css";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return projects.map(project => ({ slug: project.shortName })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find(item => item.shortName === slug);
  return { title: project ? `${project.name} | Sankalp Wanjari` : "Project not found", description: project?.description };
}
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find(item => item.shortName === slug);
  if (!project) notFound();
  const evidence = reliabilityStudies.find(study => study.projectId === project.id);
  return <article className={styles.page}>
    <nav className={styles.nav} aria-label="Project navigation"><Link href="/#section-work">← All projects</Link><Link href="/reliability">Reliability & Safety</Link><Link href="/#section-contact">Contact</Link></nav>
    <header className={styles.hero}><p className={styles.eyebrow}>{project.category} / {project.status}</p><h1>{project.name}</h1><p className={styles.lead}>{project.description}</p><p>{project.longDescription}</p><div className={styles.links}><a href={project.github}>Source repository</a>{project.liveUrl && <a href={project.liveUrl}>Open project demonstration</a>}</div></header>
    <section className={styles.note}><h2>My contribution</h2><p>{project.breakdown.role}</p><p>{project.stack.join(" · ")}</p></section>
    <section className={styles.note}><h2>The problem</h2><p>{project.breakdown.problem}</p><h2>The approach</h2><p>{project.breakdown.approach}</p></section>
    <section className={styles.note}><h2>Reported outcomes</h2><ul>{project.breakdown.results.map(result => <li key={result}>{result}</li>)}</ul><p>{project.breakdown.lessons}</p></section>
    {evidence && <section className={styles.note}><h2>Evidence and limits</h2><p>{evidence.limitation}</p><p>{evidence.provenance}</p><Link href={`/reliability#${evidence.slug}`}>Inspect the method, sources and next experiment</Link></section>}
    <footer><Link href="/#section-work">Back to the full portfolio</Link></footer>
  </article>;
}
