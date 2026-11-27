"use client";

// PaletteSwitch — preview-only control (PALETTE_PREVIEW, config/awardPass.ts).
// Flips html[data-pal] live between the current site and the two candidate
// palettes; remembered in this browser only. Not shipped once a palette is
// chosen (set PALETTE_PREVIEW = false).

import { useEffect, useState } from "react";

const OPTIONS = [
  { id: "off", label: "Current", sw: ["#F4F4F5", "#18181A", "#9C5304"] },
  { id: "lime", label: "Lime", sw: ["#0A0A0A", "#F5F5F2", "#C6F432"] },
  { id: "blue", label: "Blue + Orange", sw: ["#07080C", "#2448FF", "#FF7A1A"] },
] as const;

export default function PaletteSwitch() {
  const [pal, setPal] = useState<string | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPal(document.documentElement.getAttribute("data-pal") ?? "off"));
    return () => cancelAnimationFrame(id);
  }, []);
  if (pal === null) return null;

  const pick = (id: string) => {
    const root = document.documentElement;
    if (id === "off") root.removeAttribute("data-pal"); else root.setAttribute("data-pal", id);
    try { localStorage.setItem("pal", id); } catch {}
    setPal(id);
  };

  return (
    <div className="pal-switch" role="group" aria-label="Preview colour palette">
      <span className="pal-switch__label">Palette preview</span>
      {OPTIONS.map((o) => (
        <button key={o.id} type="button" aria-pressed={pal === o.id} onClick={() => pick(o.id)}>
          <span className="pal-switch__sw" aria-hidden>{o.sw.map((c) => <i key={c} style={{ background: c }} />)}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
