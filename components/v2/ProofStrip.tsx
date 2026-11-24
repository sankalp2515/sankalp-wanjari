
// Four verified numbers straight after the hero. Each names its source so a
// reviewer can trace it; values come from config/portfolio.ts proofMetrics.

import { proofMetrics } from "@/config/portfolio";
import Metric from "./Metric";

export default function ProofStrip() {
  return (
    <section id="section-proof" className="proof3" aria-label="Evidence in numbers">
      <div className="ds-container">
        <ul className="proof3__grid">
          {proofMetrics.map((m) => (
            <li key={m.label} className="proof3__item">
              <p className="proof3__value"><Metric value={m.value} /></p>
              <p className="proof3__label">{m.label}</p>
              <p className="proof3__source">{m.source}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
