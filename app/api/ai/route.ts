// ── /api/ai — Multi-Provider LLM Router ──────────────────────
// All LLM routing, API keys, and rate limiting live server-side only.
// Clients see: { content, thinking } — never the provider chain details.

import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, LLMProvider } from "@/lib/llm/providers";
import {
  isProviderHealthy,
  markChainExhausted,
  recordProviderFailure,
  recordProviderSuccess,
} from "@/lib/llm/rateLimit";
import { planProviders, noteSuccess, notePenalty, classifyIntentHeuristic } from "@/lib/llm/orchestrator";
import { getKeys, isKeyHealthy, recordKeyFailure, recordKeySuccess } from "@/lib/llm/keys";
import * as stats from "@/lib/llm/stats";
import { GATEWAY_ENDPOINT, gatewayEnabled } from "@/lib/llm/gateway";
import { buildSystemPrompt } from "@/lib/llm/systemPrompt";
import { ORCHESTRATOR_MODEL } from "@/config/orchestrator";
import { getClientIP } from "@/lib/clientIP";
import { rateLimit } from "@/lib/rateStore";
import { log, newReqId } from "@/lib/observability/log";
import { reportError } from "@/lib/observability/alert";

export const runtime = "nodejs"; // Required for in-memory Map state

interface ChatMessage {
  role: "user" | "assistant" | "agent";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  visitorType?: string | null;
  context?: string;
  /** When set, the visitor is drilling into ONE project — the server injects
      that project's breakdown into the system prompt for grounded answers.
      Only the id crosses the wire (never client-authored prompt text). */
  projectId?: string | null;
  /** NDJSON live-status mode: emits {"e":"attempt"} per provider try,
      then {"e":"content"} or {"e":"exhausted"}. The UI's reroute
      cinematics are driven by these REAL events — never fake theater. */
  stream?: boolean;
}

// ── Guardrails ─────────────────────────────────────────────────
// Layer 1 (here): cheap deterministic filters — injection patterns and
// size caps — rejected before a single LLM token is spent.
// Layer 2 (system prompt): intent detection + refusal instructions.

const MAX_MESSAGE_CHARS = 6000;   // JDs are long; abuse is longer
const MAX_TOTAL_CHARS   = 16000;

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any |your |the |previous |prior |above )*(instructions?|rules?|prompts?)/i,
  /(reveal|show|print|repeat|output|leak)\b.{0,40}\b(system prompt|instructions|rules|prompt above)/i,
  /you are (now|no longer)\b/i,
  /\b(jailbreak|DAN mode|developer mode)\b/i,
  /\bpretend (to be|you are)\b.{0,40}\b(not|different|another)\b/i,
  /\b(api[_ ]?key|env(ironment)? variable|\.env|secret key|credentials)\b/i,
  /act as (if )?(you|an?) (?!recruiter|hiring)/i,
];

// ── Response cache (protects tokens, latency, and rate limits) ──
// Identical conversations return the identical model answer without spending
// a token. Keyed on the FULL context + visitor type, so a follow-up like
// "tell me more" (different context) never collides with an earlier turn.
// In-memory + TTL'd: resets on cold start, which is fine — it only ever
// saves cost, never changes correctness.
const RESP_TTL_MS = 10 * 60 * 1000; // 10 min
const RESP_CACHE_MAX = 200;
const respCache = new Map<string, { content: string; at: number }>();

function respKey(visitorType: string | null | undefined, projectId: string | null | undefined, messages: ChatMessage[]): string {
  return `${visitorType ?? "none"}::${messages.map((m) => `${m.role}:${m.content.trim()}`).join("|")}`;
}
function respGet(key: string): string | null {
  const hit = respCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > RESP_TTL_MS) { respCache.delete(key); return null; }
  respCache.delete(key); respCache.set(key, hit); // bump recency
  return hit.content;
}
function respSet(key: string, content: string) {
  respCache.set(key, { content, at: Date.now() });
  if (respCache.size > RESP_CACHE_MAX) {
    const oldest = respCache.keys().next().value;
    if (oldest !== undefined) respCache.delete(oldest);
  }
}

