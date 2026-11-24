"use client";

// Career, told as a migration log (Sankalp's FIS work was data migration).
//
// Left, sticky: the current year in large type and a to-scale 2020 → now bar
// where every role is a segment of its real length, so the gaps and the jumps
// are honest. Right: one log record per role, oldest first, each with its
// headline number and the work as checked log lines. The last record, "Now",
// is assembled from the featured certification and the ranked achievements;
// nothing in it is new copy.
//
// The active record is picked by an IntersectionObserver; reduced motion keeps
// everything static.

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { experience, education, achievements } from "@/config/portfolio";
import SectionShell from "./SectionShell";

type Entry = {
  key: string;
  start: Date;
  end: Date | null;
  title: string;
  org: string;
  place: string;
  metric?: { value: string; label: string };
  lines: string[];
  tags: string[];
};

const month = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

const lastJob = experience.reduce((a, b) => (new Date(b.endDate ?? 0) > new Date(a.endDate ?? 0) ? b : a));
const lead = achievements[0];

const ENTRIES: Entry[] = [
  ...[...experience]
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((e) => ({
      key: `${e.company}-${e.title}`,
      start: new Date(e.date),
      end: e.endDate ? new Date(e.endDate) : null,
      title: e.title,
      org: e.company,
      place: e.location,
      metric: e.metric,
      lines: e.highlights,
      tags: e.tags,
    })),
  {
    key: "now",
    start: new Date(lastJob.endDate ?? lastJob.date),
    end: null,
    title: "AI products, built and judged in public",
    org: "Independent",
    place: "India",
    metric: lead ? { value: lead.rank, label: `${lead.event.replace(/ 20\d\d$/, "")}, nationally` } : undefined,
    lines: [
      `${education.featuredCert.title}, ${education.featuredCert.issuer}`,
      ...achievements.map((a) => `${a.title}: ${a.event} (${a.project})`),
    ],
    tags: ["Agents", "Evaluation", "Product strategy"],
  },
];

const T0 = ENTRIES[0].start.getTime();
// Month-aligned so the server and the browser compute the same bar.
const T1 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
const pct = (t: number) => ((t - T0) / (T1 - T0)) * 100;

export default function CareerSection(_props: { variant?: "a" | "b" } = {}) {
  void _props;
  const [active, setActive] = useState(ENTRIES.length - 1);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-i]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const cur = ENTRIES[active];
  const year = cur.end ? `${cur.start.getFullYear()}` : "Now";

  return (
    <SectionShell
      layout="stack"
      index="07"
      id="section-arc"
      kicker="The arc"
      title="A career, read as a migration log."
      subtitle="Three years of enterprise data migration at FIS, then the same discipline pointed at AI. Scroll the log: the year and the to-scale bar follow you."
    >
      <div className="arc3">
        <aside className="arc3__rail" aria-hidden>
          <p className="arc3__year" key={year}>{year}</p>
          <p className="arc3__role">{cur.title}</p>
          <p className="arc3__org">{cur.org}</p>
          <div className="arc3__bar">
            {ENTRIES.map((e, i) => {
              const l = pct(e.start.getTime());
              const r = pct(e.end ? e.end.getTime() : T1);
              return (
                <span
                  key={e.key}
                  className={`arc3__seg${i === active ? " is-on" : ""}${e.key === "now" ? " is-now" : ""}`}
                  style={{ left: `${l}%`, width: `${Math.max(1.5, r - l)}%` }}
                />
              );
            })}
          </div>
          <div className="arc3__ticks">
            {Array.from({ length: new Date(T1).getFullYear() - ENTRIES[0].start.getFullYear() + 1 }, (_, k) => {
              const y = ENTRIES[0].start.getFullYear() + k;
              const left = Math.max(0, pct(new Date(`${y}-01-01`).getTime()));
              return <span key={y} style={{ left: `${left}%` }}>{String(y).slice(2)}</span>;
            })}
          </div>
        </aside>

        <ol ref={listRef} className="arc3__log">
          {ENTRIES.map((e, i) => (
            <li key={e.key} data-i={i} className={`arc3__rec${i === active ? " is-on" : ""}${e.key === "now" ? " is-now" : ""}`}>
              <p className="arc3__stamp">
                <span>{month(e.start)} → {e.end ? month(e.end) : "present"}</span>
                <span>{e.place}</span>
              </p>
              <div className="arc3__headrow">
                <div>
                  <h3 className="arc3__title">{e.title}</h3>
                  <p className="arc3__company">{e.org}</p>
                </div>
                {e.metric && (
                  <p className="arc3__metric">
                    <b>{e.metric.value}</b>
                    <span>{e.metric.label}</span>
                  </p>
                )}
              </div>
              <ul className="arc3__lines">
                {e.lines.map((l, k) => (
                  <li key={l} style={{ ["--k" as string]: k }}>
                    <Check size={14} aria-hidden />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
              <p className="arc3__tags">{e.tags.join(" · ")}</p>
            </li>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}
