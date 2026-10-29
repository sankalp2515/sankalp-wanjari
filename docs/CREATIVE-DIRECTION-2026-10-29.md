# The Human Behind the Proof

Creative direction and cinematic interaction specification for Sankalp Wanjari's portfolio.

Status: design proposal, not an implemented redesign. Grounded in the current v2 components, portfolio content, existing fonts/color tokens, and the preceding performance audit. No application files, dependencies, assets, configuration or Git history were changed in this turn.

## Reversibility

This document is the only file created in this turn. From PowerShell, undo this turn's filesystem changes with:

```powershell
Remove-Item -LiteralPath 'E:\New_Project Portfolio\claude\new_portfolio\docs\CREATIVE-DIRECTION-2026-10-29.md'
```

This targets only the new proposal. It does not revert or delete any existing uncommitted portfolio work.

## 1. Creative thesis

**The memory to leave:** “Sankalp is the person who turns uncertain AI behavior into systems I can trust.”

The current hero gives the abstract proof engine more prominence than its author. Reverse that hierarchy: person first, point of view second, inspectable evidence third. Keep the technological sophistication, but make it a demonstration of judgment rather than the subject of the website.

Primary audience: hiring managers and recruiters. Secondary audience: technical peers who want to inspect architecture and limitations. Exploration is optional; understanding who Sankalp is must never require exploration.

Five-second comprehension: name, role, face, specialization and a visible Work button. Thirty-second decision: relevant builds, personal contribution, evidence and an easy resume/contact path. Deeper visit: trade-offs, limitations, implementation and product decisions.

### Direction review

Rejected: a full-screen OS/dashboard metaphor, another anonymous particle planet, identical glass cards for every paragraph, a compulsory boot film and “AI that…” as the primary identity.

Chosen: an asymmetric portrait-led opening and one recurring visual device—the evidence thread. The thread changes from a proposed action to a permitted action to a traceable result. It is specific to the security, agent and decision-support work already in the portfolio.

**Rationale:** one memorable idea can accumulate meaning throughout a visit. Several unrelated visual tricks compete with one another and obscure the hiring story.

## 2. Visual system

### Palette: retain Warm Signal, give each color a job

| Token | Dark value | Light counterpart | Purpose and rationale |
|---|---|---|---|
| Ground | `#0C0B09` | `#F6F1E8` | Existing warm foundation; retain identity and avoid a disruptive rebrand. |
| Surface | `#16130F` | `#FFFDF8` | Distinct reading plane; content must not depend on transparency. |
| Primary text | `#F8F3EA` | `#211C13` | Quiet, readable typography over expressive imagery. |
| Supporting text | `#C9BEAC` | `#4C4535` | Real hierarchy without faint, low-legibility copy. |
| Signal amber | `#F5A623` | `#B26A05` | Intention, selection and primary action—not every heading. |
| Evidence teal | `#2DC7B0` | `#0B8477` | Supporting evidence and completed verification—not decoration. |

Keep existing warning/error tokens for actual failures. Pair every state color with text/icon; amber and teal must not be the only way to distinguish pending versus verified. Check contrast over the actual composited surface, not just token swatches. Normal text target 4.5:1; large text and non-text controls 3:1 where applicable.

**Glass:** use it where layers genuinely overlap: navigation, the compact AI dock and an inspector. Reading pages and long case studies use stable, nearly opaque surfaces. Standard glass recipe: 82–90% surface fill, 8–12 px backdrop blur, a subtle top-edge highlight and a quiet border. Only the active overlapping surface needs live blur. Provide the same fill/border appearance when backdrop filtering is unavailable. No nested glass-on-glass article containers.

**Rationale:** premium glass is a depth cue, not a texture applied indiscriminately. The person and work should remain the strongest contrast in the frame.

### Typography

Retain the already configured families: Space Grotesk for identity/display, Inter for reading/UI, JetBrains Mono for actual technical values or code only. No new font download is necessary for this direction. Use sentence case for navigation and labels; reserve uppercase for legitimate acronyms.

| Role | Desktop | Mobile | Setting |
|---|---:|---:|---|
| Name/identity display | 88–112 px | 42–54 px | 500 weight, 0.98 line height, −0.045em tracking |
| Main thesis | 40–56 px | 28–36 px | 500 weight, 1.08 line height |
| Section title | 36–48 px | 28–34 px | 500–600 weight, 1.12 line height |
| Project title | 26–32 px | 22–26 px | 600 weight, 1.15 line height |
| Reading copy | 18 px | 17 px | 400 weight, 1.6 line height, 58–68ch width |
| UI/metadata | 14–16 px | 14–16 px | No essential 9–11 px text |