function guardrailCheck(messages: ChatMessage[]): string | null {
  const last = messages[messages.length - 1]?.content ?? "";
  if (last.length > MAX_MESSAGE_CHARS) {
    return "That message is a bit long for me — could you trim it down? (Job descriptions are fine, novels aren't.)";
  }
  const total = messages.reduce((n, m) => n + m.content.length, 0);
  if (total > MAX_TOTAL_CHARS) {
    return "This conversation has grown long — hit Reset and ask me fresh, I'll keep all the facts.";
  }
  for (const p of INJECTION_PATTERNS) {
    if (p.test(last)) {
      return "Nice try 🙂 — I only talk about Sankalp's work, skills, and availability. Ask me about those, or paste a job description for a fit check.";
    }
  }
  return null;
}

// ── Provider callers ───────────────────────────────────────────

interface ProviderResult { content: string; tokens: number }

async function callOpenAICompat(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
  apiKey: string,
  viaGateway = false,
): Promise<ProviderResult> {
  // Gateway transport: same OpenAI-compatible shape, but the endpoint and model
  // id are the gateway's (the key is passed in by the caller). Direct transport
  // uses the provider's own endpoint/model. See lib/llm/gateway.ts.
  const endpoint = viaGateway ? GATEWAY_ENDPOINT : provider.endpoint;
  const model    = viaGateway ? (provider.gatewayModel ?? provider.model) : provider.model;

  if (!apiKey) throw new Error(`Missing env: ${viaGateway ? "AI_GATEWAY_API_KEY" : provider.apiKeyEnv}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };
  // OpenRouter's ranking headers only apply on the direct transport.
  if (!viaGateway && provider.id === "openrouter") {
    headers["HTTP-Referer"] = "https://sankalp-wanjari.vercel.app";
    headers["X-Title"]      = "SKW Portfolio OS";
  }

  const body = {
    model,
    messages:   [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role:    m.role === "agent" ? "assistant" : m.role,
        content: m.content,
      })),
    ],
    max_tokens:  provider.maxTokens,
    temperature: 0.7,
  };

  const res = await fetch(endpoint, {
    method:  "POST",
    headers,
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(provider.timeoutMs ?? 14_000),
  });

  if (!res.ok) {
    const err = new Error(`${provider.id}: HTTP ${res.status}`);
    (err as NodeJS.ErrnoException).code = String(res.status);
    throw err;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.id}: empty response`);
  return { content: content.trim(), tokens: Number(data?.usage?.total_tokens) || 0 };
}

