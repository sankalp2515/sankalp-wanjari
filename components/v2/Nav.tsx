"use client";

// Floating glass pill nav — detached from the top edge, backdrop blur,
// active-section highlight, scroll progress ring on the logo.

import { useCallback, useEffect, useRef, useState } from "react";
import { Sun, Moon, MessageSquare, FileText, Menu, X, Share2 } from "lucide-react";
import { personal } from "@/config/portfolio";
import { useTheme } from "@/contexts/ThemeContext";
import { useConcierge } from "@/contexts/ConciergeContext";

const LINKS = [
  { id: "about",     label: "About" },
  { id: "work",      label: "Work" },
  { id: "research",  label: "Research" },
  { id: "arc",       label: "Career" },
  { id: "education", label: "Credentials" },
  { id: "skills",    label: "Skills" },
  { id: "contact",   label: "Contact" },
];

export default function Nav({ variant = "a" }: { variant?: "a" | "b" }) {
  const { theme, toggle } = useTheme();
  const { open, setOpen } = useConcierge();
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const progressRef = useRef<HTMLDivElement>(null);

  // Scroll progress bar (bottom edge of the pill)
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        progressRef.current?.style.setProperty("transform", `scaleX(${p})`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Active-section highlight
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id.replace("section-", ""));
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    for (const l of LINKS) {
      const el = document.getElementById(`section-${l.id}`);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  const goTo = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const askAI = useCallback(() => {
    setMenuOpen(false);
    setOpen(!open);
    if (!open) setTimeout(() => window.dispatchEvent(new CustomEvent("concierge-focus-input")), 80);
  }, [open, setOpen]);

  return (
    <header className={`fixed top-3 inset-x-0 z-[1000] px-3 pointer-events-none ${variant === "b" ? "nav--quiet" : ""}`}>
      <div
        className="max-w-5xl mx-auto pointer-events-auto relative rounded-2xl border overflow-hidden"
        style={{
          background: "color-mix(in srgb, var(--os-bg) 68%, transparent)",
          backdropFilter: "blur(14px) saturate(150%)",
          WebkitBackdropFilter: "blur(14px) saturate(150%)",
          borderColor: "color-mix(in srgb, var(--os-text) 10%, transparent)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset",
        }}
      >
        <div className="flex items-center justify-between px-3.5 h-14">
          {/* Identity */}
          <a
            href="#section-hero"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="font-display font-bold text-[14px] tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            style={{ color: "var(--os-text)" }}
          >
            <span
              className="grid place-items-center w-8 h-8 rounded-xl text-[11px] font-mono"
              style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "#fff" }}
            >
              {personal.initials}
            </span>
          </a>

          {/* Section links — desktop */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Sections">
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => goTo(l.id)}
                className="text-[12.5px] px-2.5 py-1.5 rounded-full transition-all"
                style={
                  active === l.id
                    ? {
                        color: "var(--os-accent)",
                        background: "color-mix(in srgb, var(--os-accent) 12%, transparent)",
                        fontWeight: 600,
                      }
                    : { color: "var(--os-text-secondary)" }
                }
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {variant === "a" && <button
              onClick={() => window.dispatchEvent(new CustomEvent("graph:toggle"))}
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-xl border transition-all hover:opacity-85"
              style={{
                borderColor: "color-mix(in srgb, var(--os-accent-cyan) 35%, transparent)",
                color: "var(--os-accent-cyan)",
                background: "color-mix(in srgb, var(--os-accent-cyan) 8%, transparent)",
              }}
              aria-label="View as knowledge graph"
            >
              <Share2 size={12} aria-hidden />
              Graph
            </button>}

            {variant === "a" && <button
              onClick={() => window.dispatchEvent(new CustomEvent("resume:open"))}
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-xl border transition-all hover:opacity-85"
              style={{
                borderColor: "color-mix(in srgb, var(--os-accent) 35%, transparent)",
                color: "var(--os-accent)",
                background: "color-mix(in srgb, var(--os-accent) 8%, transparent)",
              }}
            >
              <FileText size={12} aria-hidden />
              Resume
            </button>}

            <button
              onClick={askAI}
              aria-label={open ? "Close AI concierge" : "Open AI concierge"}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "#fff" }}
            >
              <MessageSquare size={12} aria-hidden />
              Ask AI
            </button>

            <button
              onClick={(e) => toggle(e)}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="grid place-items-center w-8 h-8 rounded-xl transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ color: "var(--os-text-secondary)" }}
            >
              {theme === "dark" ? <Sun size={14} aria-hidden /> : <Moon size={14} aria-hidden />}
            </button>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="md:hidden grid place-items-center w-8 h-8 rounded-xl transition-colors hover:bg-[var(--os-bg-hover)]"
              style={{ color: "var(--os-text-secondary)" }}
            >
              {menuOpen ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
            </button>
          </div>
        </div>

        {/* Scroll progress — bottom edge of the pill */}
        <div
          ref={progressRef}
          className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
          style={{
            background: "linear-gradient(90deg, var(--os-accent), var(--os-accent-cyan))",
            transform: "scaleX(0)",
          }}
          aria-hidden
        />

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden border-t px-4 py-3 flex flex-col gap-1"
            aria-label="Sections"
            style={{ borderColor: "color-mix(in srgb, var(--os-text) 8%, transparent)" }}>
            {LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => goTo(l.id)}
                className="text-left text-[14px] px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--os-bg-hover)]"
                style={{ color: active === l.id ? "var(--os-accent)" : "var(--os-text)" }}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent("resume:open")); }}
              className="flex items-center gap-2 text-[14px] px-3 py-2.5 rounded-lg text-left"
              style={{ color: "var(--os-accent)" }}
            >
              <FileText size={14} aria-hidden /> View resume
            </button>
            <button
              onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent("graph:toggle")); }}
              className="flex items-center gap-2 text-[14px] px-3 py-2.5 rounded-lg text-left"
              style={{ color: "var(--os-accent-cyan)" }}
            >
              <Share2 size={14} aria-hidden /> View as knowledge graph
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
