# Portfolio performance audit — 28 October 2026

## Verdict

The priority is animation scheduling and rendering ownership, not removing the visual identity or memoizing every component. There is avoidable particle computation, startup WebGL allocation, rendering behind full-screen overlays, and excessive draw-call fragmentation in the skills scene. The performance fallback is not actually a non-WebGL fallback.

This is an audit, not an implementation pass. No application source was changed or committed. Existing uncommitted changes were preserved. Diagnostic scripts are in `output/playwright/performance-*.js`.

## Method and measured baseline

Inspected the active `app/page.tsx → components/v2/Landing.tsx` path, both visual variants' imports, canvas lifecycle, shaders, scrolling/pointer handlers, concierge subscriptions, voice cleanup, media loading, public assets, and production chunks. Tested the existing production build on `http://localhost:3001`, not the development server or the unrelated service on port 3000. Used Playwright and Chrome DevTools Protocol performance counters. Browser: Chromium, 1280×720, DPR 1; renderer reported Intel UHD Graphics 630 through ANGLE/D3D11.

These are local diagnostic samples, not field Core Web Vitals, a controlled GPU benchmark, or an OS tab-memory measurement. Four-second frame samples varied; do not translate them into guaranteed FPS improvements. No mobile-device or cross-browser GPU memory measurement was made. Estimates below describe the affected subsystem, **not percentages to add together for the whole site**.

| Observation | Measurement |
|---|---|
| JavaScript requested in the initial inspected resource list | 1,858,583 decoded bytes, about 1.86 MB / 1.77 MiB; local gzip estimate 523,589 bytes, about 511 KiB. This is not measured wire transfer. A subsequent cold boot also requested a 22.9 KB preloader module. |
| Largest requested JS chunk | 723,545 bytes decoded / 182,426 gzip; contains Three.js renderer/material code. Another requested chunk is 176,316 bytes decoded and includes the React Three Fiber stack. |
| Hero idle, 4-second sample | p95 frame interval 20.8 ms; script time 1.14 s; style recalculation 0.254 s; layout count 0. |
| Skills idle, 4-second sample | p95 62.5 ms; 39 intervals over 33.4 ms; style recalculation 1.89 s; layout count 0. This local view was materially less smooth. Attribution among style/compositing and scene work needs a follow-up trace after targeted changes. |
| Full-screen graph over hero | Two connected canvases: hero 601×600 and graph 1280×720. Graph sample had 706 style recalculations in about 4 seconds. |
| Fresh boot context instrumentation | Three contexts created at approximately 870, 1,239 and 1,261 ms. The unnecessary/off-screen context was lost at 2,425 ms; boot context at 4,959 ms; hero remained. |
| Portrait delivered to browser | Optimized Next image: 23,637 bytes, 327×666 decoded, rather than the 1.06 MiB source PNG. |
| Animation inventory at the hero | Off-screen marquee tracks, contact shimmer about 13,473 px below the viewport, and an About-section pulse were still running. |

### Memory: what is and is not established

An uninstrumented fresh page was tested through five graph open/close cycles with forced GC between cycles. Canvas count returned to one each time; DOM nodes were 2,757 at baseline and 2,733 after settling. JS heap went from 9.34 MiB before the first graph import to 11.51 MiB after the first close and 12.59 MiB after five cycles/settling. Some retained growth remains; this is **not sufficient evidence of an unbounded leak**, nor does stable DOM prove there is none. Heap snapshot retaining paths and a longer run are needed before attributing that growth.

Context instrumentation deliberately holds references to canvases, so its heap results were excluded from leak analysis. The clean-page test above does not install that instrumentation.

JS heap does not include GPU render targets, compositing surfaces, image/video decoders, or all native allocations. A 12–14 MiB JS heap is therefore not a measurement of total tab memory. Comments in the existing code claiming hundreds of MB saved are not measurements used in this report.

## Findings

### 1. Particle morph repeats invariant math and uploads an unchanged buffer — P0

