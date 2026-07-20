"use client";

// Contact — the closing act. Oversized headline, info cards on the
// left, a real working form on the right (posts to /api/contact,
// falls back to a pre-filled mailto if the API is down).

import { useState } from "react";
import { Mail, Check, MapPin, Clock, Timer, ArrowUpRight, Send, Loader2 } from "lucide-react";
import { personal, social } from "@/config/portfolio";
import { GithubIcon, LinkedinIcon } from "@/components/ui/Icons";
import Reveal from "./Reveal";

const PROJECT_TYPES = [
  "Full-time role — AI Engineer",
  "Full-time role — AI Product Manager",
  "Contract / freelance project",
  "Collaboration or research",
  "Something else",
];

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-3.5">
      <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
        style={{ background: "color-mix(in srgb, var(--os-accent) 12%, transparent)", color: "var(--os-accent)" }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-mono mono-small tracking-widest mb-0.5" style={{ color: "var(--os-text-muted)" }}>
          {label}
        </div>
        <div className="text-[13px] font-medium truncate" style={{ color: "var(--os-text)" }}>{value}</div>
      </div>
    </div>
  );
}

export default function ContactSection() {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", type: PROJECT_TYPES[0], message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  // Honeypot — humans never see or fill this; bots auto-fill it
  const [botcheck, setBotcheck] = useState("");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(personal.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* address is visible as text anyway */ }
  };

  const mailtoFallback = () => {
    const subject = encodeURIComponent(`[Portfolio] ${form.type}`);
    const body = encodeURIComponent(`Hi Sankalp,\n\n${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${personal.email}?subject=${subject}&body=${body}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.type,
          message: form.message,
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

  const inputStyle = {
    background: "color-mix(in srgb, var(--os-bg-surface) 75%, transparent)",
    border: "1px solid var(--os-border)",
    color: "var(--os-text)",
  } as const;

  return (
    <section id="section-contact" className="story-section relative max-w-5xl mx-auto px-5 py-24 sm:py-32">
      <div className="story-section__index" aria-hidden><span>07</span><i /></div>
      {/* Oversized closing headline */}
      <Reveal>
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-[11px] font-mono mono-small tracking-[0.2em] mb-4" style={{ color: "var(--os-accent)" }}>
            LET&apos;S CONNECT
          </div>
          <h2 className="font-display font-bold tracking-tight leading-[1.05]"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", color: "var(--os-text)" }}>
            Let&apos;s build the next{" "}
            <span className="text-shimmer">AI product.</span>
          </h2>
          <p className="mt-4 max-w-lg mx-auto text-[14.5px]" style={{ color: "var(--os-text-secondary)" }}>
            Hiring for an AI role, or have a system that needs to actually ship? {personal.availability} —
            notice {personal.noticePeriod.toLowerCase()}.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Info column */}
        <div className="flex flex-col gap-3">
          <Reveal delay={0.05}>
            <button onClick={copyEmail} className="w-full text-left" aria-label={`Copy email ${personal.email}`}>
              <InfoCard
                icon={copied ? <Check size={16} style={{ color: "var(--os-accent-green)" }} /> : <Mail size={16} />}
                label={copied ? "COPIED!" : "EMAIL — CLICK TO COPY"}
                value={personal.email}
              />
            </button>
          </Reveal>
          <Reveal delay={0.1}>
            <InfoCard icon={<MapPin size={16} />} label="LOCATION" value={`${personal.location} · Remote-first`} />
          </Reveal>
          <Reveal delay={0.15}>
            <InfoCard icon={<Timer size={16} />} label="NOTICE PERIOD" value={personal.noticePeriod} />
          </Reveal>
          <Reveal delay={0.2}>
            <InfoCard icon={<Clock size={16} />} label="RESPONSE TIME" value="Within 24 hours" />
          </Reveal>

          <Reveal delay={0.25}>
            <div className="flex items-center gap-3 pt-2">
              <a href={social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile"
                className="grid place-items-center w-11 h-11 rounded-2xl border transition-all hover:-translate-y-0.5"
                style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)", background: "var(--os-bg-surface)" }}>
                <GithubIcon size={17} />
              </a>
              <a href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile"
                className="grid place-items-center w-11 h-11 rounded-2xl border transition-all hover:-translate-y-0.5"
                style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)", background: "var(--os-bg-surface)" }}>
                <LinkedinIcon size={17} />
              </a>
              <a href={`mailto:${personal.email}`} aria-label="Email Sankalp"
                className="grid place-items-center w-11 h-11 rounded-2xl border transition-all hover:-translate-y-0.5"
                style={{ borderColor: "var(--os-border)", color: "var(--os-text-secondary)", background: "var(--os-bg-surface)" }}>
                <Mail size={17} />
              </a>
            </div>
          </Reveal>
        </div>

        {/* Form */}
        <Reveal delay={0.1}>
          <form onSubmit={submit} className="glass-card rounded-3xl p-6 sm:p-7">
            {status === "sent" ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center py-10">
                <span className="grid place-items-center w-14 h-14 rounded-full mb-4"
                  style={{ background: "color-mix(in srgb, var(--os-accent-green) 15%, transparent)", color: "var(--os-accent-green)" }}>
                  <Check size={24} aria-hidden />
                </span>
                <div className="text-[17px] font-semibold mb-1" style={{ color: "var(--os-text)" }}>Message sent</div>
                <p className="text-[13px]" style={{ color: "var(--os-text-secondary)" }}>
                  Expect a reply within 24 hours. Thanks for reaching out!
                </p>
              </div>
            ) : (
              <>
                {/* Honeypot — visually hidden, off the tab order, ignored by
                    screen readers. Bots that auto-fill every field trip it. */}
                <input
                  type="text"
                  name="botcheck"
                  value={botcheck}
                  onChange={(e) => setBotcheck(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                />
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="c-name" className="block text-[10.5px] font-mono mono-small tracking-widest mb-1.5"
                      style={{ color: "var(--os-text-muted)" }}>NAME</label>
                    <input id="c-name" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full text-[13.5px] px-3.5 py-2.5 rounded-xl outline-none focus:ring-1"
                      style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="c-email" className="block text-[10.5px] font-mono mono-small tracking-widest mb-1.5"
                      style={{ color: "var(--os-text-muted)" }}>EMAIL</label>
                    <input id="c-email" required type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@company.com"
                      className="w-full text-[13.5px] px-3.5 py-2.5 rounded-xl outline-none focus:ring-1"
                      style={inputStyle} />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="c-type" className="block text-[10.5px] font-mono mono-small tracking-widest mb-1.5"
                    style={{ color: "var(--os-text-muted)" }}>WHAT&apos;S THIS ABOUT?</label>
                  <select id="c-type" value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full text-[13.5px] px-3.5 py-2.5 rounded-xl outline-none"
                    style={inputStyle}>
                    {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="mb-5">
                  <label htmlFor="c-msg" className="block text-[10.5px] font-mono mono-small tracking-widest mb-1.5"
                    style={{ color: "var(--os-text-muted)" }}>MESSAGE</label>
                  <textarea id="c-msg" required rows={5} value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell me about the role, the team, or the problem you're solving…"
                    className="w-full text-[13.5px] px-3.5 py-2.5 rounded-xl outline-none resize-none"
                    style={inputStyle} />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full flex items-center justify-center gap-2 text-[14px] font-semibold px-5 py-3 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "#fff" }}
                >
                  {status === "sending"
                    ? <><Loader2 size={15} className="animate-spin" aria-hidden /> Sending…</>
                    : <><Send size={15} aria-hidden /> Send message</>}
                </button>

                {status === "failed" && (
                  <p className="mt-3 text-[12px] text-center" style={{ color: "var(--os-text-secondary)" }}>
                    Hmm, the form didn&apos;t go through.{" "}
                    <button type="button" onClick={mailtoFallback} className="underline" style={{ color: "var(--os-accent)" }}>
                      Open your email client instead <ArrowUpRight size={10} className="inline" aria-hidden />
                    </button>
                  </p>
                )}
              </>
            )}
          </form>
        </Reveal>
      </div>

      {/* Footer line */}
      <div className="mt-14 pt-6 border-t flex flex-wrap items-center justify-between gap-3 text-[11.5px] font-mono"
        style={{ borderColor: "var(--os-border-subtle)", color: "var(--os-text-muted)" }}>
        <span>© {new Date().getFullYear()} {personal.name}</span>
        <span>Resume updated {personal.resumeUpdated} · The AI concierge runs on a 6-provider LLM fallback</span>
      </div>
    </section>
  );
}
