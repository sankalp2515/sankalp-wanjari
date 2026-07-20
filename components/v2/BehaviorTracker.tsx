"use client";

// BehaviorTracker — invisible. Subscribes to the events the page already
// emits (stage:*, tour:done, resume:open) plus an IntersectionObserver
// over the sections, and writes everything to the behavior log that
// grounds the nudge engine. Renders nothing.

import { useEffect } from "react";
import { track } from "@/lib/behavior";

export default function BehaviorTracker() {
  useEffect(() => {
    const onCase = (e: Event) => track("case-open", String((e as CustomEvent).detail ?? ""));
    const onHighlight = (e: Event) => track("skill", String((e as CustomEvent).detail ?? ""));
    const onNav = (e: Event) => track("nav", String((e as CustomEvent).detail ?? ""));
    const onTour = () => track("tour-done");
    const onResume = () => track("resume-open");
    window.addEventListener("stage:case", onCase);
    window.addEventListener("stage:highlight", onHighlight);
    window.addEventListener("stage:nav", onNav);
    window.addEventListener("tour:done", onTour);
    window.addEventListener("resume:open", onResume);

    // Section views: fires when a section owns most of the viewport
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id^='section-']"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) track("view", en.target.id);
        }
      },
      { threshold: 0.5 }
    );
    sections.forEach((s) => io.observe(s));

    return () => {
      window.removeEventListener("stage:case", onCase);
      window.removeEventListener("stage:highlight", onHighlight);
      window.removeEventListener("stage:nav", onNav);
      window.removeEventListener("tour:done", onTour);
      window.removeEventListener("resume:open", onResume);
      io.disconnect();
    };
  }, []);

  return null;
}