async function callGemini(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<ProviderResult> {
  if (!apiKey) throw new Error(`Missing env: ${provider.apiKeyEnv}`);

  const contents = messages.map((m) => ({
    role:  m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      maxOutputTokens: provider.maxTokens,
      temperature:     0.7,
    },
  };

  const res = await fetch(provider.endpoint, {
    method:  "POST",
    // Key travels in a header, not the URL query string — query strings are
    // far more likely to be captured in proxy/access logs than headers.
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(provider.timeoutMs ?? 14_000),
  });

  if (!res.ok) {
    const err = new Error(`gemini: HTTP ${res.status}`);
    (err as NodeJS.ErrnoException).code = String(res.status);
    throw err;
  }

  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("gemini: empty response");
  return { content: content.trim(), tokens: Number(data?.usageMetadata?.totalTokenCount) || 0 };
}

async function callProvider(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
  reqId = "",
): Promise<ProviderResult> {
  // When the gateway is on and this provider has a gateway slug, route through
  // it (OpenAI-compatible) — even for Gemini, which the gateway fronts too. The
  // gateway uses a single key; no per-provider rotation there.
  if (gatewayEnabled() && provider.gatewayModel) {
    return callOpenAICompat(provider, systemPrompt, messages, process.env.AI_GATEWAY_API_KEY ?? "", true);
  }

  // Direct transport: rotate across the provider's configured keys (BASE, _2,
  // _3, _4). A quota'd (429) or bad (4xx) key rolls to the next key before the
  // provider itself is demoted — one busy account no longer takes the provider
  // out of the chain. A generic transient (timeout/5xx) won't be helped by
  // another key, so it rethrows immediately and the provider-level chain moves on.
  const keys = getKeys(provider.apiKeyEnv);
  if (keys.length === 0) throw new Error(`Missing env: ${provider.apiKeyEnv}`);

  let lastErr: unknown = new Error(`${provider.id}: all keys rate-limited`);
  (lastErr as NodeJS.ErrnoException).code = "429"; // if every key is cooled, treat as rate-limit
  let anyTried = false;

  for (let idx = 0; idx < keys.length; idx++) {
    if (!isKeyHealthy(provider.apiKeyEnv, idx)) {
      log.info({ event: "ai.key", route: "/api/ai", reqId, provider: provider.id, keyIndex: idx, keyCount: keys.length, outcome: "skipped_cooled" });
      continue;
    }
    anyTried = true;
    const t0 = Date.now();
    try {
      const result = provider.type === "gemini"
        ? await callGemini(provider, systemPrompt, messages, keys[idx])
        : await callOpenAICompat(provider, systemPrompt, messages, keys[idx]);
      recordKeySuccess(provider.apiKeyEnv, idx);
      log.info({ event: "ai.key", route: "/api/ai", reqId, provider: provider.id, keyIndex: idx, keyCount: keys.length, outcome: "ok", durationMs: Date.now() - t0 });
      return result;
    } catch (err) {
      lastErr = err;
      const status = Number((err as NodeJS.ErrnoException).code);
      const isRate = status === 429 || (err instanceof Error && err.message.includes("429"));
      const isConfig = status === 400 || status === 401 || status === 403 || status === 404;
      recordKeyFailure(provider.apiKeyEnv, idx, isConfig ? "config" : "transient");
      log.warn({
        event: "ai.key", route: "/api/ai", reqId, provider: provider.id, keyIndex: idx, keyCount: keys.length,
        outcome: isRate ? "rate_limited" : isConfig ? "config_error" : "transient_error",
        status: Number.isFinite(status) ? status : undefined,
        durationMs: Date.now() - t0, error: err instanceof Error ? err.message : String(err),
      });
      // Only rolling to the next key helps for a busy (429) or bad (4xx) key.
      if (isRate || isConfig) continue;
      throw err; // transient (timeout/5xx) — let the provider chain handle it
    }
  }
  // Either every key was already cooled (anyTried=false → the seeded 429), or
  // they all just failed with rate-limit/config — surface the last reason.
  void anyTried;
  throw lastErr;
}

// ── Streaming provider callers (phase 2: true token streaming) ──
// Same requests as the non-streaming callers, but with `stream:true` so tokens
// arrive as the model generates them. `onToken(delta)` fires per token; the full
// text is accumulated and returned (for the cache + the client's final state).

async function callOpenAICompatStream(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
  apiKey: string,
  onToken: (delta: string) => void,
  viaGateway = false,
): Promise<ProviderResult> {
  const endpoint = viaGateway ? GATEWAY_ENDPOINT : provider.endpoint;
  const model    = viaGateway ? (provider.gatewayModel ?? provider.model) : provider.model;
  if (!apiKey) throw new Error(`Missing env: ${viaGateway ? "AI_GATEWAY_API_KEY" : provider.apiKeyEnv}`);

  const headers: Record<string, string> = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
  if (!viaGateway && provider.id === "openrouter") {
    headers["HTTP-Referer"] = "https://sankalp-wanjari.vercel.app";
    headers["X-Title"]      = "SKW Portfolio OS";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role === "agent" ? "assistant" : m.role, content: m.content })),
      ],
      max_tokens: provider.maxTokens,
      temperature: 0.7,
      stream: true,
    }),
    signal: AbortSignal.timeout(provider.timeoutMs ?? 14_000),
  });

  if (!res.ok) {
    const err = new Error(`${provider.id}: HTTP ${res.status}`);
    (err as NodeJS.ErrnoException).code = String(res.status);
    throw err;
  }
  if (!res.body) throw new Error(`${provider.id}: no stream body`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let content = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") { buf = ""; break; }
      try {
        const j = JSON.parse(data);
        const delta = j?.choices?.[0]?.delta?.content;
        if (delta) { content += delta; onToken(delta); }
      } catch { /* keep-alive / partial line */ }
    }
  }
  if (!content) throw new Error(`${provider.id}: empty response`);
  return { content: content.trim(), tokens: 0 };
}