Use fluid clamps between these endpoints. Do not squeeze the name onto a single line; allow “Sankalp / Wanjari” to become a deliberate two-line composition. Give the complete headline one consistent treatment rather than accenting one word with gradient/outline/italics.

**Rationale:** the name is the brand mark. Technical precision comes from legibility and content, not a sea of tiny monospace labels.

### Grid and spacing

- Desktop: 12 columns, 24 px gutters, maximum 1,280 px content width; 48–80 px outer margins as space permits.
- Tablet: 8 columns, 24 px gutters, 32 px margins.
- Mobile: 4 columns, 16 px gutters, 20 px margins.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 144 px.
- Major chapter separation: 96–144 px desktop, 64–80 px mobile. Internal relationships use 16–32 px.
- Left-align editorial content. Center only short confirmations or intentionally isolated closing statements.
- Header: one row on desktop; on mobile retain name, menu and one obvious contact action. Avoid stacked fixed promotional banners.

**Rationale:** whitespace should distinguish ideas, not create a long runway between them. Breakpoints respond to content fit; they are not invitations to crop panels.

## 3. Opening composition

```text
Sankalp Wanjari                 Work   Case studies   About   Resume   Contact

Sankalp                         Portrait, waist-up, generous presence
Wanjari                         with a narrow evidence thread behind it
AI engineer and product thinker

I build AI systems              [small interactive intention → policy → action]
people can trust to act.

[Explore my work]  [Contact me]             Ask Helios (optional, clearly named)
```

Desktop balance: copy occupies 6 columns; portrait/system composition occupies 6. Keep the portrait approximately 360–480 px tall where the viewport allows, not a 100 px circular avatar. Use the supplied profile_pic_2.png or profile_pic_4.png after crop/edge review; neither requires a new generated portrait. Do not cover the face with glass or particles. On mobile, name/role → portrait → thesis/actions in real document flow; do not force the entire hero into 100vh.

Suggested thesis is proposed positioning copy, not a new employment claim. The full legal name remains available in About/resume; navigation uses the shorter readable name.

The 3D element occupies a bounded area beside/behind the portrait. Its initial arrangement is already meaningful as a static frame: an intention, a policy gate, an action receipt. Visitors who do nothing still understand the metaphor.

### Signature interaction: “Show me the boundary”

Three accessible controls: **Intention**, **Permission**, **Evidence**. Selecting one reframes the same thread and reveals one short explanation. An optional “Try a blocked action” button demonstrates a simulated unapproved destination being stopped, followed by the reason. Label it “Illustrative interaction—not a live security scan.”

Manual buttons and Helios use the same deterministic UI actions. The simulation requires no LLM call. Do not depict this animation as proof of a measured detection rate or claim real protection from an illustrative demo.

**Rationale:** the memorable animation teaches the visitor what this engineer values. It is not a second product onboarding flow, and recruiters can ignore it without missing the work.

## 4. Storytelling and navigation

Use native vertical document scrolling as the accessible spine, with visible section links and a horizontal work explorer as an optional local interaction. No wheel hijacking, compulsory horizontal page navigation, or dot-only discovery. This accommodates the cinematic-scroll request without reviving earlier trapped/hidden-panel problems.

| Chapter | Question answered | Treatment | Rationale |
|---|---|---|---|
| Identity | Who am I considering? | Portrait-led opening with direct Work/Contact actions | Recruiters encounter the person before the metaphor. |
| Selected work | Can he build relevant systems? | Three substantial project frames, then a visible “All projects” index | Curate before presenting a catalog. |
| Product case studies | How does he make decisions? | Separate destination/index and reading layout | Product judgment is not another engineering-detail tab. |
| Professional experience | Has he delivered with other people? | Role-led entries with scope, contribution and documented outcome | Professional credibility should not compete with education nodes. |
| About and capabilities | How does he think and collaborate? | Human narrative with skills linked to actual project evidence | Evidence-linked skills beat decorative proficiency percentages. |
| Recognition and education | What independent signals support the story? | Compact, sourced records; education remains distinct from employment | Credentials corroborate the work rather than replace it. |
| Contact | What is the easiest next step? | Email, resume, availability and a small optional form | A single clear handoff has higher value than another spectacle. |

