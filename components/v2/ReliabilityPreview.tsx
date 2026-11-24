// Reliability & safety — a design-system section (server component).
// Three evidence cards restate published results from config/portfolio.ts
// (projects 007 / 008 / 009 breakdowns), including what fell short, then link
// to the full methods page. No client JS: the numbers use the shared Metric
// island only for the count-up.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionShell from "./SectionShell";
import Metric from "./Metric";

const EVIDENCE: { project: string; value: string; claim: string; shortfall: string }[] = [
  {
    project: "IntentSeal",
    value: "99.2%",
    claim: "recall on 359 third-party-content prompt-injection attacks.",
    shortfall: "Direct-turn recall is 68.1%, with 5.1% false positives on hard benign cases.",
  },
  {
    project: "Abide",
    value: "256/256",
    claim: "tampering probes caught; 0/28 attacks caused an unauthorised action.",
    shortfall: "Its own 64-scenario suite, not proof of general safety.",
  },
  {
    project: "CaseProof",
    value: "51",
    claim: "public-cloud browser checks passed across customer, analyst and reviewer journeys.",
    shortfall: "A synthetic staging prototype: no real bank integrations.",
  },
];

export default function ReliabilityPreview() {
  return (
    <SectionShell
      id="section-reliability"
      index="08"
      layout="split-reverse"
      kicker="Reliability & safety"
      title="How I test the boundaries."
      subtitle="Agent permissions, adversarial evaluation and inspectable evidence. Every number comes with the limit it doesn't cover."
      aside={
        <Link href="/reliability" className="ds-btn ds-btn--primary">
          Inspect methods & limits <ArrowRight size={16} aria-hidden />
        </Link>
      }
    >
      <ul className="rel3">
        {EVIDENCE.map((e) => (
          <li key={e.project} className="rel3__card">
            <p className="ds-label">{e.project}</p>
            <p className="rel3__value"><Metric value={e.value} /></p>
            <p className="rel3__claim">{e.claim}</p>
            <p className="rel3__limit"><span className="ds-label">Limit</span>{e.shortfall}</p>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
