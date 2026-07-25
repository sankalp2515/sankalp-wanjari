# Deployment guide

A Next.js 16 app. The recommended host is **Vercel** (zero-config for Next). These steps get you to a stable, non-laggy production site.

---

## 1. Pre-flight (run locally first)

```bash
npm ci                 # clean, lockfile-exact install
npx tsc --noEmit       # type safety — must be clean
npm run build          # production build — must succeed
npm start              # smoke-test the production build on http://localhost:3000
```

If `npm run build` fails, **do not deploy** — fix it first. A broken build is the #1 cause of a bad launch.

---

## 2. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production + Preview). None are committed to git.

| Variable | Needed for | If missing |
|---|---|---|
| `GROQ_API_KEY` | AI concierge (fastest provider) | Falls through to next provider |
| `GEMINI_API_KEY` | AI concierge fallback | Falls through |
| `OPENROUTER_API_KEY` | AI concierge fallback | Falls through |
| *(optional)* `DEEPSEEK_API_KEY`, `KIMI_API_KEY` | More fallback providers | Skipped |
| `RESEND_API_KEY` | **Contact form, feedback, chat leads** | Forms return a clear error → user gets a `mailto:` fallback. Nothing silently lost. |
| `ELEVENLABS_API_KEY` | Ember's lifelike voice | Falls back to the browser voice automatically |
| `ELEVENLABS_VOICE_ID` | Which voice (use a **premade** id — free tier blocks library voices) | Uses the built-in default premade voice |
| *(optional)* `LLM_RATE_LIMIT` | Requests/IP/hour (default 30) | Uses default |

**At least one LLM key** is strongly recommended — without any, the concierge runs in "static mode" (still answers from verified facts + slash commands, never crashes).

After adding/changing any variable, **redeploy** (Vercel doesn't hot-swap env into a running deployment).

---

## 3. Deploy

- Push to your GitHub repo's main branch → Vercel auto-builds and deploys, **or**
- `npm i -g vercel && vercel --prod` from the project root.

Set the Node version to **20.x or 22.x** (Vercel → Settings → Node.js Version) to match local.

---

## 4. Why it won't lag or break (and the edges that were handled)

**Performance**
- All text/content is **server-rendered** — it paints instantly and is fully indexable; the AI + 3D are a progressive layer on top.
- The Three.js scenes (hero field, skill constellation, knowledge graph) only mount **client-side**, and heavy ones are `dynamic(..., { ssr: false })` so they never block first paint.
- Voice audio is **cached server-side** — repeated lines (the tour) cost zero ElevenLabs credits and return instantly on a cache hit.
- `prefers-reduced-motion` disables the animations and the constellation for users who ask for calm (and for low-power devices honoring it).

**Graceful degradation — nothing is a hard dependency**
- All LLM providers rate-limited → concierge switches to **static mode** (verified facts + `/commands`), announced cinematically, never a dead chat.
- Rate limit on one provider → automatically **fails over** to the next available one.
- No `RESEND_API_KEY` in production → forms return an honest error and offer a pre-filled `mailto:` (never a fake "sent").
- No/blocked ElevenLabs → **browser voice**, in sync with the text.
- Editing `config/portfolio.ts` can't break the graph — links to non-existent nodes are skipped.

**Known operational notes**
- API routes use **in-memory** rate-limit counters and the voice cache. On serverless these are **per-instance and reset on cold start** — perfectly fine for a portfolio (limits are a courtesy, not security-critical). If you ever need global limits, move them to Upstash/Redis.
- A **hidden/background tab pauses `requestAnimationFrame`**, so WebGL animations freeze until refocus — expected browser behavior, not a bug. Don't diagnose "frozen 3D" from a backgrounded window.
- Mobile: 3D is lighter and pointer-tilt is disabled; verify on a real device once after launch.

---

## 5. Post-deploy smoke test (2 minutes)

1. Open the production URL — hero paints immediately, no layout shift.
2. Open the concierge (Ctrl/⌘+K), ask one question — you get a real answer.
3. Enable Ember's voice → hear the ElevenLabs voice (confirm `GET /api/voice` returns `{"configured":true}`).
4. Submit the contact form and the feedback widget → check the email arrives.
5. Run the tour once; open the knowledge graph; open a project's GitHub/Live link.
6. Toggle the theme (light/dark) and re-scan the hero + contact sections.
7. Load once on a phone.

If all seven pass, you're shippable.
