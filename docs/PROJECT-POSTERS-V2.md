# Independent project identities

Replaces the first coordinated editorial set, which followed Veriscope too closely. New images use the built-in image-generation tool with three independent briefs; exact prompts are in `PROJECT-POSTER-PROMPTS-V2.json`.

| Project | Visual concept | Composition and typography | Installed asset |
| --- | --- | --- | --- |
| IntentSeal | Dark violet architectural action gateway | Oversized left-aligned grotesk headline, isometric gate, dark decision/receipt panels | `public/projects/intentseal/poster-distinct.webp` |
| Abide | Daylit permission-bound delegation workspace | Staggered tactile workflow cards, green sans-serif, large bottom headline | `public/projects/abide/poster-distinct.webp` |
| CaseProof | Investigative evidence dossier | Navy vertical masthead, editorial serif, paper money trail and review documents | `public/projects/caseproof/poster-distinct.webp` |

All are 1672×941 static WebP at quality 88. Approximate sizes: 196 KiB / 161 KiB / 337 KiB. CaseProof's paper texture costs more bytes; it still uses native lazy loading with no video decode. Content remains illustrative rather than a claim that the live software literally has the depicted visual design. Synthetic/example labels remain visible.

Chromium desktop/mobile checks passed: three new images decoded, computed image fit is `contain` for every poster, zero video/GIF requests during hover, no mobile overflow or uncaught page errors. Rendered project cards were inspected visually.

Config now uses versioned `poster-distinct.webp` paths so caches do not serve the previous posters. All earlier assets remain intact. Card media preserves the entire image with a palette-matched backdrop rather than cropping titles. Hover video/GIF playback remains disabled. No commits or deployment.
