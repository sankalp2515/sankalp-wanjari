"use client";

// ── Performance governor ─────────────────────────────────────
// Not everyone visits on a 32-core workstation. This scales the experience
// to the device: a phone, a low-RAM laptop, or a data-saver connection gets a
// lighter build automatically — fewer WebGL contexts, no heavy blur — while a
// capable machine gets the full show. It's the same product thinking as the
// rest of the site: degrade gracefully, never break.
//
// Two signals drive it:
//   1. A one-time DEVICE TIER at boot (deviceMemory, cores, save-data, input).
//   2. A live HEAP MONITOR (Chromium) that downgrades mid-session if the tab
//      crosses a memory budget — so a long session on a modest device doesn't
//      slowly choke.
//
// Effect is applied as classes on <html>: `perf-lite` (shed the heavy stuff)
// and `data-tier`. CSS keys off perf-lite site-wide; components read the tier
// to skip mounting WebGL. A `perf:lite` event fires on downgrade.

import { logEvent, installClientErrorHandlers } from "./log";

export type DeviceTier = "high" | "mid" | "low";

// Hard budget: past this we shed heavy layers regardless of the reported tier.
// 500MB is comfortable headroom below where mobile Chromium starts reclaiming.
const HEAP_BUDGET_MB = 500;

interface NavigatorExt extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

export function computeDeviceTier(): DeviceTier {
  if (typeof navigator === "undefined") return "high";
  const nav = navigator as NavigatorExt;
  const mem = nav.deviceMemory;                       // GB, coarse (2/4/8…)
  const cores = navigator.hardwareConcurrency || 4;
  const saveData = !!nav.connection?.saveData;
  const slowNet = /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");

  // Data-saver or a genuinely slow (2g) connection → give less; that's an
  // explicit "I want less data/work" signal, not a guess.
  //
  // NOTE: we deliberately do NOT tier down on prefers-reduced-motion or on
  // touch alone anymore. Reduced-motion is an accessibility MOTION preference
  // (and iOS Low Power Mode toggles it) — it must only calm decorative motion,
  // never change which visual/3D build a device receives. Battery state must
  // never silently swap the experience: a visitor can't tell "low-power build"
  // from "bug", so the 3D hero and marquee stay consistent with desktop.
  if (saveData || slowNet) return "low";
  // Clearly constrained hardware — a real capability floor, so we never try to
  // hydrate a WebGL scene a weak GPU/low-RAM device can't afford.
  if ((mem !== undefined && mem <= 4) || cores <= 4) return "mid";
  return "high";
}

let started = false;

// The build tool (Lightning CSS) strips `backdrop-filter` overrides out of
// authored stylesheets, so CSS alone can't neutralise blur that components set
// inline. A stylesheet injected at RUNTIME is never processed by the build
// tool, so its `!important` reliably beats inline styles — killing every
// backdrop blur on the page, present and future, with no observers.
function injectLiteSheet() {
  if (typeof document === "undefined" || document.getElementById("perf-lite-sheet")) return;
  const style = document.createElement("style");
  style.id = "perf-lite-sheet";
  style.textContent =
    "html.perf-lite *,html.perf-lite *::before,html.perf-lite *::after{" +
    "backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}" +
    // Mobile-tuning #1: mid-tier touch devices also drop backdrop blur on the
    // glass surfaces (nav, cards). Gated by the `mobile-tuned` class, so with
    // MOBILE_TUNING=false the selector never matches and this is inert.
    "html.mobile-tuned.perf-mid .os-glass,html.mobile-tuned.perf-mid header>div," +
    "html.mobile-tuned.perf-mid [class*=glass]{" +
    "backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}";
  document.head.appendChild(style);
}

/** Idempotent. Stamps <html> with the tier and starts the heap monitor. */
export function startPerfGovernor(): void {
  if (started || typeof document === "undefined") return;
  started = true;

  // Global safety net: uncaught errors / rejections become telemetry instead
  // of a silent white screen (this is how we'll see a browser like mobile
  // Brave failing where others don't).
  installClientErrorHandlers();

  injectLiteSheet();
  const root = document.documentElement;
  const tier = computeDeviceTier();
  root.dataset.tier = tier;
  if (tier !== "high") root.classList.add(tier === "low" ? "perf-lite" : "perf-mid");

  // Make the tier decision visible: this is the single most useful signal for
  // "why does my phone look different?" — it records the raw inputs, not just
  // the verdict, so a device reports exactly why it landed where it did.
  const nav = navigator as NavigatorExt;
  const mm = typeof matchMedia !== "undefined" ? matchMedia : undefined;
  logEvent("device_tier", {
    tier,
    deviceMemory: nav.deviceMemory ?? null,
    cores: navigator.hardwareConcurrency ?? null,
    saveData: !!nav.connection?.saveData,
    effectiveType: nav.connection?.effectiveType ?? null,
    coarsePointer: mm ? mm("(pointer: coarse)").matches : null,
    reducedMotion: mm ? mm("(prefers-reduced-motion: reduce)").matches : null,
    hasHeapApi: !!(performance as Performance & { memory?: unknown }).memory,
  });

  const mem = (performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  }).memory;
  if (!mem) return; // non-Chromium: tier alone governs, no live monitor

  let lite = tier === "low";
  const check = () => {
    const usedMB = mem.usedJSHeapSize / 1048576;
    const limitMB = mem.jsHeapSizeLimit / 1048576;
    // Downgrade once we cross the fixed budget OR near the device's own ceiling.
    if (!lite && (usedMB > HEAP_BUDGET_MB || usedMB > limitMB * 0.8)) {
      lite = true;
      root.classList.add("perf-lite");
      logEvent("perf_downgrade", { usedMB: Math.round(usedMB), limitMB: Math.round(limitMB) }, "warn");
      window.dispatchEvent(
        new CustomEvent("perf:lite", { detail: { usedMB: Math.round(usedMB) } }),
      );
    }
  };
  check();
  const iv = window.setInterval(check, 4000);
  window.addEventListener("pagehide", () => clearInterval(iv), { once: true });
}
