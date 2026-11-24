
// Section chrome for the design system (design-system/MASTER.md §4).
// "split": a sticky label column (index, kicker, title, thesis) on the left
// and the evidence on the right. "split-reverse" mirrors it so neighbouring
// sections never look alike. "stack" is a full-width header for sections whose
// content needs the whole measure (the decision film, the radar).
//
// No backgrounds, rails or borders: every section sits on one continuous
// surface. Titles animate transform only, so they paint on the first frame.

import { ReactNode } from "react";
import Reveal from "./Reveal";

export type SectionLayout = "split" | "split-reverse" | "stack";

export default function SectionShell({
  id,
  kicker,
  title,
  subtitle,
  index,
  layout = "split",
  aside,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  subtitle?: string;
  /** Two-character chapter number shown above the kicker, e.g. "03". */
  index?: string;
  layout?: SectionLayout;
  /** Extra content under the thesis in the sticky column (a CTA, a legend). */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const header = (
    <header className="ds-section__head">
      <Reveal>
        <p className="ds-kicker">
          {index && <span className="ds-kicker__index">{index}</span>}
          <span>{kicker}</span>
        </p>
        <h2 className="ds-h2">{title}</h2>
        {subtitle && <p className="ds-lead">{subtitle}</p>}
        {aside && <div className="ds-section__aside">{aside}</div>}
      </Reveal>
    </header>
  );

  return (
    <section id={id} className={`ds-section story-section ds-section--${layout}`}>
      <div className="ds-container ds-section__grid">
        {header}
        <div className="ds-section__body">{children}</div>
      </div>
    </section>
  );
}
