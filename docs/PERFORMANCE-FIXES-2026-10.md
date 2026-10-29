# Performance implementation and verification — 28 October 2026

## Scope and visual contract

Implemented the high-value, quality-preserving fixes from the performance audit. No reduction to particle count (2,800), canvas DPR/antialiasing, lighting/material quality, portrait/image resolution, glass styling, graph content, or visible animation timing. No assets were recompressed. Existing project/content/user changes were preserved. No commit was created.

This is not a claim that every potential micro-optimization in the audit has been exhausted. In particular, full sphere instancing, hidden graph-label projection pooling, a different constrained-device visual rendition, responsive poster regeneration and a transform-only replacement for gradient motion remain separate follow-ups requiring their own visual comparisons. The scanner keeps its crisp animated dimensions; its movement now uses transforms rather than left/top.

## Implemented

- **Particle work:** `ProofField.tsx` precomputes immutable sphere/ring/verdict targets and blend weights; stationary morphs no longer rewrite/upload positions. Rotation, pointer response and thinking/breathing remain live. Immutable targets also fix accumulated shape drift on reverse scrolling.
- **Canvas scheduling:** `useCanvasVisible.ts` starts unmounted, prewarms near the viewport and retains delayed far-offscreen disposal. Capability detection starts unknown rather than briefly selecting another renderer. Far-offscreen skills no longer allocate a WebGL context at boot.
- **Occlusion:** `renderActivity.ts` coordinates reference-counted blockers. Boot and full-screen graph pause covered page canvases, not their own scene. Covered scenes retain resources and resume without reconstruction; background-tab rendering also pauses.
- **Skills batching:** 39 connections share one geometry and two opacity groups. Original per-discipline colors and core/non-core opacity remain unchanged. Measured scene draws: 42/frame, down from approximately 79. Spheres remain individually interactive.
- **Idle work:** the shared scroll field sleeps after velocity settles, caches document extent through ResizeObserver and only writes changed values. All service listeners now have symmetric cleanup. Cursor RAF sleeps once its trail settles and on leave/tab hide; it resumes on movement or hover change.
- **Hidden decoration:** About photo/pulse loops pause outside their visibility region; marquee and contact shimmer pause off screen or behind an overlay. These do not remove content or change layout.
- **Pointer/layout:** tilt samples the latest pointer once per frame and measures a stable wrapper, invalidating geometry on scroll/resize. BioScanner moves with x/y transforms while retaining crisp size/corner animation. Reveal/card blur returns to `none` when settled without removing the entrance effect.
- **React subscriptions:** retry countdown lives in the fast chat context, not page-control context. Closed chat no longer rotates placeholder state. Existing split streaming subscriptions and memoized message rows remain intact.
- **Loading:** inactive FilmLanding and project details use separate dynamic imports. Details prewarm near the project grid and on hover/focus, including before touch users reach the cards; details remain mounted after first use to preserve exit/back behavior.
- **Media:** preview sources remain warm between nearby hovers, pause/rewind on exit and unload after leaving the viewport band. Files and visual quality are unchanged.
- **Voice ownership:** interrupted sentence sequences abort pending fetches and revoke unused prefetched blob URLs in `finally`. Playing-URL cleanup and prefetch functionality remain intact.
- **Monitoring:** raw boot renderer participates in the context census. Context-budget monitoring no longer depends on the Chromium heap API. Monitoring stops/restarts across pagehide/pageshow and cleans up on page unmount.
- **Hydration:** browser testing found an existing reduced-motion SSR/client mismatch in Hero/Marquee/Reveal. A shared hydration-safe preference subscription now gives server and first client render the same snapshot, then applies the live preference. Production reduced-motion reload no longer regenerates the page or throws React #418.

## Measured results

Same local Chromium/Intel UHD Graphics 630 environment and 1280×720 viewport as the audit. Timed samples were collected without WebGL instrumentation; GL-call instrumentation was used separately for scheduling/draw/upload assertions, and excluded from memory measurements.

| Metric | Audit baseline | After implementation |
|---|---:|---:|
| Contexts created during cold boot | 3 | 2 (boot + hero; no offscreen skills) |
| Skills geometry draws/frame | ~79 | 42 (observed 840 draws / 20 clears in the GL-call sample) |
| Covered hero draws during graph | Continued rendering | 0 during the test interval |
| Stationary hero morph uploads | Marked dirty each frame | 0 during the test interval |
| Hero script time, ~4-second sample | 1.141 s | 0.408 s |
| Hero p95 frame interval | 20.8 ms | 13.8 ms |
| Skills style-recalculation time, ~4-second sample | 1.893 s | 0.544 s |
| Skills p95 frame interval | 62.5 ms | 7.2 ms |

These are single local samples, not a guarantee of these FPS or percentages on every device. Refresh cadence/background load varies; do not sum subsystem improvements into a whole-site percentage. The strongest repeatable evidence is the eliminated hidden work and reduced draw/upload counts.

Five clean graph open/close cycles returned to one connected canvas each time. DOM node count was 2,916 after the first close and 2,890 after settling. JS heap was ~11.94 MiB after the first close and ~13.08 MiB after settling. This short run does not establish an unbounded leak, prove all memory has been reclaimed, or measure GPU/native memory. No claim is made that tab memory fell by a specific number of MB.

## Verification

- `npm run build`: passed, including TypeScript and route generation.
- `npx tsc --noEmit`: passed.
- Full lint was run. App-source lint still contains **20 existing errors / 18 warnings**; these were not hidden with rule disables. Baseline comparison of changed source files found **no new violations** and two fewer errors in the modified files. Isolated new performance hooks/helpers and particle/skills implementations lint clean.
- `git diff --check`: passed (Git reports existing LF/CRLF conversion notices, not whitespace failures).
- Production UI: IntentSeal, Abide and CaseProof overview → breakdown → back → close passed, including lazy-loading behavior and Escape.
- AI dock open/close and `/skills` navigation passed with the model API mocked unavailable; section visibility was asserted, not just button activation.
- Light/dark, glass styling, 390 px mobile layout/no horizontal overflow, reduced-motion reload, and variant B passed. No uncaught page errors in the final UI run.
- Video browser test: hover playback, pause plus warm source on leave, and far-offscreen source removal passed.
- Voice source regression harness: interrupt playback, hide the document after a chunk, and abort an in-flight fetch all ended with no stranded object URLs or requests. This uses mocked audio/network, not a claim about every external TTS provider.
- Real mobile hardware, Safari GPU profiling, and long-duration OS/GPU memory capture have not been performed.

## Evidence and repeatable checks

Browser scripts under `output/playwright/`:

- `performance-fix-check.js` — cold contexts, idle uploads, graph pause/resume and skills draw count.
- `performance-after.js` — fresh-page, uninstrumented local timing samples.
- `performance-ui-check.js` — project flows, offline command, theme/glass, mobile, reduced motion and B.
- `performance-media-check.js` — preview lifecycle.
- `performance-memory-after.js` — clean repeated graph lifecycle with GC between cycles.

Node scripts: `node output/performance-voice-check.cjs` and `node output/performance-lint-check.cjs`.

Screenshots: `output/playwright/perf-before-hero.png`, `perf-after-hero.png`, `perf-after-skills.png`, `perf-light-glass.png`, `perf-mobile.png`, `perf-variant-b.png`.

Temporary production verification server: `http://localhost:3002`. Browser test scripts use that port. No deployment or commit was made.
