"use client";

// ContactLetter — the closing section as a note the visitor finishes instead
// of a form they fill (premium pass, config/premiumPass.ts: CONTACT_LETTER).
//
//  • The message is one sentence with blanks; it reads as a finished note as
//    soon as it is typed, so writing to Sankalp costs four words, not a form.
//  • A stamp in the corner fills as the blanks do ("2/3"); when it is
//    complete the stamp turns amber and the send button wakes up.
//  • Sending folds the note and sends it off, then a postmark confirms.
//  • Beside it, three ways in ranked by how long they take (5 s, 1 min, 2 min),
//    and a live India-time clock so the visitor knows when a reply is likely.
//
// Posts to /api/contact exactly as before (honeypot, 10 s timeout, mailto
// fallback). Reduced motion: no fold, the postmark simply appears.

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, MessageCircleQuestion, FileText, ArrowUpRight, Send, Loader2, Plus } from "lucide-react";
import { personal, social } from "@/config/portfolio";
import { GithubIcon, LinkedinIcon } from "@/components/ui/Icons";
import { useConcierge } from "@/contexts/ConciergeContext";

const ABOUT = [
  "an AI Product Manager role",
  "an AI Engineer role",
  "a hybrid AI PM / Engineer role",
  "a contract or freelance project",
  "a research collaboration",
];
const NEXT = [
  "set up a 20-minute call",
  "share the job description",
  "send over a case or take-home",
  "just say hello",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Blank({ id, label, value, onChange, placeholder, type = "text" }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <span className="ltr__blank">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: `${Math.max(placeholder.length, value.length) * 0.56 + 0.6}em` }}
        autoComplete={type === "email" ? "email" : id === "l-name" ? "name" : "organization"}
        spellCheck={false}
      />
    </span>
  );
}

function useIndiaClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    const tick = () => setT(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function ContactLetter() {
  const { ask } = useConcierge();
  const clock = useIndiaClock();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [about, setAbout] = useState(ABOUT[0]);
  const [next, setNext] = useState(NEXT[0]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [botcheck, setBotcheck] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [copied, setCopied] = useState(false);

  const filled = [name.trim(), company.trim(), EMAIL_RE.test(email) ? email : ""].filter(Boolean).length;
  const ready = !!name.trim() && EMAIL_RE.test(email);

  const sentence = useMemo(() => {
    const who = `I'm ${name.trim() || "…"}${company.trim() ? ` from ${company.trim()}` : ""}`;
    return `Hi Sankalp, ${who}. I'm reaching out about ${about}, and I'd like to ${next}. You can reach me at ${email.trim() || "…"}.`;
  }, [name, company, about, next, email]);

  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(personal.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* visible anyway */ }
  };

  const mailto = () => {
    const body = encodeURIComponent(`${sentence}${note.trim() ? `\n\n${note.trim()}` : ""}\n\n— ${name}`);
    window.location.href = `mailto:${personal.email}?subject=${encodeURIComponent(`[Portfolio] ${about}`)}&body=${body}`;
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: `${about}${company.trim() ? ` · ${company.trim()}` : ""}`,
          message: `${sentence}${note.trim() ? `\n\n${note.trim()}` : ""}`,
          botcheck,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <section id="section-contact" className="ds-section story-section ltr" aria-labelledby="ltr-title">
      <div className="ds-container">
        <header className="ltr__head">
          <p className="ds-label">The next step</p>
          <h2 id="ltr-title" className="ltr__title">Let&apos;s build the next <span>AI product.</span></h2>
          <p className="ltr__live">
            <i aria-hidden />
            {clock ? <>It&apos;s <strong>{clock}</strong> in India (IST).</> : "Based in India (IST)."} Replies within 24 hours · notice {personal.noticePeriod.toLowerCase()}.
          </p>
        </header>

        <div className="ltr__grid">
          <div className="ltr__stage">
            {status !== "sent" && (
              <form onSubmit={send} className={`ltr__paper ${status === "sending" ? "is-sending" : ""}`} aria-label="Write a note to Sankalp">
                <input type="text" name="botcheck" value={botcheck} onChange={(e) => setBotcheck(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="ltr__hp" />

                <span className={`ltr__stamp ${filled >= 3 ? "is-full" : ""}`} aria-hidden>
                  <span>{filled}/3</span>
                  <small>{filled >= 3 ? "ready" : "blanks"}</small>
                </span>

                <p className="ltr__to">To: Sankalp Wanjari</p>
                <p className="ltr__body">
                  Hi Sankalp, I&apos;m{" "}
                  <Blank id="l-name" label="Your name" value={name} onChange={setName} placeholder="your name" /> from{" "}
                  <Blank id="l-company" label="Company" value={company} onChange={setCompany} placeholder="company" />.
                  {" "}I&apos;m reaching out about{" "}
                  <span className="ltr__blank ltr__blank--select">
                    <label htmlFor="l-about" className="sr-only">What it is about</label>
                    <select id="l-about" value={about} onChange={(e) => setAbout(e.target.value)}>
                      {ABOUT.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </span>
                  , and I&apos;d like to{" "}
                  <span className="ltr__blank ltr__blank--select">
                    <label htmlFor="l-next" className="sr-only">Next step</label>
                    <select id="l-next" value={next} onChange={(e) => setNext(e.target.value)}>
                      {NEXT.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </span>
                  . You can reach me at{" "}
                  <Blank id="l-email" label="Your email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />.
                </p>

                {noteOpen ? (
                  <textarea className="ltr__note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything else: the team, the problem, the timeline…" aria-label="Additional note" maxLength={4000} autoFocus />
                ) : (
                  <button type="button" className="ltr__addnote" onClick={() => setNoteOpen(true)}><Plus size={14} aria-hidden /> Add a line</button>
                )}

                <div className="ltr__sign">
                  <span className="ltr__signname">— {name.trim() || "you"}</span>
                  <button type="submit" className="ds-btn ds-btn--primary" disabled={!ready || status === "sending"}>
                    {status === "sending" ? <><Loader2 size={15} className="animate-spin" aria-hidden /> Sending</> : <><Send size={15} aria-hidden /> Send the note</>}
                  </button>
                </div>

                {status === "failed" && (
                  <p className="ltr__fail" role="alert">
                    The note didn&apos;t go through.{" "}
                    <button type="button" onClick={mailto}>Open it in your email app instead <ArrowUpRight size={12} aria-hidden /></button>
                  </p>
                )}
              </form>
            )}

            {status === "sent" && (
              <div className="ltr__sent" role="status">
                <span className="ltr__postmark" aria-hidden><Check size={26} /><small>Sent</small></span>
                <p className="ltr__senttitle">Your note is on its way.</p>
                <p>Sankalp replies within 24 hours, to {email}.</p>
              </div>
            )}
          </div>

          <aside className="ltr__ways" aria-label="Other ways to reach Sankalp">
            <p className="ds-label">Or pick by the time you have</p>
            <ol>
              <li>
                <span className="ltr__time">5 sec</span>
                <button type="button" className="ltr__way" onClick={copyEmail} aria-label={`Copy email ${personal.email}`}>
                  <span className="ltr__waytitle">{copied ? "Copied" : "Copy the email"}</span>
                  <span className="ltr__waysub">{personal.email}</span>
                  {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                </button>
              </li>
              <li>
                <span className="ltr__time">1 min</span>
                <button type="button" className="ltr__way" onClick={() => ask(`I'm hiring for ${about}. Give me the 3 strongest reasons Sankalp fits, with evidence, and one honest gap.`)}>
                  <span className="ltr__waytitle">Ask Helios a screening question</span>
                  <span className="ltr__waysub">His AI answers from the portfolio record</span>
                  <MessageCircleQuestion size={18} aria-hidden />
                </button>
              </li>
              <li>
                <span className="ltr__time">2 min</span>
                <button type="button" className="ltr__way" onClick={() => window.dispatchEvent(new CustomEvent("resume:open"))}>
                  <span className="ltr__waytitle">Read the one-page résumé</span>
                  <span className="ltr__waysub">Updated {personal.resumeUpdated}</span>
                  <FileText size={18} aria-hidden />
                </button>
              </li>
            </ol>
            <p className="ltr__social">
              <a href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile"><LinkedinIcon size={17} /> LinkedIn</a>
              <a href={social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile"><GithubIcon size={17} /> GitHub</a>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
