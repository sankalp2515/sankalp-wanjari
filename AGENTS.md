# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router portfolio built with TypeScript, Tailwind, Framer Motion, and React Three Fiber. Route entry points live in `app/`; API handlers are in `app/api/`. The main experience is assembled in `components/v2/Landing.tsx`, with section components such as `Hero.tsx`, `ProjectsSection.tsx`, and `SkillsSection.tsx` alongside reusable motion and visual primitives.

Keep portfolio content in `config/portfolio.ts`, shared types in `types/`, context providers in `contexts/`, and non-UI helpers in `lib/` or `hooks/`. Static images and downloadable files belong in `public/`.

## Build, Test, and Development Commands

- `npm run dev` — start the local Next.js development server.
- `npm run build` — create a production build; it may require network access for `next/font` Google fonts.
- `npm run start` — serve an existing production build.
- `npm run lint` — run ESLint across the project.
- `npx tsc --noEmit` — type-check without writing output; run this before handing off changes.

## Coding Style & Naming Conventions

Use TypeScript and functional React components. Follow the existing two-space indentation, double quotes, and semicolon style. Name components in PascalCase (`ProofCore.tsx`), hooks with `use` (`useMediaQuery.ts`), and utilities in camelCase. Prefer path aliases such as `@/config/portfolio` over long relative imports.

Use inline CSS variables for dynamic theme values and place reusable visual rules in `app/globals.css`. Respect `prefers-reduced-motion` whenever adding animation, WebGL, or scroll effects.

## Testing Guidelines

There is no automated unit-test suite yet. At minimum, run `npx tsc --noEmit`, `npm run lint`, and manually verify desktop, mobile, reduced-motion, theme, AI concierge, and keyboard interactions. Include screenshots or a short recording for visual or motion-heavy changes.

## Commit & Pull Request Guidelines

Recent commits use short, plain-language summaries (for example, `added contact api` and `stable version`). Keep subjects imperative and specific: `add proof-core interaction`.

PRs should explain the user-facing change, list verification commands, link relevant issues, and include visual evidence for UI work. Do not commit `.env.local`, API keys, or provider secrets.
