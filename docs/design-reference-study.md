# Design reference study — 18 November 2026

Scope: visual direction research only. No implementation changes. The existing `/studio` preview remains unchanged.

## Sources and coverage

- https://tailor-by-octaboot.vercel.app/ — inspected the rendered opening and waistcoat scene in Chrome; navigated the scroll sequence. Extracted branding and text through Firecrawl. Later chapters were present in extracted text but were not all visually verified. No claim of mobile or performance validation.
- https://www.instagram.com/p/DfYJGHxKsL2/ — inspected caption and sample frames showing art-directed website examples. Promotes a design skill; not independent evidence of that skill's effectiveness.
- https://www.instagram.com/p/DfScZgPSqc1/ — inspected caption and frames showing a restrained base palette with an unexpected accent. Examples include black/white/lime and navy/cream/coral.
- https://www.instagram.com/p/DfdWvaoBT2b/ — inspected caption and a palette/product composition frame. Advocates 60/30/10 color proportions; visible example uses cream, forest green and hot pink. Treat percentages as a composition heuristic, not a usability law.
- https://www.instagram.com/p/DdJ5ynbDxqS/ — opened and inspected caption and sampled video frames. Sparse caption markets a workflow; full spoken explanation was not transcribed or verified. Do not attribute detailed rules to it.
- https://www.instagram.com/p/DdWft3qppSU/ — inspected caption and a frame recommending Taste Skill. Caption promotes five plugins; the complete list was not verified. Do not claim installation or endorsement.

These are sampled visual inspections, not complete transcripts or frame-by-frame video analyses.

## Tailor: observed visual system

Extracted branding reports Cormorant Garamond for headings, Jost for body, background #0A0A0B and accent #C6A35C. Heading sizes in the capture include 134.4px and 64px; these are viewport-specific observations, not universal tokens. The screenshot shows light display text despite extraction classifying gold as primary text, so do not blindly reproduce automatic role assignments.

Observed: almost-black stage, large light serif title, selective gold, very quiet navigation, fine outlines, no rounded-card grid, garment imagery as the dominant subject. Opening title overlays the subject; a later scene moves supporting text to the right of a large garment view. Chapter progress remains subordinate. The scene's changing garment construction explains the product rather than decorating it.

Unverified: exact implementation mechanism, frame count, asset memory, easing and GPU costs. Do not describe it as live 3D, a shader or a particular animation library without source inspection.

## Why our first preview falls short

1. Competent spacing but no ownable visual centerpiece.
2. Portrait, circular line and note feel assembled rather than part of one composition.
3. Equal-weight project buttons and predictable stacked sections lack dramatic hierarchy.
4. Posters are presented as thumbnails rather than a deliberate product narrative.
5. Neutral surfaces have little tonal tension; the principal action lacks a distinctive color role.
6. Interactions swap text but do not show the consequences of a design decision.

## Proposed adaptation — not a replica

Working direction: **The anatomy of a useful product**.

Make Sankalp's identity unambiguous, but use one cohesive product composition as the signature visual. Show the interface, the decision that shaped it and the evidence behind that choice as related layers. Never use a decorative AI orb as a substitute for the work.

- One primary stage, not a wall of equal cards.
- Large type balanced against small, legible utility text; avoid tiny cinematic body copy.
- Dominant neutral base, secondary material tone and one action accent. Proposed palette requires visual exploration; do not simply copy Tailor's black/gold.
- Real interface captures and clearly marked conceptual diagrams; no invented user dashboards, metrics or research artifacts.
- Deliberate foreground/background overlap, consistent lighting and restrained shadows. Glass only for a small contextual control layer.
- Product selection and chapter controls both directly clickable. Do not force a recruiter through a long scroll narrative.
- Movement reveals relationships: context to interface, interface to decision, decision to evidence. No unrelated floating widgets.
- Existing engineering library, résumé, contact and reliability evidence stay accessible without AI.
- Retain project status and evidence caveats. A staging prototype remains a staging prototype.

## Proposed motion and performance constraints

Short control feedback: 120–180ms. Scene changes: 450–650ms, ease-out. These are proposed values, not extracted reference timings.

Use transforms and opacity on a few elements; no large continuously animated blur. No eager frame sequence or permanently running WebGL scene. Load selected project media, reserve its aspect ratio, and pause work off-screen. Reduced motion uses immediate state changes or brief fades. Native mobile reading remains available. These constraints preserve the composition without repeating the portfolio's prior memory problems.

## Acceptance checks for the next design sample

- Identity and role understandable before interacting.
- A memorable composition beyond a headline plus portrait card.
- One obvious primary action and a direct route to résumé/contact.
- Switching chapters changes meaningful visuals, not just paragraphs.
- Every interactive layer has a visible exit/back route.
- No invented PM responsibilities, discovery studies or adoption claims.
- Desktop, mobile, keyboard and reduced-motion views verified before presentation.
- Current homepage preserved; no commits or pushes without explicit instruction.
