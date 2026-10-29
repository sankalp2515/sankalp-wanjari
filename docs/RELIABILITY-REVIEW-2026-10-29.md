# Reliability evidence layer — review draft

No commit or deployment. Existing design and earlier uncommitted work retained.

## Positioning

Homepage keeps its existing visual identity and broad AI-engineering/product positioning. Added a quiet evidence preview after projects, a Reliability navigation destination and independent shareable project pages. Earlier publications remain accessible from the evidence page and homepage research section.

Primary copy uses an explanation-first structure: engineering question → method → evidence → limitations → source. Alternative considered: failure-story → intervention → outcome. Chose the former because research and hiring reviewers need to inspect claims quickly, without interpreting a sales narrative. Neither version promises general safety or selection by a fellowship.

## Review routes

- `/reliability`: four source-linked investigations, explicit denominators/provenance and next experiments marked not run.
- `/reliability/intent-bound-controls`: AI-assisted engineering synthesis, with existing results separated from a proposed controlled study. Not presented as a peer-reviewed paper or newly executed experiment. Please review the hypothesis, wording and personal contribution before publishing.
- `/work/intentseal`, `/work/abide`, `/work/caseproof` and six other project paths: static, directly shareable technical breakdowns with contribution, source and evidence links.

## Integrity

IntentSeal's joint acceptance target failure is visible alongside aggregate recall. Abide's shared foundation and simulated approval baseline are explicit. CaseProof's browser acceptance checks are not represented as fraud-reduction outcomes. Veriscope's retrieval claim is not converted into a truthfulness score. Generated posters now say “Concept illustration”. No benchmark, new experiment, publication or safety credential was fabricated.

## Performance and scope

New reading routes use server-rendered HTML and scoped CSS. No WebGL, external font package, continuous animation or new dependency added. Native links and details work without the AI API. Helios's grounded prompt/offline facts now distinguish the note's proposed experiments from completed results.

## Verification

Final production rebuild passed, generating both reliability routes and all nine project pages. Focused new-code lint passed. Chromium passed evidence index/limitations, direct project reload, proposed-study labels, details disclosure, mobile overflow, keyboard links, Veriscope anchor and homepage navigation with the AI API mocked unavailable; no uncaught page errors. Browser script: `output/playwright/reliability-check.js`. Screenshot paths: `output/playwright/reliability-desktop.png`, `reliability-mobile.png`. Existing development analytics CSP warnings are unrelated.

Remaining: owner review of AI-assisted note and factual contribution statements; no new empirical evaluation has been run. Remote source links refer to repository main branches and may move independently of historical report identifiers.

## Visual follow-up

Matched the homepage's existing amber/teal palette, Space Grotesk display type, technical grid and glass navigation. Added a split hero with a keyboard-operable authority-boundary illustration, project poster index and study headers, separately labelled detection/execution graphics, and a proposed four-condition matrix. Diagrams are illustrative and do not run live security tests or imply new empirical results. Static HTML/CSS and a small React scenario switch replace the text-only presentation; no WebGL, perpetual animation, video or new package was introduced.

Production build, TypeScript and focused lint passed. Chromium checked the two scenario states, keyboard Enter, light/dark theme, mobile overflow, poster decode and reduced-motion mode with no uncaught page errors. Screenshots: `output/playwright/evidence-note-visual-desktop.png`, `evidence-note-visual-light.png`, `evidence-note-visual-mobile.png`, `evidence-overview-visual-desktop.png`. Generation-free UI visuals keep all labels and values editable in source.
