# Project content update — 28 October 2026

Portfolio content lives in `config/portfolio.ts`. The active grid and technical
breakdown are `components/v2/ProjectsSection.tsx` and `ProjectModal.tsx`.
Existing project IDs 001–006 remain unchanged; 007–009 are listed first.

## Sources reviewed

- IntentSeal: https://github.com/sankalp2515/intentseal — README, action guard
  (`packages/core/intentseal_core/action_guard.py`), repository tree. Published
  detection and assurance results are internal evaluations, not safety guarantees.
- Abide: https://github.com/sankalp2515/Abide — README, deterministic delegation
  gate (`packages/core/intentseal_core/delegate/gate.py`), repository tree.
  Distinguish the employee-facing delegation product from IntentSeal's firewall.
- CaseProof: https://github.com/sankalp2515/CaseProof-justified-first-response-for-analyst
  — README, `docs/ARCHITECTURE.md`, repository tree. A synthetic staging
  prototype, not a production bank integration. The 51 browser checks are
  repository-reported results, not tests rerun during this portfolio update.
- Buy or Wait?: https://github.com/sankalp2515/buy-or-wait — README,
  `code/main.py`, repository tree. Rank supplied by Sankalp and corroborated by
  the repository: 7th of 3,062, HackerRank Orchestrate, September 2026.
  Competition submission kept under Achievements, not the project catalogue.

## Card images

Unmodified repository screenshots copied locally to avoid runtime dependence
on GitHub image hosting:

- `public/projects/intentseal/poster.webp` ← `docs/media/console-overview.webp`
- `public/projects/abide/poster.png` ← `docs/snapshots/2-stopped-traced.png`
- `public/projects/caseproof/poster.png` ← `docs/media/analyst-layout/trail-fullscreen-1242.png`

Demo/tour links are sourced from each README. Listing them does not establish
current uptime. No backend repository tests or cloud deployment were run.

## Portfolio verification

- `npx tsc --noEmit` and `npm run build`: passed.
- Catalogue checks: nine unique IDs, new poster files, complete breakdowns,
  repository URLs and online/offline project and achievement facts passed.
- Browser: new overview → breakdown → back/close flows, mobile CaseProof,
  achievement layout at 1440px and 390px, reduced-motion interactions and
  inclusion in both experience variants passed. Screenshots and the browser
  check are under `output/playwright/`.
- `npm run lint`: existing baseline has 22 errors and 18 warnings. Comparing
  touched files with HEAD found no newly introduced rule violations.
- Existing development-console issues observed: analytics scripts blocked by
  CSP; switching to a fresh reduced-motion page can produce animation-style
  hydration warnings in the existing reveal/film components. These were not
  broadened into unrelated fixes during the project-content update.
- No commit, staging, push or deployment performed.
