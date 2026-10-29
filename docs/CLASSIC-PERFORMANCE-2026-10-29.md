# Classic design restored — focused performance pass

The experimental portrait-led redesign was removed with its verified rollback. The pre-existing entry was restored byte-for-byte, preserving previous project and performance work. No commit or deployment was made.

## Additional fixes

- Ambient pointer: previously regenerated a full-screen multi-stop radial gradient on every mouse frame. The moving warm glow is now a separately rasterized layer moved by transform; other colors remain fixed. No pointer-driven React state.
- Scroll veil: previously changed radial stops and color mixing for every velocity sample. Fixed still/travel gradients now crossfade via opacity. Endpoints/colors preserved; intermediate travel is a blend rather than a freshly rasterized gradient.
- Story composition: memoized separately from overlay state so opening chat/graph no longer reconciles the whole story. Components that actually consume concierge context still receive appropriate updates.
- Magnetic buttons: measure their bounds on entry rather than reading their own animated bounds on every pointer move, removing layout reads and position feedback.
- Navigation rail, header progress and behavior tracker: cache document range with ResizeObserver/resize, coalesce frames, cancel pending callbacks and disconnect observers on teardown.
- Shared scroll field sleeps once motion settles even if a subscriber exists. Subscribers receive updates on scroll/resize; registration no longer implies perpetual rendering.

## Validation

- TypeScript and targeted ESLint passed for the initial changed modules; production build passed.
- Chromium regression script checked classic hero, cached pointer background with changing transform, work navigation, fixed scroll-veil background, mobile horizontal overflow and reduced-motion reload. No uncaught page errors during this run.
- Screenshots: `output/playwright/classic-performance-desktop.png` and `classic-performance-mobile.png`.
- Existing Vercel development analytics scripts are blocked by the existing CSP; this is not a new rendering failure.
- Stale Next development cache returned a 404 initially. Preserved it as `.next/dev-before-classic-perf` and restarted cleanly; source routes did not change.
- This pass does not claim a measured FPS percentage or memory reduction. Device-specific production tracing remains necessary to quantify remaining WebGL, backdrop-filter and browser/GPU costs. No visual feature was deleted to manufacture a score.

Preview: http://localhost:3004/
