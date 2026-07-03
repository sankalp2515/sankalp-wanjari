// ── /api/ai — Multi-Provider LLM Router ──────────────────────
// All LLM routing, API keys, and rate limiting live server-side only.
// Clients see: { content, thinking } — never the provider chain details.

import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, LLMProvider } from "@/lib/llm/providers";
import {
  checkIPAllowed,
  hashIPToProviderIndex,
  isProviderHealthy,
  recordProviderFailure,
  recordProviderSuccess,
} from "@/lib/llm/rateLimit";
import { buildSystemPrompt } from "@/lib/llm/systemPrompt";

export const runtime = "nodejs"; // Required for in-memory Map state

interface ChatMessage {
  role: "user" | "assistant" | "agent";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  visitorType?: string | null;
  context?: string;
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

async function callOpenAICompat(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
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
  return content.trim();
}

async function callGemini(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) throw new Error(`Missing env: ${provider.apiKeyEnv}`);

  const url = `${provider.endpoint}?key=${apiKey}`;

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

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
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
  return content.trim();
}

async function callProvider(
  provider: LLMProvider,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
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

// ── IP extraction ──────────────────────────────────────────────

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

// ── Main handler ───────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getIP(req);

  // 1. IP rate limit
  if (!checkIPAllowed(ip)) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests. Try again in an hour." },
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
    return NextResponse.json({ content: blocked, ok: true, guarded: true });
  }

  // 3. System prompt — server-owned, never client-overridable
  const systemPrompt = buildSystemPrompt(visitorType as Parameters<typeof buildSystemPrompt>[0]);

  // 4. Get available providers
  const available = getAvailableProviders();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "no_providers", message: "No LLM API keys configured. Add keys to .env.local." },
      { status: 503 },
    );
  }

  // 5. IP-hash starting index (session affinity — same IP, same starting provider)
  const startIdx = hashIPToProviderIndex(ip, available.length);

  // 6. Iterate providers with fallback
  let lastError: string = "unknown";

  for (let attempt = 0; attempt < available.length; attempt++) {
    const idx      = (startIdx + attempt) % available.length;
    const provider = available[idx];

    // Skip if provider is in cooldown
    if (!isProviderHealthy(provider.id)) {
      continue;
    }

    try {
      const content = await callProvider(provider, systemPrompt, contextMessages);

      // Record success
      recordProviderSuccess(provider.id);

      // Return response (no provider internals exposed to client)
      return NextResponse.json({
        content,
        // Minimal hint for UI — just "thinking done", no model names
        ok: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg;

      // Record failure (may trigger cooldown)
      recordProviderFailure(provider.id);

      // Rate limit from upstream: skip this provider for this attempt
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "429" || msg.includes("429")) {
        recordProviderFailure(provider.id); // extra penalty
      }

      // Continue to next provider
      continue;
    }
  }

  // All providers failed
  return NextResponse.json(
    { error: "all_failed", message: `All providers exhausted: ${lastError}` },
    { status: 503 },
  );
}
