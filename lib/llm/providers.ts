// ── LLM Provider Registry ────────────────────────────────────
// Add/remove providers here. Only providers with env keys set will be used.

export type ProviderType = "openai-compat" | "gemini";

export interface LLMProvider {
  id:         string;
  name:       string;
  endpoint:   string;
  model:      string;
  apiKeyEnv:  string;   // empty string = no key needed (Ollama)
  maxTokens:  number;
  type:       ProviderType;
}

export const PROVIDERS: LLMProvider[] = [
  // 1. Groq — fastest, best free tier (14,400 req/day, 30 req/min)
  {
    id:        "groq",
    name:      "Groq",
    endpoint:  "https://api.groq.com/openai/v1/chat/completions",
    model:     "llama-3.3-70b-versatile",
    apiKeyEnv: "GROQ_API_KEY",
    maxTokens: 1024,
    type:      "openai-compat",
  },
  // 2. Google Gemini — 60 req/min, 1500/day free
  {
    id:        "gemini",
    name:      "Gemini",
    endpoint:  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    model:     "gemini-2.5-flash",
    apiKeyEnv: "GEMINI_API_KEY",
    maxTokens: 1024,
    type:      "gemini",
  },
  // 3. OpenRouter — free models: llama, gemma, phi3
  {
    id:        "openrouter",
    name:      "OpenRouter",
    endpoint:  "https://openrouter.ai/api/v1/chat/completions",
    model:     "qwen/qwen3-next-80b-a3b-instruct:free",
    apiKeyEnv: "OPENROUTER_API_KEY",
    maxTokens: 1024,
    type:      "openai-compat",
  },
  // 4. DeepSeek — deepseek-chat, free credits on signup
  {
    id:        "deepseek",
    name:      "DeepSeek",
    endpoint:  "https://api.deepseek.com/v1/chat/completions",
    model:     "deepseek-chat",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    maxTokens: 1024,
    type:      "openai-compat",
  },
  // 5. Kimi (Moonshot AI) — 8k context, free tier
  {
    id:        "kimi",
    name:      "Kimi",
    endpoint:  "https://api.moonshot.cn/v1/chat/completions",
    model:     "moonshot-v1-8k",
    apiKeyEnv: "KIMI_API_KEY",
    maxTokens: 1024,
    type:      "openai-compat",
  },
  // 6. Ollama — local, no API key, fallback of last resort
  {
    id:        "ollama",
    name:      "Ollama",
    endpoint:  "http://localhost:11434/v1/chat/completions",
    model:     "llama3.2",
    apiKeyEnv: "",   // no key needed
    maxTokens: 1024,
    type:      "openai-compat",
  },
];