async function callGeminiStream(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
  apiKey: string,
  onToken: (delta: string) => void,
): Promise<ProviderResult> {
  if (!apiKey) throw new Error(`Missing env: ${provider.apiKeyEnv}`);
  // Swap the non-streaming method for the SSE streaming one.
  const endpoint =
    provider.endpoint.replace(":generateContent", ":streamGenerateContent") +
    (provider.endpoint.includes("?") ? "&" : "?") + "alt=sse";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: provider.maxTokens, temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(provider.timeoutMs ?? 14_000),
  });

  if (!res.ok) {
    const err = new Error(`gemini: HTTP ${res.status}`);
    (err as NodeJS.ErrnoException).code = String(res.status);
    throw err;
  }
  if (!res.body) throw new Error("gemini: no stream body");

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let content = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      try {
        const j = JSON.parse(data);
        const delta = j?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (delta) { content += delta; onToken(delta); }
      } catch { /* partial line */ }
    }
  }
  if (!content) throw new Error("gemini: empty response");
  return { content: content.trim(), tokens: 0 };
}

// Streaming key rotation (mirrors callProvider). Rotation only happens BEFORE the
// first token — once a key has streamed anything we're committed to it, so a
// mid-stream failure rethrows for the chain to end gracefully.
async function callProviderStream(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
  onToken: (delta: string) => void,
  reqId = "",
): Promise<ProviderResult> {
  if (gatewayEnabled() && provider.gatewayModel) {
    return callOpenAICompatStream(provider, systemPrompt, messages, process.env.AI_GATEWAY_API_KEY ?? "", onToken, true);
  }
  const keys = getKeys(provider.apiKeyEnv);
  if (keys.length === 0) throw new Error(`Missing env: ${provider.apiKeyEnv}`);

  let lastErr: unknown = new Error(`${provider.id}: all keys rate-limited`);
  (lastErr as NodeJS.ErrnoException).code = "429";

  for (let idx = 0; idx < keys.length; idx++) {
    if (!isKeyHealthy(provider.apiKeyEnv, idx)) {
      log.info({ event: "ai.key", route: "/api/ai", reqId, provider: provider.id, keyIndex: idx, keyCount: keys.length, outcome: "skipped_cooled", mode: "stream" });
      continue;
    }
    const t0 = Date.now();
    let keyEmitted = 0;
    const wrapped = (d: string) => { keyEmitted++; onToken(d); };
    try {
      const result = provider.type === "gemini"
        ? await callGeminiStream(provider, systemPrompt, messages, keys[idx], wrapped)
        : await callOpenAICompatStream(provider, systemPrompt, messages, keys[idx], wrapped);
      recordKeySuccess(provider.apiKeyEnv, idx);
      log.info({ event: "ai.key", route: "/api/ai", reqId, provider: provider.id, keyIndex: idx, keyCount: keys.length, outcome: "ok", durationMs: Date.now() - t0, mode: "stream" });
      return result;
    } catch (err) {
      lastErr = err;
      const status = Number((err as NodeJS.ErrnoException).code);
      const isRate = status === 429 || (err instanceof Error && err.message.includes("429"));
      const isConfig = status === 400 || status === 401 || status === 403 || status === 404;
      recordKeyFailure(provider.apiKeyEnv, idx, isConfig ? "config" : "transient");
      log.warn({
        event: "ai.key", route: "/api/ai", reqId, provider: provider.id, keyIndex: idx, keyCount: keys.length,
        outcome: isRate ? "rate_limited" : isConfig ? "config_error" : "transient_error",
        status: Number.isFinite(status) ? status : undefined, durationMs: Date.now() - t0, mode: "stream",
        error: err instanceof Error ? err.message : String(err),
      });
      if (keyEmitted > 0) throw err;       // already streamed — cannot rotate keys
      if (isRate || isConfig) continue;    // try the next key
      throw err;                            // transient before any token — let the chain move on
    }
  }
  throw lastErr;
}