**Current:** `components/v2/ProofField.tsx:125`, `:152`, `:177`. Each rendered frame iterates 2,800 points, recalculates seeded ring/verdict positions and two identical smoothstep weights, then sets `position.needsUpdate`. The rotation and thinking effects run in the same callback.

**Why slow:** About 19,600 deterministic sine/cosine calls and 5,600 redundant smoothstep evaluations per frame, even when scroll progress is stationary. At 60 Hz that is roughly 1.18 million sine/cosine calls per second. A 33.6 KB position buffer is marked for upload every frame. The buffer bandwidth itself is modest; avoid overstating it as the main GPU problem.

**Optimize:** Precompute immutable sphere, ring and verdict arrays once. Compute the two blend weights once per frame. Update the position attribute only when the morph input changes; keep rotation, pointer response, breathing and thinking animation running independently. The current sphere source is also the mutable attribute buffer, so separate immutable input from output to avoid accumulating morph drift.

**Estimated gain:** Removes essentially all invariant trigonometry and stationary position-buffer uploads. A 50–80% reduction in the particle-morph callback's CPU work is a reasonable hypothesis, not a measured whole-page gain.

**Complexity:** Medium, roughly 0.5–1 day including visual comparisons. **Risk:** Medium: verify phase shapes, reverse scrolling, theme and thinking transitions. No particle-count reduction is required.

### 2. Lazy-imported canvases still eagerly allocate below the fold — P0

**Current:** `hooks/useCanvasVisible.ts:37–40` initializes both `visible` and `mounted` to `true`. A distant canvas allocates first, then the observer waits 1,200 ms before unmounting. `SkillsSection.tsx:45` dynamically imports the constellation as soon as hardware/pointer checks pass. `Landing.tsx:145` mounts the page underneath the boot overlay.

**Why slow:** Dynamic import alone is not viewport lazy loading. On first arrival, shader compilation/context allocation for invisible skills competes with the loader and hero. The measured cold boot had three overlapping contexts, dropping to one only later.

**Optimize:** Observe a dimensioned wrapper before importing/mounting its scene; initialize below-fold mounting false, mount within a prewarm margin, retain the existing delayed teardown. Coordinate boot and hero warming so there is one visible drawing scene rather than multiple simultaneous draw loops. Keep the loader and finished hero visually unchanged.

**Estimated gain:** Avoids one measured transient off-screen context allocation, plus its geometry/program setup. Can reduce boot rendering from three overlapping contexts to one visible scene plus controlled prewarming. Exact native-memory and startup-ms savings require a second measurement.

**Complexity:** Medium, 0.5–1 day. **Risk:** Low–medium: preserve wrapper dimensions and prewarm before the visitor reaches the scene to avoid a blank entrance.

### 3. Full-screen graph does not suspend the covered page — P0

**Current:** `Landing.tsx` conditionally mounts `GraphMode` but leaves Hero, ambient field and page animation mounted. `useCanvasVisible.ts:90` listens for film drift, not overlay occlusion. The browser confirmed two connected canvases while the graph covers the hero. IntersectionObserver does not detect that a fixed overlay visually covers an element.

**Why slow:** Both scenes can render while only the graph is visible. Background effects also compete with graph interaction. The underlying hero's context can be retained without drawing it.

**Optimize:** Add a shared visibility/occlusion budget for graph and other genuinely covering overlays. Pause covered canvas frameloops and decorative background animation, but keep state/context warm. Resume on close; do not remount the hero on every toggle.

**Estimated gain:** Two drawing canvases → one during this measured path; removes the hidden hero's entire frame workload. This is not a claim of a 50% total frame-time improvement.

**Complexity:** Low–medium, 0.5 day. **Risk:** Low, provided pause and resume are symmetric and nested overlays are accounted for. No visible quality loss.

### 4. Global scroll field never sleeps and drives paint-bound backgrounds — P1

