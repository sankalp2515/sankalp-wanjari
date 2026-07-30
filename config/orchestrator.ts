// ─────────────────────────────────────────────────────────────────────────
//  SMALL-MODEL ORCHESTRATOR — MODEL SELECTOR
// ─────────────────────────────────────────────────────────────────────────
//
//  Before answering a chat message, the server can make ONE cheap call to a
//  small/fast model that classifies how much context the request needs (see
//  routeIntent in app/api/ai/route.ts). Its result decides whether the LLM gets
//  the LEAN system prompt (greetings/small talk) or the FULL one (real
//  questions) — saving tokens and latency. If that call times out or errors, a
//  zero-cost keyword heuristic takes over, so answers never regress.
//
//  ┌─ TO CHANGE THE ORCHESTRATOR MODEL ────────────────────────────────────┐
//  │  Edit CONFIGURED below to a provider id from lib/llm/providers.ts:     │
//  │    "groq"      — fastest (Llama 3.3 70B on Groq)                       │
//  │    "mistral"   — smallest model (mistral-small-latest)                 │
//  │    "gemini"    — Gemini 3.6 Flash                                      │
//  │    null        — DISABLE the router (heuristic only, zero extra calls) │
//  │  Save. Done — no rebuild of logic needed.                             │
//  └───────────────────────────────────────────────────────────────────────┘
//
//  The ORCHESTRATOR_MODEL env var, when set, OVERRIDES this constant — so a
//  deploy can flip it without a code change. When the env var is absent, this
//  file is the single source of truth. The chosen provider still needs its API
//  key configured, or the router silently falls back to the heuristic.

// ← Edit this line to enable/change the router. null = disabled (heuristic only).
const CONFIGURED: string | null = "groq";

export const ORCHESTRATOR_MODEL: string | null =
  process.env.ORCHESTRATOR_MODEL ?? CONFIGURED;