Proposed work curation: IntentSeal for trust boundaries, Abide for decision/financial workflows, CaseProof for justified analyst responses. Keep AutoML and the other existing builds available in the full index. This is an editorial proposal, not a change to project ordering in config.

Each project frame shows an authentic screenshot, problem, personal contribution, stack, deployment status and one defensible piece of evidence or limitation. Reuse current sourced content; never invent customers, benchmarks or production adoption. Preview videos play on explicit hover/focus where supported, or a Play button—not automatically across the grid.

### Two genuinely different detail experiences

**Engineering project:** visual overview → architecture → important implementation choice → tests/evidence → limitations → source/demo. Large media, architecture interaction and a compact technical facts column. A local horizontal reel can show the next project; arrows and keyboard controls are always available.

**Product case study:** readable article with a persistent contents rail: context → user/problem evidence → options → decision/trade-off → delivery → outcome/learning. Use an illustrative or retrospective label when primary research or measured outcomes are unavailable. Do not fabricate a product-research story from a repository README.

Use deep-linkable destinations. Back restores the previous list/filter/scroll position; Escape closes modal presentations; a visible Close or Back control remains in every overlay. Use buttons for actions and links for destinations. One modal/dialog stack at a time, with focus trap and focus restoration.

### Contact art direction

Closing line: “Have a difficult AI problem worth solving?” Supporting line describes the actual role interests from config. Primary action: Email Sankalp. Secondary: Download resume. Only show scheduling if a genuine booking destination exists. Keep the form optional and explain where its message goes. Do not promise reply times unless the owner can honor them.

**Rationale:** a calm, unusually clear closing frame communicates product judgment better than extra badges or an unrelated animated form.

## 5. Component library and visual grammar

| Component | Visual rule | Required behavior / reason |
|---|---|---|
| Identity header | Quiet type, small mark, minimal glass only over content | Persistent destination names and visible active location. |
| Primary action | Solid amber, dark label in dark theme; minimum 44 px touch area | Clear next step; one dominant action per content region. |
| Secondary action | Text or understated outline, equal accessible hit area | Remains discoverable without competing with primary action. |
| Project frame | Media-first, 16 px radius, no generic stat-tile grid | Makes the actual build the visual artifact. |
| Case-study entry | Problem/decision-led typography, not a project-card clone | Signals a different kind of evidence. |
| Evidence receipt | Teal status + plain-language caption + source link | A claim can be inspected, not just admired. |
| Architecture figure | Flat SVG/HTML, zoom only on explicit request | Clear labels survive mobile and screenshots. |
| Experience entry | Employer/role/date hierarchy and expandable evidence | Employment stays distinct from credentials. |
| Agent dock | One compact glass layer, sentence-case action chips | Optional assistance, visible close/reset, usable offline commands. |
| Inspector/dialog | Stable opaque reading surface, 20 px radius | Focus trap, Escape, back/close and restoration are part of the component. |
| Status/notification | Icon + short explanation + recovery action | Real state only; no fake reasoning or invented “live” activity. |
| Contact form | Persistent labels, inline validation, explicit sending/success/error states | Submission is understandable without audio, animation or color. |

Radius hierarchy: controls 8 px, frames 16 px, overlay 20 px. Avoid pill-shaped containers for every object. Borders identify boundaries; numbering identifies actual steps, not arbitrary section decoration.

**Iconography:** retain Lucide, consistent 1.5–2 px stroke at 20–24 px. Give unfamiliar icons text labels. Arrows describe navigation/direction, not decoration on every sentence. Do not combine several incompatible icon packs.

**Illustrations:** project-derived diagrams, policy gates, trace paths and annotated real screenshots. Use SVG/HTML for diagrams; real screenshot/video for UI; Three.js only when spatial interaction adds meaning. No generic AI-brain stock illustration, invented product mockup, or randomly orbiting tool logos.

## 6. Complete cinematic motion language

### Motion rules

Motion has three jobs: **establish identity**, **explain a relationship**, or **confirm a change**. If an animation does none of these, remove it from the plan. One focal motion per viewport; do not animate every heading, card and background at once. Text should be readable without waiting for a reveal.

Timing/easing tokens below are proposed design specifications, not measured browser guarantees:

```css
--motion-feedback: 120ms;
--motion-control: 180ms;
--motion-panel: 320ms;
--motion-scene: 600ms;
--ease-out: cubic-bezier(.22, 1, .36, 1);
--ease-in-out: cubic-bezier(.65, 0, .35, 1);
--ease-exit: cubic-bezier(.4, 0, 1, 1);
```

Use a critically damped, no-visible-bounce spring for dragged/physical objects; suggested starting values stiffness 220, damping 30, mass 1, tuned in the actual layout. Do not prescribe spring duration as if it were a fixed tween. Exit movements are shorter/smaller than entrances.

| Experience | Choreography | Timing / limits | Meaning and implementation |
|---|---|---|---|
| Initial arrival | Name, portrait and primary actions are immediately present; evidence thread resolves once around them | 600–800 ms total; offsets ≤16 px; no forced delay | Introduces the author before the system. Animate a bounded decoration, not readability. |
| Loading | Static meaningful hero immediately; local asset placeholder if genuinely needed | A progress indicator only for measurable loading; never a fake fixed boot sequence | Avoids making visitors wait for a brand film. Resume/contact work during loading. |
| 3D hero | One claim → permission → receipt arrangement; pointer nudges ≤3–4 degrees | Interaction response 180–300 ms; optional one-shot 700 ms resolve | Spatial organization explains cause and effect. Preserve the useful static frame; no mandatory continuous spin. |
| Narrative chapter | One evidence thread endpoint moves to the relevant figure; title stays stable | 400–600 ms, triggered once near entry | Connects a chapter to its evidence rather than repeating fade/blur on every element. |
| Scroll storytelling | A short, bounded diagram changes state within a section | No global pinning; desktop only optional ≤0.5 viewport sticky segment | Scroll explains a relationship, never gates access to copy. Provide controls for every state. |
| Parallax | Hero background thread shifts 12–24 px relative to a stable portrait; figure image 8–12 px maximum | One layer at a time, transform only | Gives depth without making the page feel detached from the pointer. No text parallax. |
| Work explorer | Selected frame advances horizontally; adjacent frame remains partially visible | 280–360 ms; drag threshold with touch scrolling preserved | Shows a finite collection and spatial continuity. Keep index/list and arrows as alternatives. |
| Project entry | Thumbnail expands into matching detail media, then metadata appears | 320–420 ms; no simultaneous double backdrop blur | Preserves object continuity; fall back to a simple fade if shared-element support is unavailable. |
| Case-study entry | Stable article appears with a short crossfade; reading position remains predictable | 160–220 ms | Reading requires calm. Do not animate a long document flying in from below. |
| Back/close | Reverse the originating relationship; restore prior viewport/filter/focus | 180–240 ms | Makes the destination and exit understandable. Browser Back must work without waiting for the animation. |
| Card hover | Image crop moves ≤4 px, frame lifts ≤2 px, source/link affordance becomes clearer | 160–200 ms | Signals what can be opened. No tilting paragraphs or stretched text. Keyboard focus exposes the same information. |
| Buttons | Border/fill response, ≤1 px press displacement | 100–140 ms | Confirms the physical action with minimal distraction. Keep hit area stationary. |
| Cursor | Native cursor by default; optional small trailing ring only over the interactive hero/diagram | Ring follows in roughly 80–120 ms; sleep when settled | Shows where spatial manipulation is available. No global cursor replacement, hidden text caret or touch emulation. |
| Agent action | Show real stages: finding evidence → opening work → ready; surface selected content once | State-driven, not a fake fixed-duration thought loop | Communicates actual tool activity. Never replay the entire hero on each token. |
| Hint chips | Selection moves into the conversation and corresponding destination highlights once | 160–220 ms; feedback pulse ≤500 ms | Connects a natural-language request to its visible result. Deterministic navigation works without LLM availability. |
| Contact success | Submit changes to “Message sent”; concise confirmation and next action | 180–240 ms | Gives closure. No confetti, disappearing form data on failure, or celebratory delay. |
| Optional audio | Opt-in, quiet activation/complete cues; user-controlled level and mute | ~30–80 ms typing cue at most per word/pause, not every keystroke; ~120 ms completion cue | Adds tactility without becoming a typing tax. Never autoplay, synthesize per token, or make sound the only status signal. |

### Reduced motion and accessible equivalents