**Current:** `lib/scrollField.ts:58–97` reads document scroll height and writes three inherited root CSS variables on every animation frame, including idle and reduced-motion states. `AmbientBackground.tsx:35` starts it permanently. `app/globals.css:1663–1684` uses velocity for opacity and radial-gradient parameters; pointer coordinates change gradient centers at `:1159`.

**Why slow:** Repeated calls/read-write scheduling even at rest; while moving, root-inherited values and gradient changes can cause style and paint work rather than a compositor-only transform. Reading scroll height after other animation writes can force layout when layout is dirty, but **the measured idle samples had zero layouts**, so widespread idle layout thrashing is not established.

**Optimize:** Cache document extent with ResizeObserver; wake on scroll and sleep once velocity settles. Publish only changed values and scope them to actual consumers. Move pre-rendered aurora layers with transforms instead of repainting gradient centers. Retain the same color field and velocity response.

**Estimated gain:** Up to three fewer root-property writes per idle frame and no idle scroll-field loop; lower paint work during pointer travel. A temporary browser experiment that only deduplicated equal root writes did **not** improve frame timing; that shortcut alone is not an adequate fix or a justified percentage claim.

**Complexity:** Medium, 1–2 days for field scoping/visual parity. **Risk:** Medium: preserve the authored movement and chapter transitions.

### 5. Skills constellation fragments one visual into about 79 draw calls — P1

**Current:** `SkillConstellation.tsx:44–114` renders 39 separate sphere meshes and 39 separate edge geometries/materials, plus a central sphere. Every node has its own useFrame callback. Hover propagates state into the parent and recreates the unmemoized node subtree.

**Why slow:** Many small draws and JS callbacks for a tiny scene. Sharing geometry/materials and batching are better than reducing the number of skills. This view had the worst sampled frame pacing, although the full 62.5 ms p95 cannot be attributed exclusively to draw calls; style recalculation was also expensive.

**Optimize:** First combine the edges into one color-attributed BufferGeometry. Then instance skill spheres with per-instance color/scale and instanceId-based picking. Keep hover labels and category colors. Stabilize node handlers/memoization where props can genuinely stay unchanged.

**Estimated gain:** Edge batching alone removes 38 of approximately 79 geometry draws (~48%). Fully instanced nodes can bring geometry submission near three draws, subject to material grouping. These are draw-call reductions, not guaranteed FPS percentages.

**Complexity:** Medium, 1–2 days including picking tests. **Risk:** Medium: hover/click mapping and animated size must remain correct.

### 6. Performance downgrade selects another WebGL scene — P1

**Current:** `lib/useHeavyOk.ts:15` begins false; `Hero.tsx:120` selects ProofCore when false. ProofCore itself mounts Canvas and uses `MeshPhysicalMaterial` with `transmission={0.18}` (`ProofCore.tsx:84`). `computeDeviceTier()` classifies ≤4 GB / ≤4 cores as mid, and useHeavyOk accepts mid. `lib/perf.ts` stops live monitoring entirely when the Chromium heap API is unavailable; the raw preloader context is not included in its context census.

**Why slow:** The supposed escape hatch still allocates GPU resources, with a transmission material that can require an extra render pass/target. Hardware comments and actual policy disagree. A heap threshold cannot detect GPU pressure; Safari/Firefox receive no live context-budget check through this path.

**Optimize:** Make device detection an explicit unknown/ready state so it does not select a temporary scene. Define a lighter rendition of the same signature object using basic/standard materials and measured DPR/frame cadence. Keep context-count monitoring independent of heap API availability; count every renderer. Offer an explicit motion/quality preference rather than silently degrading premium visuals universally.

**Estimated gain:** Removes an avoidable physical-transmission path on constrained devices and potential initial renderer switching. At the same CSS dimensions, DPR 1 instead of 1.5 uses ~56% fewer drawing-buffer pixels; use only where profiling justifies it. That does not mean 56% less total memory or faster page rendering.

**Complexity:** Medium, 1–2 days. **Risk:** Medium: make the constrained rendition recognizably the same design; compare physical devices.

### 7. All client sections and inactive UI code participate in the initial bundle — P1

