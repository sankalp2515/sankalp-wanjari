// Organisation and tool logos, from simple-icons (CC0 data, brand marks remain
// their owners'). Named imports only, so the bundle carries just these paths.
// A name with no entry here falls back to a lettered tile in <LogoMark>; we
// never draw an imitation of a company's mark.

import {
  siAnthropic, siGoogle, siMeta, siNvidia, siMistralai, siHuggingface, siPerplexity,
  siAccenture, siHackerrank, siPython, siLanggraph, siLangchain, siFastapi, siDocker,
  siPytorch, siPostgresql, siRedis, siQdrant, siTypescript, siNextdotjs, siAngular,
  siMlflow, siGrafana, siPrometheus, siOllama, siDotnet,
} from "simple-icons";

export type Logo = { path: string; hex: string; title: string };

const fromSi = (s: { path: string; hex: string; title: string }): Logo => ({ path: s.path, hex: `#${s.hex}`, title: s.title });

export const LOGOS: Record<string, Logo> = {
  // AI labs (radar watchlist names)
  Anthropic: fromSi(siAnthropic),
  "Google DeepMind": fromSi(siGoogle),
  "Meta AI": fromSi(siMeta),
  NVIDIA: fromSi(siNvidia),
  "Mistral AI": fromSi(siMistralai),
  "Hugging Face": fromSi(siHuggingface),
  Perplexity: fromSi(siPerplexity),
  // Organisations
  Accenture: fromSi(siAccenture),
  HackerRank: fromSi(siHackerrank),
  // Tools
  Python: fromSi(siPython),
  LangGraph: fromSi(siLanggraph),
  LangChain: fromSi(siLangchain),
  FastAPI: fromSi(siFastapi),
  Docker: fromSi(siDocker),
  PyTorch: fromSi(siPytorch),
  PostgreSQL: fromSi(siPostgresql),
  Redis: fromSi(siRedis),
  Qdrant: fromSi(siQdrant),
  TypeScript: fromSi(siTypescript),
  "Next.js": fromSi(siNextdotjs),
  Angular: fromSi(siAngular),
  MLflow: fromSi(siMlflow),
  Grafana: fromSi(siGrafana),
  Prometheus: fromSi(siPrometheus),
  Ollama: fromSi(siOllama),
  ".NET": fromSi(siDotnet),
};

// Brand colours for names that have no simple-icons mark (used to tint the
// lettered tile, so the tile still reads as that organisation at a glance).
export const BRAND_TINT: Record<string, string> = {
  OpenAI: "#10A37F",
  Microsoft: "#00A4EF",
  "FIS Global": "#4BCD3E",
  "The Economic Times": "#E21B22",
  SerpApi: "#2F6BFF",
  "IIIT Pune": "#1F4E99",
  BITSoM: "#7A1F2B",
  Groq: "#F55036",
  Langfuse: "#0A60FF",
};

/** Two-letter monogram for the fallback tile. */
const MONO: Record<string, string> = {
  OpenAI: "O", SerpApi: "S", BITSoM: "B", Groq: "G", Langfuse: "L",
  "FIS Global": "FIS", "IIIT Pune": "IIIT", "The Economic Times": "ET",
};

export function monogram(name: string) {
  if (MONO[name]) return MONO[name];
  const w = name.replace(/^The /, "").split(/[\s.]+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase();
}
