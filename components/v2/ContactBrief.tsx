"use client";

// ContactBrief — the closing section (premium pass, config/premiumPass.ts:
// CONTACT_BRIEF). The CTA thinking: a recruiter who likes the portfolio still
// has to sell the candidate to a hiring manager, so the section does that work
// for them.
//
//   left   "Let's talk." · the email as the headline (click to copy) · the
//          practical answers (reply time, notice, where) · three direct actions
//   right  The forwardable brief: pick the role you're hiring for and get a
//          five-line candidate summary, every line a fact from the record,
//          ready to copy or send to a colleague in one click.
//   below  a short note form for anyone who prefers it (same /api/contact).
//
// Motion is small and purposeful: the brief's lines re-set with a stagger when
// the role changes; the email's underline draws on hover. Reduced motion: none.

import { useState } from "react";
import { Check, Copy, Forward, ArrowUpRight, Send, Loader2 } from "lucide-react";
import { personal, social } from "@/config/portfolio";
import { LinkedinIcon, GithubIcon } from "@/components/ui/Icons";

type Role = "engineer" | "product" | "hybrid";

const ROLES: { id: Role; label: string; title: string }[] = [
  { id: "engineer", label: "AI Engineer", title: "AI Engineer" },
  { id: "product", label: "AI Product Engineer", title: "AI Product Engineer" },
  { id: "hybrid", label: "Both", title: "AI Engineer / AI Product Engineer" },
];

