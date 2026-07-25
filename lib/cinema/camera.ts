// ── Cinema camera ────────────────────────────────────────────
// The page is a movie camera. The visitor does not scroll — the camera
// travels. The travel is the browser's OWN native smooth scroll (the same
// mechanism the nav uses), which runs on the compositor: no per-frame
// JavaScript, no full-page repaint, and — crucially — it never snaps or
// teleports the way a hand-rolled rAF loop does when a frame is dropped or
// the tab is backgrounded.
//
// Each move resolves a promise when the camera SETTLES, so the tour runner can
// wait for movement to finish before narrating. Motion and voice never fight.

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface GlideOptions {
  /** Abort mid-flight — resolves immediately (the visitor took the wheel). */
  signal?: AbortSignal;
}

/**
 * Wait until a native smooth scroll settles at (or near) endY. Resolves on the
 * `scrollend` event where supported, and always has a position poll + hard cap
 * as a fallback for browsers without it and for backgrounded tabs (which never
 * fire scrollend). Aborting resolves immediately — the visitor is scrolling.
 */
function waitForSettle(endY: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scrollend", finish);
      signal?.removeEventListener("abort", finish);
      clearInterval(poll);
      clearTimeout(cap);
      resolve();
    };
    // Native "the smooth scroll has come to rest" signal (Chromium/Firefox).
    window.addEventListener("scrollend", finish);
    signal?.addEventListener("abort", finish, { once: true });
    // Fallback for Safari (<17) and frozen tabs: settle when we reach target…
    const poll = setInterval(() => {
      if (Math.abs(window.scrollY - endY) < 2) finish();
    }, 90);
    // …or after a generous cap so the tour can never hang.
    const cap = setTimeout(finish, 1800);
  });
}

/**
 * Glide the window to an absolute Y using native smooth scroll. Resolves when
 * the camera settles. Instant (respecting the sync contract) for reduced-motion.
 */
export function glideTo(targetY: number, opts: GlideOptions = {}): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const endY = Math.max(0, Math.min(targetY, maxY));

  if (Math.abs(endY - window.scrollY) < 2) return Promise.resolve();

  if (prefersReduced()) {
    window.scrollTo(0, endY);
    return Promise.resolve();
  }

  // Hand the motion to the browser — compositor-driven, never a repaint storm.
  window.scrollTo({ top: endY, behavior: "smooth" });
  return waitForSettle(endY, opts.signal);
}

/**
 * Frame a section at a progress point `t` (0 → header just under the top
 * letterbox, 1 → the section's lower content near the bottom letterbox).
 *
 * t=0 is the opening frame; advancing t beat-by-beat makes the camera DRIFT
 * down through the section as narration plays — motion while talking, but each
 * step is a native smooth scroll (compositor-driven), so it never stutters and
 * always lands exactly. Short sections (nothing below the fold) simply hold at
 * t=0 because start and end collapse to the same Y.
 *
 * The old per-chapter `align` is deliberately ignored: aligning the section
 * *top* to 16–20% of the viewport (plus the section's own top padding) pushed
 * the header down to mid-screen and cut the title — the "half section" bug.
 */
export function glideToSection(
  sectionId: string,
  t = 0,
  opts: GlideOptions = {},
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const el = document.getElementById(sectionId);
  if (!el) return Promise.resolve();

  const vh = window.innerHeight;
  const top = window.scrollY + el.getBoundingClientRect().top;
  const height = el.offsetHeight;

  // Opening frame: section top a touch below the 10vh top letterbox. The
  // section's own top padding then places the header comfortably in view.
  const startY = Math.max(0, top - vh * 0.06);
  // Deepest frame: the section's bottom near the bottom letterbox (~90vh),
  // never past the section itself. Collapses to startY for short sections.
  const endY = Math.max(startY, top + height - vh * 0.9);

  const clamped = Math.max(0, Math.min(1, t));
  const targetY = startY + (endY - startY) * clamped;
  return glideTo(targetY, opts);
}

/**
 * The documentary drift: from the current position, travel slowly and
 * CONTINUOUSLY to the section's lower content over `durationMs`, as narration
 * plays. Unlike a native smooth scroll (which finishes in a fraction of a
 * second and then sits still — the "human scroll" feel), this is one unbroken,
 * constant-velocity move with only soft ends, like a locked-off dolly.
 *
 * It's cheap: the ambient background is `position: fixed` (never repainted on
 * scroll) and the WebGL hero is off-screen by the time any section drifts, so
 * the only per-frame cost is compositing the section itself.
 *
 * Resolves when the travel completes or the signal aborts. A wall-clock guard
 * releases it if the tab is backgrounded (rAF frozen) so the tour never hangs.
 */
export function driftThroughSection(
  sectionId: string,
  durationMs: number,
  opts: GlideOptions = {},
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const el = document.getElementById(sectionId);
  if (!el) return Promise.resolve();

  const vh = window.innerHeight;
  const top = window.scrollY + el.getBoundingClientRect().top;
  const height = el.offsetHeight;
  const maxY = document.documentElement.scrollHeight - vh;

  const startY = window.scrollY;
  const endY = Math.max(startY, Math.min(top + height - vh * 0.9, maxY));

  if (prefersReduced() || endY - startY < 8 || durationMs < 200) return Promise.resolve();

  // Soft-start / soft-stop, constant velocity through the middle — a steady
  // dolly, not an accelerating scroll.
  const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

  return new Promise<void>((resolve) => {
    const begin = performance.now();
    let raf = 0;
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      opts.signal?.removeEventListener("abort", onAbort);
      resolve();
    };
    const onAbort = () => { cancelAnimationFrame(raf); settle(); };
    const guard = setTimeout(() => { cancelAnimationFrame(raf); settle(); }, durationMs + 800);
    opts.signal?.addEventListener("abort", onAbort, { once: true });
    const step = (now: number) => {
      const t = Math.min(1, (now - begin) / durationMs);
      window.scrollTo(0, startY + (endY - startY) * easeInOutSine(t));
      if (t >= 1) return settle();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  });
}
