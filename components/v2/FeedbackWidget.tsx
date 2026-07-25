"use client";

// FeedbackWidget — "leave a note". A small floating button (bottom-left,
// clear of the Ask-AI pill and the concierge dock on the right) that opens
// a compact panel: a star rating, a short note, and optional contact details.
// Posts to /api/feedback (Resend), falls back to a pre-filled mailto if the
// service is down. The AI concierge can open this panel too, by dispatching
// a "feedback:open" event — so feedback works from the chat as well.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquareHeart, Star, Send, Loader2, Check, X, ArrowUpRight } from "lucide-react";
import { personal } from "@/config/portfolio";

type Status = "idle" | "sending" | "sent" | "failed";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [botcheck, setBotcheck] = useState("");
  const [source, setSource] = useState("feedback widget");
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);

  // The concierge (and the /feedback command) opens this panel via an event.
  // detail may carry a prefilled note and a source label for the email.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string; source?: string }>).detail;
      if (detail?.message) setMessage(detail.message);
      if (detail?.source) setSource(detail.source);
      setStatus("idle");
      setOpen(true);
      setTimeout(() => firstFieldRef.current?.focus(), 120);
    };
    window.addEventListener("feedback:open", onOpen);
    return () => window.removeEventListener("feedback:open", onOpen);
  }, []);

  // Close on outside click / Escape while open
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      // Ignore clicks on the trigger button — it manages its own toggle.
      if ((t as Element)?.closest?.("[data-feedback-trigger]")) return;
      if (panelRef.current && !panelRef.current.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const mailtoFallback = () => {
    const subject = encodeURIComponent(`[Portfolio Feedback] ${rating ? `${rating}/5` : ""}`.trim());
    const body = encodeURIComponent(
      `${message}\n\n${rating ? `Rating: ${rating}/5\n` : ""}${name ? `— ${name}` : ""}${email ? ` (${email})` : ""}`
    );
    window.location.href = `mailto:${personal.email}?subject=${subject}&body=${body}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (!rating && !message.trim()) return; // need at least one signal
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message, name, email, source, botcheck }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error("send failed");
      setStatus("sent");
      setTimeout(() => setOpen(false), 2200);
    } catch {
      setStatus("failed");
    }
  };

  const inputStyle = {
    background: "color-mix(in srgb, var(--os-bg-surface) 75%, transparent)",
    border: "1px solid var(--os-border)",
    color: "var(--os-text)",
  } as const;

  const activeStar = hover || rating;
  const ratingWords = ["", "Rough", "Meh", "Decent", "Great", "Loved it"];

  return (
    <>
      {/* Floating trigger — bottom-left, out of the way of the concierge */}
      <div className="feedback-fab fixed bottom-5 left-5 z-[1200]">
        <button
          data-feedback-trigger
          onClick={() => { setStatus("idle"); setOpen((v) => !v); }}
          aria-label="Leave feedback"
          aria-expanded={open}
          className="flex items-center gap-2 text-[12.5px] font-medium pl-3 pr-3.5 py-2.5 rounded-full border transition-all hover:-translate-y-0.5 active:scale-95"
          style={{
            background: "color-mix(in srgb, var(--os-bg-window) 88%, transparent)",
            borderColor: "color-mix(in srgb, var(--os-accent) 26%, var(--os-border))",
            color: "var(--os-text-secondary)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 30px rgba(0,0,0,.16)",
          }}
        >
          <MessageSquareHeart size={15} aria-hidden style={{ color: "var(--os-accent)" }} />
          <span className="hidden sm:inline">Leave a note</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="feedback-panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="Leave feedback"
            className="fixed z-[1260] bottom-20 left-4 right-4 sm:right-auto sm:left-5 sm:w-[340px] rounded-3xl border overflow-hidden"
            style={{
              background: "var(--os-bg-window)",
              borderColor: "color-mix(in srgb, var(--os-accent) 25%, var(--os-border))",
              boxShadow: "var(--os-shadow-accent)",
            }}
          >
            {status === "sent" ? (
              <div className="flex flex-col items-center justify-center text-center px-6 py-10">
                <span className="grid place-items-center w-12 h-12 rounded-full mb-3"
                  style={{ background: "color-mix(in srgb, var(--os-accent-green) 15%, transparent)", color: "var(--os-accent-green)" }}>
                  <Check size={22} aria-hidden />
                </span>
                <div className="text-[15px] font-semibold mb-1" style={{ color: "var(--os-text)" }}>Thank you</div>
                <p className="text-[12.5px]" style={{ color: "var(--os-text-secondary)" }}>
                  Sankalp reads every note personally.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: "var(--os-text)" }}>Leave a note</div>
                    <p className="text-[11.5px] mt-0.5" style={{ color: "var(--os-text-muted)" }}>
                      Rate it, suggest something, or just say hi.
                    </p>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                    className="grid place-items-center w-7 h-7 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                    style={{ color: "var(--os-text-muted)" }}>
                    <X size={14} aria-hidden />
                  </button>
                </div>

                {/* Honeypot */}
                <input type="text" name="botcheck" value={botcheck} onChange={(e) => setBotcheck(e.target.value)}
                  tabIndex={-1} autoComplete="off" aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />

                {/* Star rating */}
                <div className="flex items-center gap-1.5 mb-3" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}
                      className="p-0.5 transition-transform hover:scale-110 active:scale-95">
                      <Star size={22} aria-hidden
                        style={{ color: n <= activeStar ? "var(--os-accent)" : "var(--os-text-muted)" }}
                        fill={n <= activeStar ? "var(--os-accent)" : "none"} />
                    </button>
                  ))}
                  <span className="ml-1 text-[11.5px] font-mono" style={{ color: "var(--os-text-secondary)" }}>
                    {ratingWords[activeStar]}
                  </span>
                </div>

                <textarea ref={firstFieldRef} rows={3} value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What worked, what didn't, or an idea…"
                  className="w-full text-[13px] px-3 py-2.5 rounded-xl outline-none resize-none mb-2.5"
                  style={inputStyle} />

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Name (optional)"
                    className="w-full text-[12.5px] px-3 py-2 rounded-xl outline-none" style={inputStyle} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full text-[12.5px] px-3 py-2 rounded-xl outline-none" style={inputStyle} />
                </div>

                <button type="submit" disabled={status === "sending" || (!rating && !message.trim())}
                  className="w-full flex items-center justify-center gap-2 text-[13.5px] font-semibold px-4 py-2.5 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "#fff" }}>
                  {status === "sending"
                    ? <><Loader2 size={14} className="animate-spin" aria-hidden /> Sending…</>
                    : <><Send size={14} aria-hidden /> Send note</>}
                </button>

                {status === "failed" && (
                  <p className="mt-2.5 text-[11.5px] text-center" style={{ color: "var(--os-text-secondary)" }}>
                    Didn&apos;t go through.{" "}
                    <button type="button" onClick={mailtoFallback} className="underline" style={{ color: "var(--os-accent)" }}>
                      Email it instead <ArrowUpRight size={10} className="inline" aria-hidden />
                    </button>
                  </p>
                )}
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
