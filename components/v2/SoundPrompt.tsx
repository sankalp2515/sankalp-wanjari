"use client";

// A one-time, quiet invitation to turn on Helios's voice. Voice is opt-in (and
// costs TTS credits), so we never autoplay — we ask. Appears once per
// session, only when voice is currently off and the browser can speak. Variant
// A only.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Volume2, X } from "lucide-react";
import { helios } from "@/lib/voice";

const SEEN_KEY = "helios-sound-prompt";

export default function SoundPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!helios.supported() || helios.isEnabled()) return;
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => setShow(true), 2600); // let the hero breathe first
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => { sessionStorage.setItem(SEEN_KEY, "1"); setShow(false); };

  const enable = () => {
    // This click is the user gesture that unlocks audio playback.
    helios.setEnabled(true);
    helios.speak("Voice on. I'm Helios — I'll talk you through Sankalp's work whenever you like.");
    dismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="Enable voice narration"
          className="fixed z-[1240] bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-full border"
          style={{
            background: "color-mix(in srgb, var(--os-bg-window) 92%, transparent)",
            borderColor: "color-mix(in srgb, var(--os-accent) 30%, var(--os-border))",
            boxShadow: "var(--os-shadow-accent)",
            backdropFilter: "blur(12px)",
            maxWidth: "calc(100vw - 24px)",
          }}
        >
          <span className="grid place-items-center w-7 h-7 rounded-full shrink-0"
            style={{ background: "color-mix(in srgb, var(--os-accent) 16%, transparent)", color: "var(--os-accent)" }}>
            <Volume2 size={14} aria-hidden />
          </span>
          <span className="text-[12.5px] leading-tight" style={{ color: "var(--os-text-secondary)" }}>
            Want <strong style={{ color: "var(--os-text)" }}>Helios</strong> to speak as it guides you?
          </span>
          <button
            onClick={enable}
            className="shrink-0 text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full transition-transform hover:scale-[1.03] active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-cyan))", color: "var(--os-on-accent)" }}
          >
            Turn on
          </button>
          <button onClick={dismiss} aria-label="Not now"
            className="shrink-0 grid place-items-center w-7 h-7 rounded-full transition-colors hover:bg-[var(--os-bg-hover)]"
            style={{ color: "var(--os-text-muted)" }}>
            <X size={13} aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
