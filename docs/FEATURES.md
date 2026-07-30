# Portfolio Features — built after commit `019d71b`

> Baseline: `019d71b "fixed production bug"` (2026-07-28). Everything below was
> built in the sessions after that commit and is **not yet committed**. Variant A
> is the primary experience; Variant B (Film) is intentionally left untouched by
> this work unless noted.

---

## 1. AI features

### 1.1 Interrogate-a-project
Turns a passive project card into questionable evidence.
- **Where:** an "INTERROGATE THIS PROJECT" chip row in every project modal —
  *Explain simply · For a CTO · Hardest trade-off · What he'd redo*.
- **How:** tapping a chip closes the modal and hands Helios a scoped question via
  `ask(q, { projectId })`. The client sends **only the project id** (never
  client-authored prompt text — injection-safe); the server injects that
  project's full `breakdown` (problem/approach/results/lessons/role) into the
  system prompt as a `## FOCUS PROJECT` block, so trade-off answers come from the
  real notes, not a guess.
- **Files:** `components/v2/ProjectModal.tsx`, `lib/llm/systemPrompt.ts`
  (`buildSystemPrompt(visitorType, projectId)`), `app/api/ai/route.ts`
  (`projectId` in body + cache key), `contexts/ConciergeContext.tsx`
  (`ask(text, { projectId })`).
- **Status:** ✅ live.

### 1.2 Self-learning FAQ (starter chips)
The concierge's starter chips learn which topics visitors actually ask about.
- **How:** genuinely-typed questions (not chip clicks — that would bias the
  counts) are POSTed to `/api/faq`, which classifies each into one of a **fixed
  set of canonical questions** and increments only that counter. Raw visitor text
  is **never stored or surfaced** — no privacy/moderation exposure. `GET` returns
  the most-asked as chips, cold-starting to the static defaults.
- **Persistence:** Upstash Redis (hash `faq:counts`), in-memory fallback.
- **Files:** `app/api/faq/route.ts`, `lib/faq.ts`, `components/v2/AgentDock.tsx`.
- **Status:** ✅ live. (Counts only populate once `UPSTASH_*` env vars are set;
  otherwise per-instance in-memory.)

### 1.3 Enriched in-between nudges
The floating suggestion popups now reference the **specific** thing a visitor
just did, and there are more moments for them to fire.
- **New triggers** (on top of the original 4 — tour-done, 2+ cases, 3-min dwell,
  45s idle):
  - `deep-reader` — lingered ~35s on ONE case without asking → names that exact project.
  - `silent-explorer` — scrolled deep but never opened the chat.
  - `resume-no-contact` — grabbed the resume but hasn't reached out.
- **Sharper prompt:** the LLM is told the signal describes the specific action and
  MUST reference it (exact project name / action) with a concrete micro-payoff.
- **Grounding:** tracks last-opened case name + whether the chat was ever opened.
- **Files:** `components/v2/NudgeLayer.tsx`.
- **Status:** ✅ live. Still LLM-generated with deterministic per-persona template
  fallback; gated by the budget governor (§3.1).

### 1.4 Exit recap ("the AI watched you")
A synthesized sign-off as an engaged visitor makes to leave.
- **How:** `beforeunload` can't await a fetch, so the recap is **precomputed** in
  the background once the visitor is engaged (budget-gated, one call), cached, and
  shown instantly on exit-intent — desktop: cursor to browser chrome; touch: long
  idle. Once per session, deterministic template fallback.
- **Files:** `components/v2/ExitRecap.tsx`. **Status:** ✅ live (Variant A).

### 1.5 Helios first-touch heads-up
Announces the AI exists, early — the fix for "a 3-minute visitor never discovers
the concierge/tour."
- **How:** a small Helios bubble appears ~5s after load (once/session, Variant A)
  offering *Take the tour* / *Ask*. Yields to the dock and tour, auto-dismisses.
- **Files:** `components/v2/HeliosIntro.tsx`. **Status:** ✅ live.

---

## 2. Non-AI / UX features

### 2.1 Highlight strip (under the nav)
Replaced the old persona strip. Shows **one real config fact per visit** (random
pick *after mount* to avoid hydration mismatch), each paired with a matching
action (*Reach out / See the work / View resume / Ask Helios*). Dismissible per
session, Variant A.
- **Files:** `components/v2/HighlightStrip.tsx`.

---

## 3. Infrastructure

### 3.1 Client-side AI budget governor
The server caps `/api/ai` at 30/hr/IP — one bucket shared by chat AND proactive
calls. The governor gives **proactive** calls their own smaller budget (8/hr, 25s
min gap, 8s quiet after a user call, single-flight) so background features can
never starve the visitor's chat. `spendProactive(fn)` returns `null` (skipping
the call) when denied → caller uses its template. `noteUserSpend()` records user
chats so proactive paces around them.
- **Files:** `lib/aiBudget.ts`; wired into `NudgeLayer`, `ExitRecap`,
  `ConciergeContext.ask()`.

### 3.2 Server prompt: focus-project grounding
`buildSystemPrompt` accepts an optional `projectId` and injects that project's
breakdown. Response cache keyed on it. (See §1.1.)

---

## 4. Parked — persona / Director autonomy (commented out, NOT deleted)

Built, then parked at the owner's call. Grep `TODO(persona-autonomy — PARKED)`.
- **Why parked:** the upfront "What brings you here?" chooser was friction, and
  the persona-driven project reorder was *invisible* because AutoML scores #1 for
  every persona under the tuned weights — so DirectorSignal would have announced
  changes that didn't show.
- **Kept in place:** `components/v2/PersonaLayer.tsx`,
  `components/v2/DirectorSignal.tsx` (the "HELIOS · DIRECTING" legibility pill),
  `lib/director.ts` (weights, `rankProjects`, `inferPersona`, `useDirective`),
  and `config/portfolio.ts` `projectDimensions` + `heroVariants`.
- **Usages commented:** `Landing.tsx`, `Hero.tsx` (fixed to the signature
  headline), `ProjectsSection.tsx` (static config order).
- **To revive properly:** no upfront chooser (silent inference only) + retune
  `projectDimensions`/weights so each persona gets a **visibly distinct** #1.

---

## 5. Not part of this pass (flagged)

- `app/lab/`, `components/lab/` — a separate `/lab` experience (parallel work, not
  built here). **⚠️ It currently blocks `next build`:** a Windows case collision
  in `components/lab/LabExperience.tsx` (`import("./Field")` vs the actual
  `field.ts`). The rest of the app type-checks clean; the build won't go green
  until that import's casing is fixed.
- `components/v2/FilmMode.tsx` — modified outside this feature work.

---

## Verification
`npx tsc --noEmit` reports **zero errors outside `components/lab/`**. All features
above compile clean; the production build is blocked only by the `/lab` casing
issue noted in §5.