**Current:** `Landing.tsx:34–58` statically imports both FilmLanding and the default experience, AgentDock, film/tour interfaces and modal components. `ProjectsSection.tsx:14` statically imports ProjectModal, which imports DiagramGallery. The concierge imports cinema/voice machinery up front. GraphMode is correctly on-demand already.

**Why slow:** Users pay parsing/evaluation/hydration for interactive features they may not open. The inspected page requested ~1.86 MB decoded JS, with another small boot module on cold load. The 3D runtime is most of the large shared chunks, so merely making FilmLanding dynamic will not eliminate Three.js while the hero uses it.

**Optimize:** Split project detail/diagram code and unopened interaction features behind intent-triggered imports, prewarming on focus/pointer intent. Put visual variants behind separate module boundaries so inactive-only code can be excluded. Keep visible text/server-rendered section shells immediate; do not replace the entire document with blank lazy placeholders. Consider slimmer Drei imports only after a module-level bundle report proves a saving.

**Estimated gain:** Working target 50–150 KiB gzip deferred from first interaction-ready load, pending a module-level bundle report; not a measured saving. The already-lazy graph should not be counted twice. Hero-visible Three.js remains a deliberate cost.

**Complexity:** Medium, 1–2 days. **Risk:** Low–medium: prewarm details and maintain accessible loading/focus behavior.

### 8. Repeated reveal filters remain after settling; glass cost needs careful attribution — P1/P2

**Current:** `Reveal.tsx:39–40` transitions entire content wrappers from blur(8px) to blur(0px), with perspective/rotateX; `ProjectsSection.tsx:101–103` does the same for each card on initial mount, including below-fold cards. The source CSS declares 24–32 px glass-mode blurs at `globals.css:518–539`. **However**, computed styles in this production build did not show those large glass-card blurs, even after toggling data-design. Real observed backdrops were the 14 px navigation/highlight surfaces, 10 px hero evidence, and small 6 px project-link tiles.

**Why slow:** Large transient filters on media-rich wrappers require extra raster/compositing work during entrances; leaving a non-none filter can retain a stacking/compositing surface depending on browser. Do not assume that blur(0) always allocates a fixed GPU buffer, or blame stripped/non-applied glass rules for the observed lag. Stacking real backdrops over moving gradients can also be costly.

**Optimize:** Apply the expensive blur to a smaller entrance layer and reset filter to `none` once finished. Trigger project entrance only near view, not all cards at initial mount. Keep true glass on visible navigation/dialogs and use the same translucent fill/border elsewhere; test the actual compiled/computed result before lowering radii.

**Estimated gain:** Fewer long-lived filter surfaces and less entrance rasterization. Exact MB/FPS gain is not responsibly quantifiable without a Layers/GPU trace. No justification for removing glass across the site.

**Complexity:** Low–medium, 0.5–1 day. **Risk:** Low if the finished frame and entrance language remain visually matched.

### 9. Off-screen decorative animations and cursor loop keep working — P1/P2

**Current:** `AboutSection.tsx:30–33` runs an infinite portrait scale, `:74–77` an infinite pulse. `ContactSection.tsx:113` has persistent shimmer. Two marquee tracks were running below the viewport. `CursorDot.tsx:40–48` writes both transforms forever, even with no pointer movement or when the cursor is invisible. The browser animation inventory confirmed hidden motion.

**Why slow:** Unseen movement has zero user value but still schedules animation/style/compositing work. Small transform-only animations are cheaper than the 3D scenes; they are not automatically the biggest bottleneck.

**Optimize:** Pause off-screen CSS/Framer loops with section visibility and tab visibility. Stop cursor RAF when its spring settles and wake on pointer input; retain the exact visible trail and hover swell.

**Estimated gain:** Eliminates two idle cursor transform writes per frame and the verified unseen decorative loops. Likely a modest CPU/battery gain, not a defensible large FPS percentage alone.

