# Sankalp Wanjari — Portfolio

An AI-engineering portfolio built as a small **product**, not a page. The written
content is fully server-rendered and instantly indexable; a progressive layer of
Three.js scenes and an AI concierge sits on top of it. Every heavy feature
degrades gracefully — nothing is a hard dependency, and the site never breaks,
it only ever becomes "less lifelike."

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
React Three Fiber / Three.js · Framer Motion · GSAP. Deployed on Vercel.

---

## Highlights

- **AI concierge ("Ember")** — a chat agent that answers questions about the work,
  runs an honest fit-check against a pasted job description, and can drive the page
  (scroll, open the knowledge graph, start a tour). Opens with **Ctrl / ⌘ + K**.
- **Systematic multi-provider LLM fallback** — an orchestrator plans and routes each
  request across Groq, Gemini, Mistral, OpenRouter, and NVIDIA, with adaptive
  self-reordering (a rate-limited provider is demoted instantly, never waited on)
  and a **reserve-power mode** when every provider is down. All server-side.
- **Live 3D** — a WebGL hero field, a skill constellation, and a full
  knowledge-graph view of the portfolio, all mounted client-side so they never
  block first paint.
- **Real voice** — Ember can speak via ElevenLabs TTS, with automatic fallback to
  the browser's Web Speech voice.
- **Working forms** — contact and feedback post to a server route (Resend); if the
  key is absent or the send fails, the user gets an honest error and a pre-filled
  `mailto:` — never a fake "sent."
- **Performance governor & mobile tuning** — the experience scales to the device
  (WebGL, blur, animation budget) and self-throttles under memory pressure.
- **Full observability** — structured server logs (Vercel Runtime Logs) plus
  client telemetry (Vercel Web Analytics + Speed Insights), and optional routing
  through the **Vercel AI Gateway** for unified LLM cost/latency dashboards.

---

## Architecture at a glance

```
app/
  layout.tsx            Root metadata, JSON-LD, fonts, Analytics/SpeedInsights
  page.tsx              Mounts the v2 Landing experience
  robots.ts, sitemap.ts SEO endpoints (driven by config)
  opengraph-image.tsx   Generated OG image
  api/
    ai/route.ts         Multi-provider LLM router (orchestrator + failover)
    ai/health/route.ts  Zero-cost "are the models back?" probe
    voice/route.ts      ElevenLabs TTS proxy (+ server-side audio cache)
    contact, feedback   Resend delivery (+ per-IP rate limits, honeypot)
components/v2/          The whole experience — Landing.tsx is the composition root
config/portfolio.ts     SINGLE SOURCE OF TRUTH for all content/facts
lib/
  llm/                  providers, orchestrator, gateway, rateLimit, systemPrompt
  perf.ts               Device-tier governor + heap monitor
  log.ts                Client telemetry (+ Vercel Analytics custom events)
  safeStorage.ts        Never-throwing storage (Brave/private-mode safe)
  observability/log.ts  Structured server logging
  voice.ts, staticBrain.ts, behavior.ts, rateStore.ts, cinema/…
contexts/               Concierge, Theme, Narration providers
```

**Design rule:** every fact (availability, notice period, location, links) has
exactly one field in `config/portfolio.ts`. The UI, the AI system prompt, robots,
sitemap, and OG metadata all derive from it — nothing is restated elsewhere.

### The AI concierge in detail

1. **Guardrails** — deterministic size caps + prompt-injection filters run before
   a single token is spent.
2. **Orchestrator** ([lib/llm/orchestrator.ts](lib/llm/orchestrator.ts)) — a cheap
   heuristic (no extra LLM call) picks the provider order for the request. Short
   chat starts on the fast tier (Groq); genuinely large input (≈24k+ tokens)
   escalates to the big-context providers (NVIDIA's 1M window, then Gemini).
3. **Adaptive failover** — on success a provider is pinned to the front; on a
   rate-limit/error it's demoted to the back immediately (short window for
   transient errors, long for config errors) so the chain never stalls waiting
   for a busy provider. Health cooldowns live in [lib/llm/rateLimit.ts](lib/llm/rateLimit.ts).
4. **Reserve power** — when every provider is exhausted, the dock switches to a
   deterministic command deck and answers from verified facts
   ([lib/staticBrain.ts](lib/staticBrain.ts)) with a live retry countdown. It
   never dies.
5. **Optional Vercel AI Gateway** ([lib/llm/gateway.ts](lib/llm/gateway.ts)) —
   set `AI_GATEWAY_API_KEY` and provider calls route through the gateway for one
   unified cost/latency/error dashboard, **keeping this app's own orchestrator and
   failover**. Unset = calls go direct; behaviour is identical.

---

## Getting started

```bash
npm ci            # exact install from the lockfile
npm run dev       # http://localhost:3000
```

The site runs with **zero** API keys — the concierge simply starts in reserve /
static mode and every other feature degrades gracefully. Add keys to unlock the
full experience.

### Environment variables

Create `.env.local` (never commit it). All are optional; each has a graceful
fallback.

| Variable | Powers | If missing |
|---|---|---|
| `GROQ_API_KEY` | AI concierge (fastest provider) | Falls through to the next provider |
| `GEMINI_API_KEY` | AI concierge / large-context fallback | Falls through |
| `MISTRAL_API_KEY` | AI concierge fallback | Falls through |
| `OPENROUTER_API_KEY` | AI concierge fallback | Falls through |
| `NVIDIA_API_KEY` | Large-context tasks (1M window) | Large prompts fall back to Gemini |
| `AI_GATEWAY_API_KEY` | Route LLM calls via Vercel AI Gateway (observability) | Calls go direct — no change in behaviour |
| `LLM_RATE_LIMIT` | Requests / IP / hour (default 30) | Uses default |
| `ELEVENLABS_API_KEY` | Ember's lifelike voice | Falls back to the browser voice |
| `ELEVENLABS_VOICE_ID` | Which premade voice | Uses the built-in default voice |
| `RESEND_API_KEY` | Contact form, feedback, chat leads | Forms return an honest error + `mailto:` fallback |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Cross-instance rate limiting | Per-instance in-memory limiter |

> **At least one LLM key** is recommended — without any, the concierge runs in
> static mode (still answers from verified facts + slash commands, never crashes).
> After changing any variable on Vercel, **redeploy** (env isn't hot-swapped).

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (needs network for `next/font`) |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check — run before every hand-off |

---

## Editing content

All content lives in [config/portfolio.ts](config/portfolio.ts). Update that file
only — never hard-code data in components. See
[docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md) for the field-by-field guide.
Editing it can't break the knowledge graph — links to non-existent nodes are
skipped.

## Deployment

Vercel (zero-config for Next.js). Full step-by-step, env setup, and a post-deploy
smoke test are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Set the Node version to
**20.x or 22.x** to match local.

## Accessibility & performance

- Skip-to-content link, keyboard-operable concierge, focus states, ARIA live
  regions on streaming/status.
- `prefers-reduced-motion` calms decorative motion (it does **not** swap the 3D
  build or perf tier — that separation is deliberate so a device on Low Power Mode
  isn't silently given a different site).
- Text is server-rendered and paints instantly; 3D and AI are progressive layers.
- Security headers (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, etc.)
  are set in [next.config.ts](next.config.ts); the browser never talks to
  LLM/Resend/ElevenLabs directly — everything is proxied through this app's own
  API routes.

## Conventions

Contributor guidelines (structure, style, commit/PR norms) are in
[AGENTS.md](AGENTS.md).
