"use client";

// ── SCROLL FIELD ─────────────────────────────────────────────
// One rAF loop. One source of truth for "where are we, and how fast".
//
// Everything in the Stage build reads from here rather than each component
// attaching its own scroll listener: the camera dolly, the particle Core, the
// project helix, the kinetic type, and the ambient background all move off the
// SAME numbers, so they can never disagree by a frame. That coherence is the
// difference between "several animated things" and "one world".
//
// The velocity channel is the important one. It is published as a CSS custom
// property on <html>, which means pure-CSS surfaces (type skew, blur, ambient
// intensity) react to scroll speed with zero React re-renders.
//
//   --scroll-v    signed velocity, clamped to [-1, 1]
//   --scroll-va   absolute velocity, [0, 1]
//   --scroll-p    page progress, [0, 1]
//
// Native scroll is never hijacked. Section elements keep their real heights
// and real scroll offsets, so getElementById + scrollIntoView + Intersection-
// Observer keep working — which is what lets all 14 existing features survive
// the redesign untouched.

export type FieldState = {
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
  /** Viewport height, cached (reading it per frame forces layout). */
  vh: number;
};

type Listener = (state: FieldState) => void;

// Velocity of this many px/frame reads as "fast". ~55px/frame is an aggressive
// trackpad flick; past that the effect saturates rather than growing forever.
const V_FULL = 55;

const state: FieldState = { y: 0, smooth: 0, v: 0, va: 0, p: 0, vh: 0 };

let started = false;
let raf = 0;
let reduced = false;
let isMoving = false;
const listeners = new Set<Listener>();

function measure() {
  state.vh = window.innerHeight;
}

function loop() {
  const y = window.scrollY || 0;
  const max = Math.max(1, document.documentElement.scrollHeight - state.vh);

  // Instantaneous delta, then a low-pass filter. The filter matters: raw
  // per-frame deltas are spiky enough that type driven straight off them
  // judders instead of flowing.
  const delta = y - state.y;
  state.y = y;
  state.p = Math.min(1, Math.max(0, y / max));

  // Heavy follower — this is what gives the dolly its sense of mass.
  state.smooth += (y - state.smooth) * 0.11;

  const target = reduced ? 0 : Math.max(-1, Math.min(1, delta / V_FULL));
  // Asymmetric easing: snap UP to speed so the reaction feels immediate, ease
  // DOWN slowly so type settles rather than stopping dead.
  const k = Math.abs(target) > Math.abs(state.v) ? 0.35 : 0.08;
  state.v += (target - state.v) * k;
  if (Math.abs(state.v) < 0.0015) state.v = 0;
  state.va = Math.abs(state.v);

  const root = document.documentElement;
  root.style.setProperty("--scroll-v", state.v.toFixed(4));
  root.style.setProperty("--scroll-va", state.va.toFixed(4));
  root.style.setProperty("--scroll-p", state.p.toFixed(4));

  // MEMORY: a `filter: blur()` that is merely *present* — even at 0px — forces
  // the browser to keep an offscreen backing store for every element carrying
  // it, permanently. Gating the blur behind a class means at rest (which is
  // most of the time) those buffers do not exist at all. This one toggle was
  // worth hundreds of MB across the kinetic headlines.
  const moving = state.va > 0.02;
  if (moving !== isMoving) {
    isMoving = moving;
    root.classList.toggle("is-moving", moving);
  }

  listeners.forEach((fn) => fn(state));
  raf = requestAnimationFrame(loop);
}

/** Idempotent. Safe to call from every component that needs the field. */
export function startScrollField(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener?.("change", (e) => { reduced = e.matches; });

  measure();
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("orientationchange", measure, { passive: true });

  // A backgrounded tab should not accumulate a bogus velocity spike when it
  // returns; zero the channel on the way out.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { state.v = 0; state.va = 0; }
  });

  state.y = window.scrollY || 0;
  state.smooth = state.y;
  raf = requestAnimationFrame(loop);
}

export function stopScrollField(): void {
  cancelAnimationFrame(raf);
  started = false;
}

/** Subscribe to per-frame updates. Returns an unsubscribe. */
export function onScrollField(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Read the current field without subscribing. */
export function readScrollField(): FieldState {
  return state;
}

// ── Section geometry ─────────────────────────────────────────
// The dolly needs to know where each section sits so it can place content in
// depth. Offsets are measured lazily and re-measured on resize, never per
// frame — getBoundingClientRect in a rAF loop is the classic way to make a
// scroll experience stutter.

export type SectionRect = { id: string; top: number; height: number };

let rects: SectionRect[] = [];
let rectsAt = 0;

export function measureSections(force = false): SectionRect[] {
  if (typeof document === "undefined") return [];
  const now = performance.now();
  if (!force && rects.length && now - rectsAt < 500) return rects;
  rectsAt = now;
  const y = window.scrollY || 0;
  rects = Array.from(
    document.querySelectorAll<HTMLElement>("section[id^='section-']"),
  ).map((el) => {
    const box = el.getBoundingClientRect();
    return { id: el.id, top: box.top + y, height: box.height };
  });
  return rects;
}

/**
 * Progress of a section relative to the viewport centre.
 *  -1 → one viewport below (approaching)
 *   0 → centred
 *  +1 → one viewport above (departed)
 */
export function sectionProgress(rect: SectionRect): number {
  const centre = state.y + state.vh / 2;
  const mid = rect.top + rect.height / 2;
  return Math.max(-2, Math.min(2, (centre - mid) / state.vh));
}