// ── Available providers (have API keys set) ────────────────────

function getAvailableProviders(): LLMProvider[] {
  // Every provider requires a key now (no local/keyless providers) — a provider
  // is available iff it has at least one key (BASE / _2 / _3 / _4) configured.
  return PROVIDERS.filter((p) => getKeys(p.apiKeyEnv).length > 0);
}

// ── Optional small-model orchestrator (item 7) ─────────────────
// OFF unless ORCHESTRATOR_MODEL (config/orchestrator.ts, or the env override)
// names an available provider id (e.g. "groq"). When on, it makes ONE cheap,
// short-timeout call to a small/fast model to classify how much context the
// request needs; the deterministic heuristic in lib/llm/orchestrator is the
// fallback on any timeout/parse/error, so latency and robustness never regress.
// Default (null) → zero extra round-trips.
async function routeIntent(
  text: string,
  available: LLMProvider[],
  reqId = "",
): Promise<{ needsDetail: boolean } | null> {
  const id = ORCHESTRATOR_MODEL;
  if (!id || !text.trim()) return null;
  const provider = available.find((p) => p.id === id);
  if (!provider) {
    log.warn({ event: "ai.router", route: "/api/ai", reqId, outcome: "unavailable", model: id });
    return null;
  }
  const sys =
    "You are a router for a portfolio assistant. Reply with ONLY compact JSON " +
    '{"needsDetail":true|false} and nothing else. Set needsDetail true when ' +
    "answering needs Sankalp's detailed projects, experience, research, skills, " +
    "or a job-description fit check; false for greetings, thanks, or trivia.";
  const t0 = Date.now();
  stats.noteRouterCall();
  try {
    const res = await Promise.race([
      callProvider(provider, sys, [{ role: "user", content: text.slice(0, 500) }], reqId),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("router_timeout")), 2500)),
    ]);
    const m = res.content.match(/\{[\s\S]*?\}/);
    if (!m) {
      log.warn({ event: "ai.router", route: "/api/ai", reqId, outcome: "unparseable", model: id, durationMs: Date.now() - t0 });
      return null;
    }
    const parsed = JSON.parse(m[0]) as { needsDetail?: unknown };
    log.info({ event: "ai.router", route: "/api/ai", reqId, outcome: "ok", model: id, needsDetail: parsed.needsDetail === true, durationMs: Date.now() - t0 });
    return { needsDetail: parsed.needsDetail === true };
  } catch (err) {
    log.warn({ event: "ai.router", route: "/api/ai", reqId, outcome: "error", model: id, durationMs: Date.now() - t0, error: err instanceof Error ? err.message : String(err) });
    return null; // fall back to the deterministic heuristic
  }
}

