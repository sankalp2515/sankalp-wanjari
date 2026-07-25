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
  const reduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse =
    typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

  // Explicit "give me less": honour it as the lowest tier.
  if (saveData || slowNet || reduced) return "low";
  // Clearly constrained hardware.
  if ((mem !== undefined && mem <= 4) || cores <= 4) return coarse ? "low" : "mid";
  // Touch devices with unknown/modest memory: mid by default (phones/tablets).
  if (coarse && (mem === undefined || mem <= 6)) return "mid";
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

  injectLiteSheet();
  const root = document.documentElement;
  const tier = computeDeviceTier();
  root.dataset.tier = tier;
  if (tier !== "high") root.classList.add(tier === "low" ? "perf-lite" : "perf-mid");

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
      window.dispatchEvent(
        new CustomEvent("perf:lite", { detail: { usedMB: Math.round(usedMB) } }),
      );
    }
  };
  check();
  const iv = window.setInterval(check, 4000);
  window.addEventListener("pagehide", () => clearInterval(iv), { once: true });
}
