"use client";

import { useState } from "react";
import { ArrowRight, FileText, Fingerprint, ShieldCheck, Wrench, Check, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "@/app/reliability/evidence.module.css";

export function EvidenceThemeToggle() {
  const { theme, toggle } = useTheme();
  return <button className={styles.themeButton} onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>;
}

export function ControlBoundary() {
  const [injected, setInjected] = useState(false);
  return <figure className={styles.boundary}>
    <figcaption><span><ShieldCheck size={16} /> The execution boundary</span><small>Interactive illustration · not a live evaluation</small></figcaption>
    <div className={styles.scenarios} role="group" aria-label="Illustrative request scenario">
      <button aria-pressed={!injected} onClick={() => setInjected(false)}>Authorised request</button>
      <button aria-pressed={injected} onClick={() => setInjected(true)}>Injected request</button>
    </div>
    <div className={styles.contract}><Fingerprint size={18} /><div><small>Employee-confirmed permission</small><strong>Read order 4521. Refund up to ₹2,000.</strong></div></div>
    <div className={styles.flow}>
      <div className={styles.flowNode}><FileText size={24} /><strong>Input</strong><small>{injected ? "Ticket adds an instruction" : "Employee requests refund"}</small></div>
      <ArrowRight className={styles.connector} size={18} aria-hidden />
      <div className={styles.flowNode}><Fingerprint size={24} /><strong>Detector</strong><small>May miss an attack</small></div>
      <ArrowRight className={styles.connector} size={18} aria-hidden />
      <div className={`${styles.flowNode} ${styles.gate}`}><ShieldCheck size={28} /><strong>Action gate</strong><small>Checks authority</small></div>
      <ArrowRight className={styles.connector} size={18} aria-hidden />
      <div className={styles.flowNode}><Wrench size={24} /><strong>Tool</strong><small>{injected ? "Different order requested" : "Within approved scope"}</small></div>
    </div>
    <div className={styles.decision} data-blocked={injected} aria-live="polite" aria-atomic="true">
      {injected ? <X size={21} /> : <Check size={21} />}<div><strong>{injected ? "Blocked: order 9921 is outside scope" : "Allowed: refund order 4521 · ₹1,850"}</strong><p>{injected ? "A document cannot expand the employee’s permission. The action stops even if detection misses it." : "The action matches the confirmed record and amount. The legitimate task can continue."}</p></div>
    </div>
    <p className={styles.figureNote}>Illustrates a trusted, correctly configured gate. Incorrect permissions or a compromised execution layer remain failure modes.</p>
  </figure>;
}

export function EvaluationVisual() {
  return <div className={styles.evaluationVisual}>
    <section><p className={styles.eyebrow}>IntentSeal / detection</p><h3>Different inputs, different results.</h3>
      <div className={styles.barLabel}><span>Third-party content · 359 attacks</span><strong>99.2%</strong></div><div className={styles.bar}><span style={{ width: "99.2%" }} /></div>
      <div className={styles.barLabel}><span>Direct turns · 442 cases</span><strong>68.1%</strong></div><div className={styles.bar}><span style={{ width: "68.1%" }} /></div>
      <p className={styles.figureNote}>Recall, not execution safety. The report’s joint acceptance target was not met. Hard-benign false-positive rate: 5.1% (39 cases).</p>
    </section>
    <section><p className={styles.eyebrow}>Abide / execution outcome</p><h3>Count actions. Preserve useful work.</h3><div className={styles.outcomes}><div><strong>0<span>/28</span></strong><p>Attacked scenarios with unauthorised execution</p></div><div><strong>26<span>/26</span></strong><p>Normal tasks completed</p></div></div><p className={styles.figureNote}>Internally authored suite. Reported 95% attack-outcome interval: 0–12%. Related implementation, not independent replication.</p></section>
  </div>;
}

export function ExperimentMatrix() {
  return <figure className={styles.matrix}><figcaption>Four conditions. One matched evaluation.</figcaption><p>Proposed comparison · no results yet</p><div className={styles.matrixGrid}>{[
    ["No protection", "Detector off", "Gate off"], ["Detector only", "Detector on", "Gate off"], ["Gate only", "Detector off", "Gate on"], ["Combined", "Detector on", "Gate on"],
  ].map(([name, detector, gate]) => <div key={name}><strong>{name}</strong><span>{detector}</span><span>{gate}</span></div>)}</div><p className={styles.figureNote}>Hold model, task instances, tools and attacker budget constant. Score executed effects and legitimate completion.</p></figure>;
}
