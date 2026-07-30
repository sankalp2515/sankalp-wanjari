"use client";

// ── SCROLL DRIVE ─────────────────────────────────────────────
// One rAF loop, one source of truth for "where are we, and how fast".
//
// The projects helix and its velocity-reactive heading both read from here
// rather than each attaching its own scroll listener, so they can never
// disagree by a frame.
//
// The velocity channel is published as CSS custom properties on <html>, so
// pure-CSS surfaces (type skew, smear) react to scroll speed with zero React
// re-renders — a 40-character headline costs the same as a single element.
//
//   --sd-v    signed velocity, clamped to [-1, 1]
//   --sd-va   absolute velocity, [0, 1]
//   --sd-p    document progress, [0, 1]
//
// SMOOTH SCROLL AUTHORITY (Lenis). The page used to move at the OS's raw
// wheel/trackpad cadence while the helix eased on top of it — two different
// clocks, which is what made the 3D section feel "off" versus references like
// showme-template. Lenis virtualizes the wheel into one eased scroll value that
// EVERYTHING (helix, velocity channel, progress) now reads from, so the whole
// page shares a single motion cadence. Lenis still writes the REAL scroll
// position, so getElementById / scrollIntoView / IntersectionObserver / scrollY
// all keep working exactly as they did — native scroll is virtualized, never
// faked. Reduced-motion users get Lenis disabled (raw native scroll).

import Lenis from "lenis";

export type DriveState = {
  /** Raw window.scrollY. */
  y: number;
  /** Critically-damped follow of `y`. Use for anything that should feel heavy. */
  smooth: number;
  /** Signed velocity, normalised and clamped to [-1, 1]. */
  v: number;
  /** Absolute velocity, [0, 1]. */
  va: number;
  /** Document progress, [0, 1]. */
  p: number;
  /** Viewport height, cached — reading it per frame forces layout. */
  vh: number;
};

type Listener = (state: DriveState) => void;

// ~55px/frame is an aggressive trackpad flick. Past that the effect saturates
// rather than growing forever, which is what keeps a fast scroll legible.
const V_FULL = 55;

const state: DriveState = { y: 0, smooth: 0, v: 0, va: 0, p: 0, vh: 0 };

let started = false;
let raf = 0;
let reduced = false;
let moving = false;
let lenis: Lenis | null = null;
const listeners = new Set<Listener>();

function measure() {
  state.vh = window.innerHeight;
}

function frame(time: number) {
  // Advance Lenis first so `scrollY` below reflects this frame's eased value.
  lenis?.raf(time);
  const y = window.scrollY || 0;
  const max = Math.max(1, document.documentElement.scrollHeight - state.vh);

  // Raw per-frame deltas are spiky enough that type driven straight off them
  // judders instead of flowing, so the delta is low-pass filtered below.
  const delta = y - state.y;
  state.y = y;
  state.p = Math.min(1, Math.max(0, y / max));
  state.smooth += (y - state.smooth) * 0.11;

  const target = reduced ? 0 : Math.max(-1, Math.min(1, delta / V_FULL));
  // Asymmetric easing: snap UP to speed so the reaction feels immediate, ease
  // DOWN slowly so letters settle rather than stopping dead.
  const k = Math.abs(target) > Math.abs(state.v) ? 0.35 : 0.08;
  state.v += (target - state.v) * k;
  if (Math.abs(state.v) < 0.0015) state.v = 0;
  state.va = Math.abs(state.v);

  const root = document.documentElement;
  root.style.setProperty("--sd-v", state.v.toFixed(4));
  root.style.setProperty("--sd-va", state.va.toFixed(4));
  root.style.setProperty("--sd-p", state.p.toFixed(4));

  // MEMORY: a `filter: blur()` that is merely PRESENT — even at 0px — makes the
  // browser keep an offscreen backing store for every element carrying it, for
  // as long as it carries it. Gating the smear behind a class means that at
  // rest (which is most of the time) those buffers do not exist at all.
  const isMoving = state.va > 0.02;
  if (isMoving !== moving) {
    moving = isMoving;
    root.classList.toggle("sd-moving", isMoving);
  }

  listeners.forEach((fn) => fn(state));
  raf = requestAnimationFrame(frame);
}

function makeLenis(): Lenis {
  return new Lenis({
    // lerp is the single easing stage now — the helix's own follower is removed
    // so there's no double-smoothing. ~0.09 tracks the finger without lag.
    lerp: 0.09,
    smoothWheel: true,
    wheelMultiplier: 1,
    // Never smooth-hijack touch — the OS already does momentum there.
    syncTouch: false,
  });
}

/** Idempotent — safe to call from every component that needs the drive. */
export function startScrollDrive(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduced = mq.matches;
  mq.addEventListener?.("change", (e) => {
    reduced = e.matches;
    // Honor a live change: tear down / spin up smoothing to match the pref.
    if (reduced) { lenis?.destroy(); lenis = null; }
    else if (!lenis) lenis = makeLenis();
  });

  // One eased scroll clock for the whole page. Disabled under reduced-motion
  // (raw native scroll) and on coarse pointers — touch devices already have
  // momentum scrolling in the OS, and doubling it up fights the finger.
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (!reduced && !coarse) lenis = makeLenis();

  measure();
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("orientationchange", measure, { passive: true });

  // A backgrounded tab must not accumulate a bogus velocity spike and then
  // fire it off on return; zero the channel on the way out.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { state.v = 0; state.va = 0; }
  });

  state.y = window.scrollY || 0;
  state.smooth = state.y;
  raf = requestAnimationFrame(frame);
}

export function stopScrollDrive(): void {
  cancelAnimationFrame(raf);
  lenis?.destroy();
  lenis = null;
  started = false;
}

/** Subscribe to per-frame updates. Returns an unsubscribe. */
export function onScrollDrive(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Read the current drive without subscribing. */
export function readScrollDrive(): DriveState {
  return state;
}
