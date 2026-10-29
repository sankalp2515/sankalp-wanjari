import Link from "next/link";

export default function ReliabilityPreview() {
  return <aside className="max-w-5xl mx-auto px-5 pb-16" aria-label="Reliability and safety evidence">
    <div className="rounded-2xl border p-6 sm:p-8" style={{ borderColor: "var(--os-border)", background: "var(--os-bg-surface)" }}>
      <p className="text-sm mb-3" style={{ color: "var(--os-accent)" }}>Reliability & Safety</p>
      <h2 className="font-display text-2xl sm:text-3xl mb-3">How I test the boundaries.</h2>
      <p className="text-sm leading-relaxed max-w-2xl mb-5" style={{ color: "var(--os-text-secondary)" }}>Agent permissions, adversarial evaluation and inspectable evidence. Read the methods, reported results and limitations behind the demos.</p>
      <Link href="/reliability" className="inline-flex items-center min-h-11 underline underline-offset-4" style={{ color: "var(--os-accent-cyan)" }}>Inspect the evidence and open questions</Link>
    </div>
  </aside>;
}