**Complexity:** Low, 0.5–1 day. **Risk:** Low: resume without snapping; do not pause visible interaction feedback.

### 10. Pointer interactions mix geometry reads and writes; scanner animates layout — P2

**Current:** `TiltCard.tsx:23–33` measures its already-transforming element on every pointer event then writes four CSS variables. `Magnetic.tsx:24–29` similarly measures/writes transform. `BioScanner.tsx:71–84` measures words around each change, then `:145` animates left/top/width/height via a spring.

**Why slow:** High-frequency pointer events repeat geometry reads, potentially flushing pending work. Measuring the transformed tilt surface also introduces feedback/jitter. Scanner dimensions/position animate through layout/paint rather than just compositing. The scanner's reads are per phrase, **not** a falsely claimed getBoundingClientRect call every frame.

**Optimize:** Measure stable wrappers on pointer entry and ResizeObserver changes; use one RAF for the latest pointer sample. Keep reads before writes. Move scanner via x/y transforms, using a measured fixed box/scale strategy that keeps corner brackets crisp; keep text metrics stable.

**Estimated gain:** Pointer geometry measurements reduced from potentially 60–120+ per second to entry/resize measurements. Removes layout-property animation during scanner travel; whole-page benefit is local, not a likely primary idle fix.

**Complexity:** Low–medium, 0.5–1 day. **Risk:** Low–medium: test scrolling while hovered and text wrapping/font loading.

### 11. Unnecessary React renders are concentrated, not site-wide — P2

**Current:** `ConciergeContext.tsx:1071–1072` includes retryInSec in the stable control context, so outage countdown updates invalidate Hero/Landing/other control consumers once per second. `AgentDock.tsx:224` rotates placeholder state every 3.6 seconds even when closed. Graph node callbacks at `GraphMode.tsx:802–803` are recreated and NodeMesh is not memoized when graph hover state changes.

**Why slow:** Unrelated visual subtrees render for a countdown or hidden placeholder. Graph hover causes broader reconciliation than necessary. **Already good:** chat/control contexts are split; ask uses messagesRef; message rows are memoized; visible history is capped at 12; streaming is throttled to ~55 ms; storage writes are debounced. Per-token whole-site rerenders are not the current architecture.

**Optimize:** Move recovery countdown into the fast chat/status subscription; run placeholder timer only when visible; stabilize graph callbacks and memoize nodes after keeping props stable. Do not add blanket useMemo/useCallback everywhere.

**Estimated gain:** Removes irrelevant 1 Hz control-consumer updates during an outage and about 17 closed-dock placeholder updates per minute; fewer graph hover subtree renders. Expected smaller than scene scheduling/batching.

**Complexity:** Low–medium, 0.5–1 day. **Risk:** Low; retain timely offline feedback and agent navigation.

### 12. Hidden graph labels still maintain DOM projections — P2

**Current:** `GraphMode.tsx:456–471` always mounts Drei Html for each node. showLabel only sets inner opacity to zero. Each node also renders a core and glow shell. This graph is correctly lazy-mounted and its edge geometry is already batched/disposed.

**Why slow:** Transparent labels are still mounted projection work; camera movement updates screen-space anchors even when most labels are hidden. In the sample, the graph incurred substantially more style recalculations than hero alone, though this does not isolate labels as the sole cause.

**Optimize:** Mount projection components for visible/selected/hovered labels only; preserve fade-out using a short delayed unmount or a small reusable label pool. Cache graph topology; avoid rebuilding on hover. Keep the selected-node reading experience unchanged.

**Estimated gain:** Removes per-frame projections for hidden nodes; proportional to the hidden-label fraction. Measure remaining layout/style and raycast cost before further simplifying the graph.

**Complexity:** Medium, 0.5–1 day. **Risk:** Low–medium: no label popping during orbit/tour.

### 13. Project posters are responsive in layout, not delivery; preview sources churn — P2