- Replace spatial travel/parallax/looping effects with static endpoints and a short opacity change, or immediate state updates if preferred. Keep every button and all evidence available.
- Preserve identity and page composition. Reduced motion must not mean missing content, a broken hero or an unlabelled canvas.
- Every canvas interaction has an HTML control/content equivalent outside the canvas. Hover never reveals essential information exclusively.
- Keep focus rings, skip link, readable zoomed text and 44 px touch targets. Do not make scroll progress the only way to complete an interaction.
- Use the newly established hydration-safe preference subscription. Preference changes must not rebuild the whole SSR tree.

## 7. Performance contract for implementation

Preserve the recently added lifecycle controls. The premium effect is the visible response, not how much code runs while nobody can see it.

1. One visible WebGL renderer drawing at a time in the main narrative. Graph is optional; pause the covered page while it owns the frame. Retain a context briefly for seamless return; dispose far-offscreen resources through the existing delayed policy.
2. Reuse the hero renderer rather than adding separate canvases for every narrative chapter. Never mount a new full-screen 3D scene solely for a transition.
3. Precompute geometry/morph targets; send changed inputs, not reconstructed buffers. Keep shader/material variants bounded and prewarm the next necessary state rather than compiling every possible effect at boot.
4. Use CSS/WAAPI or existing Framer Motion for transform/opacity transitions; Three.js only for spatial visuals. Do not add a second smooth-scroll driver or another motion framework.
5. Cache geometry measurements at entry/resize, batch reads before writes, and avoid layout properties in repeated movement. Do not assume blur/gradient animation is compositor-only.
6. Use poster-first, correctly sized images; warm details/media near viewport or on intent. Start previews only when wanted; pause/unload through the existing media lifecycle. No automatic simultaneous video wall.
7. Glass and temporary effect layers must be bounded and released. No permanent `will-change` on every card, full-page animated blur, pointer-driven noise shader, or post-processing chain without a measured benefit.
8. Keep visible pointer/keyboard feedback within ~100 ms as a product target. For a representative 60 Hz device, target p95 animated frame intervals ≤16.7 ms and avoid app-caused tasks >50 ms during the test path. These are acceptance targets, not claims about current performance or guarantees on every GPU.
9. Use existing stable UI/control subscriptions. Token streams update the dock, not the entire page. Audio remains one owned playback path with cancellation and URL cleanup.
10. Record before/after on the same device and build mode. Include GPU/native memory where measurable; do not use JS heap alone to claim tab-memory savings.

**Rationale:** time spent on invisible work cannot improve perceived craftsmanship. Better scheduling protects visual quality more effectively than lowering all assets or deleting meaningful motion.

## 8. Release and evaluation plan

### Stage 1: comprehension before spectacle

Prototype the static hero, Work index, separate case-study article, About/experience distinction and contact handoff. Ask visitors to identify the person/role and find a relevant project, resume and contact without using AI. Fix navigation ambiguity before motion.

### Stage 2: one signature moment

Add the bounded intention → permission → evidence interaction with HTML equivalents and a labelled simulation. Compare its still and animated versions: does it improve understanding, or only attract attention? Keep the portrait/name dominant in both.

### Stage 3: continuity and tactile response

Add work transitions, local hover/focus behavior and state-driven agent activity. Validate Back, Close, Escape, keyboard focus, direct links, mobile and reduced motion. Keep optional audio last and off by default.

### Stage 4: controlled comparison

If testing a future implementation, use stable visitor assignment between the current experience and the new one. Primary conversion: resume download or completed contact action per eligible visit. Secondary signals: relevant project-detail engagement and the ability to recall name/specialization. Guardrails: errors, mobile overflow, input delay, frame pacing, abandonment and accessibility failures. Define event deduplication and exposure before measuring. Do not call ordinary theme switching an A/B experiment; do not declare a winner from tiny samples or raw animation engagement.

Build this later as an isolated experience module using shared content and existing motion/lifecycle utilities. Establish a separate one-command rollback for that implementation before editing the live composition; the document's deletion command applies only to this proposal.

## Final creative test

Remove the animation: does the page still clearly sell Sankalp's work and judgment? Remove the AI service: can every hiring task still be completed? Close an overlay: does the visitor know where they are? Look away from the screen: can they remember the person's name and the reason to hire him?

Only then does the cinematic layer deserve its place.
