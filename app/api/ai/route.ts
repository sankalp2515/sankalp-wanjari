// ── /api/ai — Multi-Provider LLM Router ──────────────────────
// All LLM routing, API keys, and rate limiting live server-side only.
// Clients see: { content, thinking } — never the provider chain details.

import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, LLMProvider } from "@/lib/llm/providers";
import {
  hashIPToProviderIndex,
  isProviderHealthy,
  markChainExhausted,
  recordProviderFailure,
  recordProviderSuccess,
} from "@/lib/llm/rateLimit";
import { buildSystemPrompt } from "@/lib/llm/systemPrompt";
import { getClientIP } from "@/lib/clientIP";
import { rateLimit } from "@/lib/rateStore";
import { log, newReqId } from "@/lib/observability/log";

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
): Promise<ProviderResult> {
  const apiKey = provider.apiKeyEnv ? (process.env[provider.apiKeyEnv] ?? "") : "";

  if (provider.apiKeyEnv && !apiKey) throw new Error(`Missing env: ${provider.apiKeyEnv}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  if (provider.id === "openrouter") {
    headers["HTTP-Referer"] = "https://sankalpwanjari.dev";
    headers["X-Title"]      = "SKW Portfolio OS";
  }

  const body = {
    model:      provider.model,
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

  const res = await fetch(provider.endpoint, {
    method:  "POST",
    headers,
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(14_000),
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
    signal:  AbortSignal.timeout(14_000),
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
  if (provider.type === "gemini") {
    return callGemini(provider, systemPrompt, messages);
  }
  return callOpenAICompat(provider, systemPrompt, messages);
}

// ── Available providers (have API keys set) ────────────────────

function getAvailableProviders(): LLMProvider[] {
  return PROVIDERS.filter((p) => {
    if (!p.apiKeyEnv) return true; // Ollama needs no key
    return !!process.env[p.apiKeyEnv];
  });
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
    return NextResponse.json(
      { error: "no_providers", exhausted: true, message: "Model channel unavailable." },
      { status: 503 },
    );
  }

  // 4.5 Response cache — a repeated conversation costs zero tokens.
  const cacheKey = respKey(visitorType, contextMessages);
  const cachedContent = respGet(cacheKey);

  // 5. IP-hash starting index (session affinity — same IP, same starting provider)
  const startIdx = hashIPToProviderIndex(ip, available.length);

  // Shared provider loop. onAttempt fires before each try — the streaming
  // mode forwards these as live status events (no provider names leak).
  async function runChain(
    onAttempt?: (attempt: number, total: number) => void,
  ): Promise<{ content: string } | { failed: string }> {
    let lastError = "unknown";
    let tried = 0;
    for (let attempt = 0; attempt < available.length; attempt++) {
      const idx      = (startIdx + attempt) % available.length;
      const provider = available[idx];
      if (!isProviderHealthy(provider.id)) continue;
      tried++;
      onAttempt?.(tried, available.length);
      const t0 = Date.now();
      try {
        const { content, tokens } = await callProvider(provider, systemPrompt, contextMessages);
        recordProviderSuccess(provider.id);
        // Per-provider success span: latency + token cost, filterable by provider.
        log.info({
          event: "ai.provider", route: "/api/ai", reqId, provider: provider.id,
          outcome: "ok", attempt: tried, durationMs: Date.now() - t0, tokens,
        });
        return { content };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        recordProviderFailure(provider.id);
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "429" || msg.includes("429")) {
          recordProviderFailure(provider.id); // extra penalty
        }
        // Every failed provider attempt is now visible — the reroute that used
        // to happen silently is one queryable log line per hop.
        log.warn({
          event: "ai.provider", route: "/api/ai", reqId, provider: provider.id,
          outcome: "failed", attempt: tried, durationMs: Date.now() - t0,
          status: code ? Number(code) || undefined : undefined, error: msg,
        });
        continue;
      }
    }
    // Nothing answered — record it so /api/ai/health reports the outage
    // honestly instead of trusting per-provider strike counts.
    markChainExhausted(available.map((p) => p.id));
    return { failed: lastError };
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
  return NextResponse.json(
    { error: "all_failed", exhausted: true, message: "Model channel unavailable." },
    { status: 503 },
  );
}
