// ── LLM Provider Registry ────────────────────────────────────
// Add/remove providers here. Only providers with env keys set are ever used
// (see getAvailableProviders in the route). The ORDER here is only a static
// default — the orchestrator (lib/llm/orchestrator.ts) reorders per request by
// task size and live success/failure, so a rate-limited provider drops to the
// back automatically without the chain waiting on it.

export type ProviderType = "openai-compat" | "gemini";

// role drives task routing:
//   fast     — lowest latency, best for short everyday Q&A (tried first).
//   balanced — solid quality, mid latency; general fallback.
//   large    — big-context / heavy model; only escalated to when the input is
//              genuinely large, so it never slows down normal chat.
export type ProviderRole = "fast" | "balanced" | "large";

export interface LLMProvider {
  id:            string;
  name:          string;
  endpoint:      string;
  model:         string;
  apiKeyEnv:     string;   // env var holding the key (required — no keyless providers)
  maxTokens:     number;   // max OUTPUT tokens
  type:          ProviderType;
  contextWindow: number;   // max INPUT tokens the model can hold — used to route large prompts
  role:          ProviderRole;
  timeoutMs?:    number;   // per-provider request timeout (default 14s)
  // Vercel AI Gateway model id (`creator/model`). When AI_GATEWAY_API_KEY is
  // set AND this is present, calls route through the gateway for unified
  // observability (see lib/llm/gateway.ts). Omit to always call this provider
  // directly. Confirm exact slugs in your Vercel AI Gateway dashboard.
  gatewayModel?: string;
}

export const PROVIDERS: LLMProvider[] = [
  // 1. Groq — fastest by far, generous free tier. The default first hop for
  //    normal short questions.
  {
    id:            "groq",
    name:          "Groq",
    endpoint:      "https://api.groq.com/openai/v1/chat/completions",
    model:         "llama-3.3-70b-versatile",
    apiKeyEnv:     "GROQ_API_KEY",
    maxTokens:     1024,
    type:          "openai-compat",
    contextWindow: 128_000,
    role:          "fast",
    gatewayModel:  "groq/llama-3.3-70b-versatile",
  },
  // 2. Google Gemini — 1M context, fast flash model. Doubles as a large-context
  //    fallback behind NVIDIA.
  {
    id:            "gemini",
    name:          "Gemini",
    endpoint:      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    model:         "gemini-2.5-flash",
    apiKeyEnv:     "GEMINI_API_KEY",
    maxTokens:     1024,
    type:          "gemini",
    contextWindow: 1_000_000,
    role:          "balanced",
    gatewayModel:  "google/gemini-2.5-flash",
  },
  // 3. Mistral — standard OpenAI-compatible endpoint (NOT the beta conversations
  //    API / labs model, deliberately — dependency-free and stable).
  {
    id:            "mistral",
    name:          "Mistral",
    endpoint:      "https://api.mistral.ai/v1/chat/completions",
    model:         "mistral-small-latest",
    apiKeyEnv:     "MISTRAL_API_KEY",
    maxTokens:     1024,
    type:          "openai-compat",
    contextWindow: 128_000,
    role:          "balanced",
    gatewayModel:  "mistral/mistral-small-latest",
  },
  // 4. OpenRouter — free chat model.
  //    NOTE: the previous slug (`nvidia/nemotron-3.5-content-safety:free`) was a
  //    content-SAFETY classifier, not a chat model — it could not answer. Swapped
  //    to a real free instruct model. Confirm/replace this slug with your
  //    preferred free OpenRouter model if desired.
  {
    id:            "openrouter",
    name:          "OpenRouter",
    endpoint:      "https://openrouter.ai/api/v1/chat/completions",
    model:         "meta-llama/llama-3.3-70b-instruct:free",
    apiKeyEnv:     "OPENROUTER_API_KEY",
    maxTokens:     1024,
    type:          "openai-compat",
    contextWindow: 65_536,
    role:          "balanced",
  },
  // 5. NVIDIA — 1M-context Nemotron. Big, higher-latency reasoning model, so it's
  //    the LARGE-context specialist: the orchestrator only reaches for it when a
  //    prompt is genuinely large (e.g. a pasted long document), never for short
  //    chat. Reasoning/thinking is intentionally left OFF to keep latency sane.
  {
    id:            "nvidia",
    name:          "NVIDIA",
    endpoint:      "https://integrate.api.nvidia.com/v1/chat/completions",
    model:         "nvidia/nemotron-3-ultra-550b-a55b",
    apiKeyEnv:     "NVIDIA_API_KEY",
    maxTokens:     1024,
    type:          "openai-compat",
    contextWindow: 1_000_000,
    role:          "large",
    timeoutMs:     30_000, // large model — allow more headroom than the 14s default
  },
];