**Current:** `ProjectMedia.tsx:101–119` uses raw lazy img sources, with multiple 1536×1024 posters and a 1672×941 poster. A 1536×1024 RGBA decode is ~6 MiB despite a 44–114 KB compressed file. `:125` attaches video src on hover and removes it on leave. The largest clip is ~6.05 MiB; it is not downloaded on arrival. The portrait already uses Next optimization and was only 23.6 KB in the browser.

**Why slow:** At lower DPR, cards may decode substantially more pixels than displayed. Loading all nine full-sized posters could represent roughly 46 MiB of RGBA pixels before browser eviction/other copies; this is a capacity estimate, not observed resident memory. Repeated source attachment can restart media/decoder initialization. Pausing/rewinding alone does not guarantee decode buffers are released, contrary to the source comment.

**Optimize:** Use responsive image candidates/sizes for posters, maintaining a high-DPR candidate. Keep hovered video sources warm briefly while near view, pause on leave, unload after a far-offscreen timeout with explicit load/reset. Encode the 6 MB preview to an appropriate display resolution if a visual comparison confirms parity; keep the full-quality demo link.

**Estimated gain:** At 1–1.5 DPR, roughly 30–65% fewer decoded poster pixels where smaller candidates suffice; little saving at genuine 2× display sizes. Preview encoding could save 40–70% transfer if suitable, not validated here. Negligible first-hero gain from that video because it is already demand-loaded.

**Complexity:** Low–medium, 0.5–1 day plus encoding QA. **Risk:** Low with correct sizes; medium for video re-encoding. Do not blur the portrait or remove previews.

**Smaller asset cleanup:** The browser also fetched a 180,421-byte favicon. Generate appropriately sized icon variants rather than carrying a large ICO payload. This saves cold-load bytes but is not an explanation for steady-state animation lag; keep it below the rendering fixes in priority.

### 14. Interrupted narration can strand a prefetched blob URL — P2, correctness fix

**Current:** `lib/voice.ts:610–620` starts fetching chunk i+1 before playing i. The next iteration can break on token change/document.hidden before consuming that promise. If its blob URL already exists, it is not owned by hardStop's blobUrlInUse and does not reach playUrlOnce's revocation. This path is used by `ConciergeContext.tsx:255`. Other ordinary voice paths do revoke their URLs.

**Why slow:** A source-confirmed cancellation gap can retain native blob data across repeated interrupted narration. The local graph tests do not exercise TTS, so this was not measured as a tab-memory delta. It is not evidence that all audio playback leaks.

**Optimize:** Own pending fetch/URL lifetime with an AbortController and try/finally; on every exit await/handle the pending result and revoke any URL not handed to playback. Track all outstanding URLs rather than only the currently playing one. Keep prefetch and sound quality.

**Estimated gain:** Prevents up to one stranded prefetched audio blob for each affected interruption; bytes depend on the synthesized chunk, not the unrelated static WAV sizes. Important cumulative hygiene, probably not the primary fresh-page lag.

**Complexity:** Low–medium, 0.5 day with cancellation tests. **Risk:** Low: test stop, new utterance, tab hide and network failure without double-finishing narration.

### 15. Global services have incomplete stop/restart ownership — P3

**Current:** `lib/scrollField.ts:100–127` installs resize/orientation/media-query/visibility listeners, but stopScrollField cancels only RAF; AmbientBackground never releases it on unmount. `lib/perf.ts` clears its interval on pagehide, but its started flag prevents an ordinary reinitialization and there is no BFCache pageshow re-arm.

**Why slow:** Repeated stop/start or route/HMR lifecycles can leave listeners behind; restored pages can lose monitoring. This is not proof of continuously growing listeners during an uninterrupted visit to the current single landing route.

**Optimize:** Return/ref-count a complete disposer, remove named listeners, make start/stop symmetric, and re-arm monitoring after persisted pageshow. Keep all normal effects intact.

**Estimated gain:** Prevents accumulated service callbacks across lifecycle repetitions; small normal-session gain. Treat as robustness, not a headline FPS optimization.

**Complexity:** Low, 0.5 day. **Risk:** Low; verify shared consumers do not stop each other's service.