// ── Main handler ───────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIP(req);
  const reqId = newReqId();

  // 1. IP rate limit (30 requests / hour) — durable across instances via
  //    Upstash when configured, in-memory fallback otherwise.
  if (!(await rateLimit(`ai:${ip}`, 30, 3_600_000))) {
    log.warn({ event: "ai.request", route: "/api/ai", reqId, outcome: "rate_limited", status: 429 });
    return NextResponse.json(
      // `exhausted` is the single flag the client keys its reserve-power
      // choreography off. Every outage shape below carries it, so a 429, a
      // 503, and an in-stream {"e":"exhausted"} all land in the same place.
      { error: "rate_limited", exhausted: true, message: "Too many requests. Try again in an hour." },
      { status: 429 },
    );
  }

  // 2. Parse body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { messages, visitorType, projectId } = body;
  if (!messages?.length) {
    return NextResponse.json({ error: "no_messages" }, { status: 400 });
  }

  // Log every incoming request up front — traceable end to end by reqId
  // (received → route → plan → per-key attempts → outcome).
  log.info({
    event: "ai.request", route: "/api/ai", reqId, phase: "received",
    msgCount: messages.length, visitorType: visitorType ?? null, projectId: projectId ?? null, stream: !!body.stream,
  });
  stats.noteRequest();

  // Keep the last 6 turns for context. The client already sends its recent
  // history; trimming here (down from 8) drops redundant older turns that add
  // tokens without improving the answer (item 7: data optimization).
  const contextMessages = messages.slice(-6) as ChatMessage[];

  // 2.5 Guardrails — deterministic filters run before any LLM call
  const blocked = guardrailCheck(contextMessages);
  if (blocked) {
    log.warn({ event: "ai.request", route: "/api/ai", reqId, outcome: "guarded" });
    return NextResponse.json({ content: blocked, ok: true, guarded: true });
  }

  // 3. Get available providers
  const available = getAvailableProviders();
  if (available.length === 0) {
    log.error({ event: "ai.request", route: "/api/ai", reqId, outcome: "no_providers", status: 503 });
    void reportError({
      event: "ai.no_providers", route: "/api/ai", reqId, status: 503,
      error: "No LLM providers are configured — every provider API key is missing from the environment.",
    });
    return NextResponse.json(
      { error: "no_providers", exhausted: true, message: "Model channel unavailable." },
      { status: 503 },
    );
  }

  // 3.5 Classify how much context this request needs (item 7). The zero-cost
  //     heuristic decides by default; an optional small-model router
  //     (ORCHESTRATOR_MODEL) can override it, falling back to the heuristic on
  //     any timeout/error. Greetings/small talk get a LEAN system prompt.
  const lastUser = [...contextMessages].reverse().find((m) => m.role === "user")?.content ?? "";
  // For STREAMING chat, latency to first token is king — so we skip the model
  // router (it's a full LLM round-trip BEFORE the answer can start) and use the
  // instant keyword heuristic. The model router still applies to non-stream
  // callers (nudges/tour) where a couple hundred ms doesn't matter.
  const routed = body.stream ? null : await routeIntent(lastUser, available, reqId);
  const needsDetail = routed?.needsDetail ?? classifyIntentHeuristic(lastUser).needsDetail;
  log.info({ event: "ai.route", route: "/api/ai", reqId, needsDetail, router: routed ? "model" : "heuristic", stream: !!body.stream });

  // System prompt — server-owned, never client-overridable. Lean vs full is
  // driven by the classification above.
  const systemPrompt = buildSystemPrompt(
    visitorType as Parameters<typeof buildSystemPrompt>[0],
    { detail: needsDetail, focusProjectId: typeof projectId === "string" ? projectId : null },
  );

  // 4.5 Response cache — a repeated conversation costs zero tokens.
  const cacheKey = respKey(visitorType, projectId, contextMessages);
  const cachedContent = respGet(cacheKey);

  // 5. Orchestrator plan — order the providers for THIS request. Small chat
  //    keeps the fast tier first; genuinely large input escalates to the
  //    big-context providers. A rate-limited/failed provider is already demoted
  //    to the back by the adaptive layer, so the chain never waits on it.
  const promptText = systemPrompt + "\n" + contextMessages.map((m) => m.content).join("\n");
  const plan = planProviders(available, promptText);
  log.info({
    event: "ai.plan", route: "/api/ai", reqId,
    estTokens: plan.estTokens, large: plan.large,
    order: plan.providers.map((p) => p.id).join(">"),
    transport: gatewayEnabled() ? "gateway" : "direct",
  });

  // Shared provider loop over the planned order. onAttempt fires before each
  // try — the streaming mode forwards these as live status events (no provider
  // names leak).
  async function runChain(
    onAttempt?: (attempt: number, total: number) => void,
  ): Promise<{ content: string } | { failed: string; realError: string | null }> {
    let lastError = "unknown";
    // Rate-limit exhaustion is EXPECTED reserve-power (not alert-worthy). A
    // config error (bad key/model) or a provider 5xx is a real break the owner
    // should hear about — we capture the worst such reason to alert on.
    let realError: string | null = null;
    let tried = 0;
    for (const provider of plan.providers) {
      if (!isProviderHealthy(provider.id)) continue;
      tried++;
      onAttempt?.(tried, plan.providers.length);
      stats.noteAttempt(provider.id); // count every provider hit (for /api/ai/stats)
      const t0 = Date.now();
      try {
        const { content, tokens } = await callProvider(provider, systemPrompt, contextMessages, reqId);
        recordProviderSuccess(provider.id);
        noteSuccess(provider.id); // adaptive: pin this working provider to the front
        stats.noteOk(provider.id);
        // Per-provider success span: latency + token cost, filterable by provider.
        log.info({
          event: "ai.provider", route: "/api/ai", reqId, provider: provider.id,
          outcome: "ok", attempt: tried, durationMs: Date.now() - t0, tokens,
        });
        return { content };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        const code = (err as NodeJS.ErrnoException).code;
        const status = Number(code);
        // 400/401/403/404 = wrong endpoint/key/model → sideline hard. Everything
        // else (429, 5xx, timeout, DNS) is transient → normal 3-strike cooldown.
        const kind: "config" | "transient" =
          status === 400 || status === 401 || status === 403 || status === 404
            ? "config"
            : "transient";
        recordProviderFailure(provider.id, kind);
        notePenalty(provider.id, kind); // adaptive: demote to the back of the queue now
        const isRateLimit = code === "429" || msg.includes("429");
        stats.noteFailure(provider.id, isRateLimit ? "rate" : kind === "config" ? "config" : "other");
        if (kind === "transient" && isRateLimit) {
          recordProviderFailure(provider.id); // extra penalty for rate limits
        }
        // Flag the alert-worthy failures: a misconfig (config kind) or a
        // provider 5xx. Rate-limits and plain timeouts are expected/noisy → skip.
        if (kind === "config" || (status >= 500 && status < 600)) {
          realError = `${provider.id}: ${msg}`;
        }
        // Every failed provider attempt is now visible — the reroute that used
        // to happen silently is one queryable log line per hop.
        log.warn({
          event: "ai.provider", route: "/api/ai", reqId, provider: provider.id,
          outcome: "failed", failureKind: kind, attempt: tried, durationMs: Date.now() - t0,
          status: Number.isFinite(status) ? status : undefined, error: msg,
        });
        continue;
      }
    }
    // Nothing answered — record it so /api/ai/health reports the outage
    // honestly instead of trusting per-provider strike counts.
    markChainExhausted(plan.providers.map((p) => p.id));
    return { failed: lastError, realError };
  }

  // 6a. Streaming mode — NDJSON with TRUE token streaming. Emits {e:"attempt"}
  // per provider try, {e:"token",t} per generated token (the typing effect),
  // and {e:"done",content} at the end. Falls back to the next provider only
  // BEFORE the first token; once a provider has streamed, we commit to it.
  if (body.stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        if (cachedContent !== null) {
          stats.noteCacheHit();
          log.info({ event: "ai.request", route: "/api/ai", reqId, outcome: "ok", mode: "stream", cached: true });
          // Deliver cached content as one token so the client's typing path still
          // works, then done.
          send({ e: "token", t: cachedContent });
          send({ e: "done", content: cachedContent, ok: true, cached: true });
          controller.close();
          return;
        }

        let emitted = 0;      // tokens sent to the client so far (across providers)
        let full = "";        // accumulated answer of the committed provider
        let lastError = "unknown";
        let realError: string | null = null;
        let tried = 0;

        for (const provider of plan.providers) {
          if (!isProviderHealthy(provider.id)) continue;
          tried++;
          stats.noteAttempt(provider.id);
          send({ e: "attempt", n: tried, total: plan.providers.length });
          const t0 = Date.now();
          const emittedBefore = emitted;
          try {
            const onToken = (d: string) => { emitted++; full += d; send({ e: "token", t: d }); };
            const { content } = await callProviderStream(provider, systemPrompt, contextMessages, onToken, reqId);
            recordProviderSuccess(provider.id);
            noteSuccess(provider.id);
            stats.noteOk(provider.id);
            respSet(cacheKey, content);
            log.info({ event: "ai.provider", route: "/api/ai", reqId, provider: provider.id, outcome: "ok", attempt: tried, durationMs: Date.now() - t0, mode: "stream" });
            log.info({ event: "ai.request", route: "/api/ai", reqId, outcome: "ok", mode: "stream" });
            send({ e: "done", content, ok: true });
            controller.close();
            return;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            lastError = msg;
            const code = (err as NodeJS.ErrnoException).code;
            const status = Number(code);
            const kind: "config" | "transient" =
              status === 400 || status === 401 || status === 403 || status === 404 ? "config" : "transient";
            recordProviderFailure(provider.id, kind);
            notePenalty(provider.id, kind);
            const isRateLimit = code === "429" || msg.includes("429");
            stats.noteFailure(provider.id, isRateLimit ? "rate" : kind === "config" ? "config" : "other");
            if (kind === "transient" && isRateLimit) recordProviderFailure(provider.id);
            if (kind === "config" || (status >= 500 && status < 600)) realError = `${provider.id}: ${msg}`;
            log.warn({
              event: "ai.provider", route: "/api/ai", reqId, provider: provider.id, outcome: "failed",
              failureKind: kind, attempt: tried, durationMs: Date.now() - t0, mode: "stream",
              status: Number.isFinite(status) ? status : undefined, error: msg,
            });
            // If this provider already streamed tokens, we can't cleanly switch —
            // end with what we have.
            if (emitted > emittedBefore) {
              log.warn({ event: "ai.request", route: "/api/ai", reqId, outcome: "midstream_cutoff", mode: "stream", provider: provider.id });
              send({ e: "done", content: full, ok: true, partial: true });
              controller.close();
              return;
            }
            continue; // nothing emitted yet → try the next provider
          }
        }

        // No provider produced anything.
        markChainExhausted(plan.providers.map((p) => p.id));
        log.error({ event: "ai.request", route: "/api/ai", reqId, outcome: "exhausted", mode: "stream", error: lastError });
        if (realError) void reportError({ event: "ai.exhausted", route: "/api/ai", reqId, status: 503, error: realError, context: { mode: "stream" } });
        send({ e: "exhausted" });
        controller.close();
      },
    });
    return new NextResponse(stream, {
      headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
    });
  }

  // 6b. Plain JSON mode (nudges, tour scripts)
  if (cachedContent !== null) {
    stats.noteCacheHit();
    log.info({ event: "ai.request", route: "/api/ai", reqId, outcome: "ok", mode: "json", cached: true });
    return NextResponse.json({ content: cachedContent, ok: true, cached: true });
  }
  const result = await runChain();
  if ("content" in result) {
    respSet(cacheKey, result.content);
    log.info({ event: "ai.request", route: "/api/ai", reqId, outcome: "ok", mode: "json" });
    return NextResponse.json({ content: result.content, ok: true });
  }
  // Never leak the provider chain / config details to the client (see header
  // contract above). The specific failure is logged server-side only.
  log.error({ event: "ai.request", route: "/api/ai", reqId, outcome: "exhausted", mode: "json", error: result.failed });
  if (result.realError) {
    void reportError({ event: "ai.exhausted", route: "/api/ai", reqId, status: 503, error: result.realError, context: { mode: "json" } });
  }
  return NextResponse.json(
    { error: "all_failed", exhausted: true, message: "Model channel unavailable." },
    { status: 503 },
  );
}
