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
import { planProviders, noteSuccess, notePenalty } from "@/lib/llm/orchestrator";
import { GATEWAY_ENDPOINT, gatewayEnabled } from "@/lib/llm/gateway";
import { buildSystemPrompt } from "@/lib/llm/systemPrompt";
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

function respKey(visitorType: string | null | undefined, messages: ChatMessage[]): string {
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
  viaGateway = false,
): Promise<ProviderResult> {
  // Gateway transport: same OpenAI-compatible shape, but the endpoint, model
  // id, and auth key are the gateway's. Direct transport uses the provider's
  // own endpoint/model/key. See lib/llm/gateway.ts.
  const endpoint = viaGateway ? GATEWAY_ENDPOINT : provider.endpoint;
  const model    = viaGateway ? (provider.gatewayModel ?? provider.model) : provider.model;
  const apiKey   = viaGateway
    ? (process.env.AI_GATEWAY_API_KEY ?? "")
    : (process.env[provider.apiKeyEnv] ?? "");

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
): Promise<ProviderResult> {
  const apiKey = process.env[provider.apiKeyEnv];
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
): Promise<ProviderResult> {
  // When the gateway is on and this provider has a gateway slug, route through
  // it (OpenAI-compatible) — even for Gemini, which the gateway fronts too.
  if (gatewayEnabled() && provider.gatewayModel) {
    return callOpenAICompat(provider, systemPrompt, messages, true);
  }
  if (provider.type === "gemini") {
    return callGemini(provider, systemPrompt, messages);
  }
  return callOpenAICompat(provider, systemPrompt, messages);
}

// ── Available providers (have API keys set) ────────────────────

function getAvailableProviders(): LLMProvider[] {
  // Every provider requires a key now (no local/keyless providers) — a provider
  // is available iff its key is set in the environment.
  return PROVIDERS.filter((p) => !!process.env[p.apiKeyEnv]);
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

  const { messages, visitorType } = body;
  if (!messages?.length) {
    return NextResponse.json({ error: "no_messages" }, { status: 400 });
  }

  // Keep last 8 messages for context (avoids token overflow)
  const contextMessages = messages.slice(-8) as ChatMessage[];

  // 2.5 Guardrails — deterministic filters run before any LLM call
  const blocked = guardrailCheck(contextMessages);
  if (blocked) {
    log.warn({ event: "ai.request", route: "/api/ai", reqId, outcome: "guarded" });
    return NextResponse.json({ content: blocked, ok: true, guarded: true });
  }

  // 3. System prompt — server-owned, never client-overridable
  const systemPrompt = buildSystemPrompt(visitorType as Parameters<typeof buildSystemPrompt>[0]);

  // 4. Get available providers
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

  // 4.5 Response cache — a repeated conversation costs zero tokens.
  const cacheKey = respKey(visitorType, contextMessages);
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
      const t0 = Date.now();
      try {
        const { content, tokens } = await callProvider(provider, systemPrompt, contextMessages);
        recordProviderSuccess(provider.id);
        noteSuccess(provider.id); // adaptive: pin this working provider to the front
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

  // 6a. Streaming mode — NDJSON live status
  if (body.stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        if (cachedContent !== null) {
          log.info({ event: "ai.request", route: "/api/ai", reqId, outcome: "ok", mode: "stream", cached: true });
          send({ e: "content", content: cachedContent, ok: true, cached: true });
          controller.close();
          return;
        }
        const result = await runChain((attempt, total) => send({ e: "attempt", n: attempt, total }));
        if ("content" in result) {
          respSet(cacheKey, result.content);
          log.info({ event: "ai.request", route: "/api/ai", reqId, outcome: "ok", mode: "stream" });
          send({ e: "content", content: result.content, ok: true });
        } else {
          // Streaming exhaustion used to close silently — HTTP 200, no log — so
          // a reserve-mode fallback left NO server-side trace. Now it's one
          // queryable line, identical in shape to the non-streaming path.
          log.error({ event: "ai.request", route: "/api/ai", reqId, outcome: "exhausted", mode: "stream", error: result.failed });
          if (result.realError) {
            void reportError({ event: "ai.exhausted", route: "/api/ai", reqId, status: 503, error: result.realError, context: { mode: "stream" } });
          }
          send({ e: "exhausted" });
        }
        controller.close();
      },
    });
    return new NextResponse(stream, {
      headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
    });
  }

  // 6b. Plain JSON mode (nudges, tour scripts)
  if (cachedContent !== null) {
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
