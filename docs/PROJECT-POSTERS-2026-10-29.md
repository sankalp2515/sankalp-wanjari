# Editorial project posters

Generated with the built-in image-generation tool, using the supplied Veriscope Research Dashboard Hero as the composition/material reference. These are illustrative product showcases, not screenshots or proof of benchmark results. Source repositories were read only; no changes were made to them.

## Source grounding and generation briefs

Shared direction: 16:9 ivory editorial canvas, luminous frosted workspace, strong product identity, large serif headline, concise feature row, generous margins. No invented benchmark percentages, customers or outcome guarantees.

- **IntentSeal:** `AI Security/PRODUCT.md`. Violet/lavender agent-security console. Headline: “Keep agents inside your intent.” Feature row: “Inspect every input / Check every action / Replay every decision”. Session replay shows inspection, malicious span removal, deterministic tool-action check and receipt; reason/source inspector. Mockup labels the session illustrative.
- **Abide:** `IntentSeal-Delegate-Repo/README.md`, existing green checkmark branding, and `docs/snapshots/2-stopped-traced.png`. Forest-green permission card and checkpoint. Headline: “Hand off the task. Approve it once.” Feature row: “Grounded permissions / Every action checked / Proof for every decision”. Order 4521, ₹2,000 cap, allowed ₹1,850 refund, blocked unrelated order 9921 traced to customer ticket T-881. Mockup labels the task illustrative/sandbox.
- **CaseProof:** `CaseProof-Devpost-Fresh/README.md` and `docs/media/analyst-layout/trail-fullscreen-1242.png`. Burgundy/slate evidence workspace. Headline: “A justified first response.” Feature row: “Evidence you can inspect / Money you can trace / Handoffs humans approve”. Customer-to-intermediary-to-destination graph, source-linked findings and independent review. Mockup labels synthetic practice data; no recovery claim.

## Installed assets

- `public/projects/intentseal/poster-editorial.webp` — 1672×941, 119,026 bytes
- `public/projects/abide/poster-editorial.webp` — 1672×941, 101,430 bytes
- `public/projects/caseproof/poster-editorial.webp` — 1672×941, 125,008 bytes

Converted generated originals to WebP at quality 90. Previous posters remain untouched. Config references the new versioned assets. Full composition is contained, not cropped.

## Playback removal

`components/v2/ProjectMedia.tsx` now prefers static posters, excludes GIF/video sources, uses native lazy image decode, and creates no video element, hover listener, media observer or playback state. Preview metadata and demo links remain intact for explicit viewing outside project-card hover.

Regression script: `output/playwright/project-posters-check.js` checks all three images decode, no card videos or motion-media requests on hover, and no mobile overflow. No commit or deployment.

Validation: TypeScript and targeted ProjectMedia lint passed. Chromium returned `posters: 3`, `cardVideos: 0`, `motionRequests: []`, `errors: []`; desktop/mobile screenshots were visually inspected. Existing development analytics CSP warnings remain unrelated.