// Every line restates config/portfolio.ts (experience, projects, achievements,
// case studies, education). Nothing here is new.
const LINES: Record<string, string> = {
  fis: "3 years at FIS Global building software for U.S. and U.K. bank clients; his extraction framework cut manual data entry by 90% across 50+ document layouts.",
  lead: "Led a team of 6 (4 of them senior leads) to an LLM query optimizer that cut estimated SQL time ~35% and was adopted into the team's workflow.",
  intentseal: "Built IntentSeal, an agent-security firewall: 99.2% recall on 359 prompt-injection attacks; 2nd nationally at the ET AI Hackathon (judged by The Economic Times and Accenture).",
  rank: "7th of 3,062 finalists at HackerRank Orchestrate, a 24-hour AI build.",
  stack: "Works in Python, LangGraph, FastAPI, PyTorch, Docker, Qdrant and MLflow.",
  arth: "Reframed ArthRakshak from investment advice to a pre-loan safety check after 10 user interviews, then ran a 50-user pilot.",
  bits: "B.E. Computer Engineering (AI/ML honours), IIIT Pune; Product Management with GenAI & Agentic AI, BITSoM.",
};
const BRIEF: Record<Role, string[]> = {
  engineer: ["fis", "intentseal", "rank", "stack"],
  product: ["arth", "lead", "intentseal", "bits"],
  hybrid: ["fis", "arth", "intentseal", "lead"],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactBrief() {
  const [role, setRole] = useState<Role>("hybrid");
  const [copied, setCopied] = useState<"email" | "brief" | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [botcheck, setBotcheck] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const r = ROLES.find((x) => x.id === role)!;
  const head = `${personal.name.replace(" Kailash", "")} · ${r.title}`;
  const meta = `${personal.location} · notice ${personal.noticePeriod.toLowerCase()} · remote-first or hybrid`;
  const bullets = BRIEF[role].map((k) => LINES[k]);
  const briefText = `${head}\n${meta}\n\n${bullets.map((b) => `• ${b}`).join("\n")}\n\nPortfolio: ${social.website}\nEmail: ${personal.email}`;

  const copy = async (what: "email" | "brief") => {
    try {
      await navigator.clipboard.writeText(what === "email" ? personal.email : briefText);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch { /* text is visible and selectable anyway */ }
  };

  const forward = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Candidate: ${head}`)}&body=${encodeURIComponent(briefText)}`;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !EMAIL_RE.test(form.email) || !form.message.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), subject: "Portfolio note", message: form.message.trim(), botcheck }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <section id="section-contact" className="ds-section story-section cbr" aria-labelledby="cbr-title">
      <div className="ds-container">
        <div className="cbr__grid">
          <div className="cbr__left">
            <p className="ds-kicker"><span>Contact</span></p>
            <h2 id="cbr-title" className="cbr__title">Let&rsquo;s talk<span aria-hidden>.</span></h2>

            <button type="button" className="cbr__email" onClick={() => copy("email")}>
              <span className="cbr__emailtext">{personal.email}</span>
              <span className="cbr__emailhint">{copied === "email" ? <><Check size={15} aria-hidden /> Copied</> : <><Copy size={15} aria-hidden /> Copy</>}</span>
            </button>

            <dl className="cbr__facts">
              <div><dt>Reply</dt><dd>Within 24 hours</dd></div>
              <div><dt>Can start</dt><dd>{personal.noticePeriod}</dd></div>
              <div><dt>Where</dt><dd>{personal.location} · remote-first or hybrid</dd></div>
            </dl>

            <div className="cbr__actions">
              <a className="ds-btn ds-btn--primary" href={`mailto:${personal.email}?subject=${encodeURIComponent("Hello from your portfolio")}`}>
                Write an email <ArrowUpRight size={16} aria-hidden />
              </a>
              <a className="ds-btn ds-btn--ghost" href={social.linkedin} target="_blank" rel="noopener noreferrer"><LinkedinIcon size={16} /> LinkedIn</a>
              <a className="ds-btn ds-btn--ghost" href={social.github} target="_blank" rel="noopener noreferrer"><GithubIcon size={16} /> GitHub</a>
            </div>
          </div>

          <div className="cbr__brief">
            <div className="cbr__briefhead">
              <p className="cbr__brieftitle">Need to pitch him internally?</p>
              <p className="cbr__briefsub">Pick the role. This is the summary to forward, every line from the record.</p>
              <div className="cbr__roles" role="radiogroup" aria-label="Role you are hiring for">
                {ROLES.map((x) => (
                  <button key={x.id} type="button" role="radio" aria-checked={role === x.id} className="cbr__role" onClick={() => setRole(x.id)}>
                    {x.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cbr__doc" key={role} aria-live="polite">
              <p className="cbr__dochead">{head}</p>
              <p className="cbr__docmeta">{meta}</p>
              <ul>
                {bullets.map((b, i) => <li key={b} style={{ animationDelay: `${i * 70}ms` }}>{b}</li>)}
              </ul>
            </div>

            <div className="cbr__briefactions">
              <button type="button" className="ds-btn ds-btn--primary" onClick={() => copy("brief")}>
                {copied === "brief" ? <><Check size={16} aria-hidden /> Copied</> : <><Copy size={16} aria-hidden /> Copy the brief</>}
              </button>
              <button type="button" className="ds-btn ds-btn--ghost" onClick={forward}>
                <Forward size={16} aria-hidden /> Email it to a colleague
              </button>
            </div>
          </div>
        </div>

        <form className="cbr__note" onSubmit={send} aria-label="Leave a note">
          {status === "sent" ? (
            <p className="cbr__sent" role="status"><Check size={18} aria-hidden /> Sent. Sankalp replies within 24 hours, to {form.email}.</p>
          ) : (
            <>
              <p className="cbr__notelabel">Or leave a note</p>
              <input type="text" name="botcheck" value={botcheck} onChange={(e) => setBotcheck(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="cbr__hp" />
              <label className="sr-only" htmlFor="cbr-name">Your name</label>
              <input id="cbr-name" required placeholder="Your name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label className="sr-only" htmlFor="cbr-email">Your email</label>
              <input id="cbr-email" required type="email" placeholder="you@company.com" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <label className="sr-only" htmlFor="cbr-msg">Message</label>
              <input id="cbr-msg" required placeholder="The role, the team, the timeline…" maxLength={4000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <button type="submit" className="ds-btn ds-btn--primary" disabled={status === "sending"} aria-label="Send note">
                {status === "sending" ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
              </button>
              {status === "failed" && (
                <p className="cbr__fail" role="alert">
                  It didn&apos;t go through. <a href={`mailto:${personal.email}?body=${encodeURIComponent(form.message)}`}>Send it by email instead</a>.
                </p>
              )}
            </>
          )}
        </form>
      </div>
    </section>
  );
}
