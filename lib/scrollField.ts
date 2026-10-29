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
let maxScroll = 1;
let users = 0;
let teardown: (() => void) | undefined;
const published = new Map<string, string>();

function wake() {
  if (started && !raf && !document.hidden) raf = requestAnimationFrame(loop);
}

function measure() {
  state.vh = window.innerHeight;
  maxScroll = Math.max(1, document.documentElement.scrollHeight - state.vh);
  wake();
}

function loop() {
  raf = 0;
  const y = window.scrollY || 0;

  // Instantaneous delta, then a low-pass filter. The filter matters: raw
  // per-frame deltas are spiky enough that type driven straight off them
  // judders instead of flowing.
  const delta = y - state.y;
  state.y = y;
  state.p = Math.min(1, Math.max(0, y / maxScroll));

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
  const publish = (name: string, value: number) => {
    const next = value.toFixed(4);
    if (published.get(name) === next) return;
    published.set(name, next);
    root.style.setProperty(name, next);
  };
  publish("--scroll-v", state.v);
  publish("--scroll-va", state.va);
  publish("--scroll-p", state.p);

  // Only expose moving-state effects while there is visible velocity.
  const moving = state.va > 0.02;
  if (moving !== isMoving) {
    isMoving = moving;
    root.classList.toggle("is-moving", moving);
  }

  listeners.forEach((fn) => fn(state));
  if (state.va > 0 || Math.abs(y - state.smooth) > 0.01) wake();
}

/** Idempotent. Safe to call from every component that needs the field. */
export function startScrollField(): () => void {
  if (typeof window === "undefined") return () => {};
  users++;
  if (!started) {
    started = true;
    published.clear();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced = mq.matches;
    const onMotion = () => { reduced = mq.matches; wake(); };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      state.v = 0; state.va = 0;
      state.y = window.scrollY || 0;
      state.smooth = state.y;
      wake();
    };
    mq.addEventListener("change", onMotion);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("orientationchange", measure, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(document.body);
    teardown = () => {
      mq.removeEventListener("change", onMotion);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
    state.y = window.scrollY || 0;
    state.smooth = state.y;
    measure();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    users = Math.max(0, users - 1);
    if (!users) stopScrollField();
  };
}

export function stopScrollField(): void {
  cancelAnimationFrame(raf);
  raf = 0;
  teardown?.();
  teardown = undefined;
  started = false;
}

/** Subscribe to per-frame updates. Returns an unsubscribe. */
export function onScrollField(fn: Listener): () => void {
  listeners.add(fn);
  wake();
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