## Things I would retain / would not optimize blindly

- No evidence of giant HDR texture/environment maps or a heavy bloom/post-processing chain in the active hero. Its point geometry/basic materials are not a reason to remove the signature 3D effect. The physical-transmission fallback is a more specific concern.
- Raw PreloaderScene has a finite shader workload and already disposes geometries/materials/renderer, cancels RAF, disconnects resize observation and handles document visibility. Optimize its overlap, not an imagined permanent shader leak.
- CanvasLifecycle and delayed off-screen teardown exist and work; do not replace them with constant unmount/remount on every viewport boundary.
- Graph edges are already batched; copying the skills batching recommendation onto that code would be wrong.
- The parked spiral/Lenis build and unreferenced NeuralField are not part of the active Landing rendering path. Installed dependency size is not delivered bundle size.
- Hero's scroll phase state bails out when the phase is unchanged; it does not cause a React rerender for every scroll pixel. The cinema dolly already disables competing smooth-scroll behavior and pauses canvases during drift.
- Global CSS/paint is a more credible follow-up profiling target than rewriting all passive scroll listeners. The existing event-driven tracking is modest; idle layout count was zero in the measured samples.
- Local Vercel analytics script 404s and THREE.Clock deprecation warnings appeared. Fixing them is cleanup, not a credible explanation for the rendering lag.

## 80/20 execution order

1. **First pass, preserve every visible effect:** particle caching/input-output separation (#1), viewport-gated canvas allocation (#2), covered-page suspension (#3), and skills edge batching first (#5). These remove invisible/repeated work with the clearest mechanism and lowest design compromise. Rough scope: 2–3 engineering days including comparisons; sphere instancing can follow if edge batching is insufficient.
2. **Next, improve frame consistency:** field sleep/scoping and transform-based aurora (#4), settle reveal filters (#8), hidden-animation/cursor suspension (#9), then hidden graph labels (#12). Re-measure style/paint after each instead of assuming each layer is equally expensive.
3. **Then constrain startup and weak hardware:** real quality policy/governor (#6), intent-based detail/UI loading (#7), responsive posters (#13). Keep a full-quality mode and the visual signature.
4. **Correctness/hygiene in parallel:** voice cancellation (#14), countdown subscriptions (#11), pointer/scanner layout (#10), service lifecycle (#15). Do not market these small fixes as a cure for the entire rendering workload.

"80/20" here is prioritization, **not a claim that four edits will deliver a measured 80% improvement**. I would not replace the premium experience with a static page, remove all glass, lower every asset's quality, or switch animation libraries to chase negligible/unproven gains.

## Acceptance tests for an implementation pass

- Use the same production build/device/viewport for before-and-after traces, then validate a real mid-tier Android device and Safari. Test both variants, light/dark, glass/current and reduced-motion.
- Cold boot should not create a far-offscreen skills context. Graph over hero should have only the visible scene drawing, resuming immediately on close.
- At stationary scroll progress, zero morph position-buffer updates; rotation/thinking still animate. Compare all three phase screenshots, backward scrolling and theme switching.
- Confirm skills draw count with renderer.info; preserve all 39 skill hit targets and hover labels. Capture p95/p99 frame intervals, long tasks, style/layout/paint timings and input responsiveness for repeatable scroll/hover/graph scenarios.
- Compare actual OS tab/GPU-process memory, not just JS heap. Repeat at least 20 graph and section-entry cycles; use heap-snapshot retaining paths if post-GC memory keeps growing. Do not declare a leak fixed solely because one forced GC reduced memory.
- Voice: repeated stop/new utterance/tab hide should leave no orphan object URLs, stuck polling or hanging narration promises.
- Verify responsive posters retain 2× sharpness and previews do not reinitialize on every brief pointer exit. Use screenshot comparison for portrait, glass and revealed cards.
- Run typecheck/lint/build once source changes are made. This audit did not modify application code, so it does not claim a new implementation has passed those gates.
