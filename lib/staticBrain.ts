// ── STATIC BRAIN — the concierge on reserve power ─────────────
// When every LLM provider is rate-limited, this is what answers. It is a
// scored retriever over the SAME verified facts in config/portfolio.ts —
// never a generator, never a guesser.
//
// Why scoring and not a chain of `includes()`: the old cascade returned the
// first weak substring hit, so "Has he WORKED on cloud?" matched the
// `includes("work")` branch and answered with the flagship project. Every
// token now votes, the strongest fact wins, and — critically — a query that
// scores below the confidence floor gets an honest "I can't answer that on
// reserve power" instead of a confident wrong answer.
//
// A wrong answer costs more trust than an admitted gap.

import { agentFAQ, personal, projects, skills, experience, research } from "@/config/portfolio";

export interface StaticAnswer {
  text: string;
  /** 0–1. Below CONFIDENCE_FLOOR the retriever refuses instead of guessing. */
  confidence: number;
  /** True when we declined to answer — the UI can offer /resume + commands. */
  refused: boolean;
}

interface Fact {
  id: string;
  /** High-signal terms. A keyword hit is worth 3× a body hit. */
  keywords: string[];
  text: string | (() => string);
}

// Words that carry no retrieval signal. "work"/"worked" is NOT here — it is a
// real signal, it just belongs to the career fact rather than the project one.
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "of", "on", "in", "at", "to", "for", "with", "from",
  "is", "are", "was", "were", "be", "been", "being", "am", "do", "does", "did", "done",
  "has", "have", "had", "he", "him", "his", "she", "her", "they", "them", "it", "its",
  "i", "me", "my", "you", "your", "we", "us", "our", "this", "that", "these", "those",
  "what", "whats", "which", "who", "whom", "when", "where", "why", "how", "any", "some",
  "can", "could", "would", "should", "will", "shall", "may", "might", "must",
  "tell", "know", "about", "like", "ever", "there", "here", "get", "got", "give",
  "please", "thanks", "ok", "okay", "so", "just", "really", "much", "many", "lot",
]);

/** Light suffix stripping so "worked"/"working"/"works" all reach "work". */
function stem(w: string): string {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed"))  return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("es"))  return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
}

// ── The fact corpus ────────────────────────────────────────────
// Everything derives from config/portfolio.ts — no restated facts (see the
// single-source rule at the top of that file).

const topSkills = () => skills.filter((s) => s.core).map((s) => s.name).join(", ");

const FACTS: Fact[] = [
  {
    id: "availability",
    keywords: ["available", "availab", "hire", "hiring", "start", "join", "notice", "period", "open", "looking", "opportunity", "onboard", "immediately"],
    text: agentFAQ.availability,
  },
  {
    id: "location",
    keywords: ["location", "locat", "based", "live", "city", "remote", "relocate", "onsite", "on-site", "hybrid", "bangalore", "pune", "india", "maharashtra", "timezone"],
    text: agentFAQ.location,
  },
  {
    id: "salary",
    keywords: ["salary", "compensation", "ctc", "pay", "package", "rate", "budget", "expectation", "money"],
    text: agentFAQ.salary,
  },
  {
    id: "stack",
    keywords: ["stack", "tech", "technology", "tool", "language", "framework", "library", "use"],
    text: agentFAQ.stack,
  },
  {
    id: "skills",
    // "best" deliberately lives on the projects fact, not here — the chip
    // "What's the best thing he's built?" is a project question.
    keywords: ["skill", "strength", "good", "expert", "capab", "proficient", "strong", "specialis", "specializ"],
    text: agentFAQ.skills,
  },
  {
    id: "research",
    keywords: ["research", "paper", "publication", "published", "journal", "lstm", "yolo", "ocr", "academic", "thesis"],
    text: () =>
      `${agentFAQ.research} Titles: ${research.map((r) => `"${r.title}" (${r.year})`).join(", ")}.`,
  },
  {
    id: "experience",
    keywords: ["experience", "background", "career", "work", "job", "role", "company", "employer", "fis", "suven", "history", "year", "professional", "past", "previous"],
    text: () =>
      `${agentFAQ.experience} Most recent: ${experience[0].title} at ${experience[0].company} (${experience[0].location}).`,
  },
  {
    id: "education",
    keywords: ["education", "degree", "college", "university", "school", "study", "studied", "graduate", "cgpa", "gpa", "iiit", "certification", "certificate", "course", "bitsom", "btech", "be"],
    text: agentFAQ.education,
  },
  {
    id: "contact",
    keywords: ["contact", "email", "reach", "linkedin", "phone", "connect", "touch", "message", "talk", "call", "hi", "hello", "hey"],
    text: agentFAQ.contact,
  },
  {
    id: "projects",
    keywords: ["project", "built", "build", "best", "flagship", "portfolio", "case", "study", "shipped", "system", "automl", "made", "created", "showcase", "demo", "repo", "github"],
    text: () =>
      `${projects.length} engineering projects. Flagship: ${projects[0].name} — ${projects[0].description} Ask about any of them by name, or run /work to see them all.`,
  },
  {
    id: "agentic",
    keywords: ["agent", "agentic", "langgraph", "multi", "orchestration", "autonomous", "pipeline", "workflow", "rag", "retrieval", "vector", "embedding", "qdrant", "llm", "eval", "evaluation", "prompt", "finetune", "fine-tuning", "lora", "dpo"],
    text: () =>
      `That's the core of what ${personal.shortName} does — ${personal.focus}. Core stack: ${topSkills()}. The deepest example is ${projects[0].name}: ${projects[0].description}`,
  },
  {
    id: "identity",
    keywords: ["who", "sankalp", "person", "himself", "introduce", "bio", "summary", "overview", "different", "unique", "special", "why"],
    text: () =>
      `${personal.shortName} is an ${personal.title} — ${personal.focus}. ${personal.bio} Core strengths: ${topSkills()}.`,
  },
  {
    id: "cloud",
    // The honest-gap fact. Named explicitly so a cloud question routes HERE
    // and never to the flagship-project blurb.
    keywords: ["cloud", "aws", "gcp", "azure", "kubernetes", "k8s", "devops", "infra", "infrastructure", "hosting", "server", "serverless", "terraform", "sre", "deployment", "deploy", "docker", "container", "cicd", "ci"],
    text: () =>
      `${personal.shortName}'s deployment work is container-first rather than tied to one cloud: Docker, CI/CD, MLflow-based model deployment, and multi-service setups across his projects — plus a deliberately local-first platform (OllamaLens) built to run with zero cloud dependency. ` +
      `On reserve power I only speak from verified facts, and specific AWS/GCP/Azure production experience isn't among them — his resume is the source of truth there (/resume), and it's a fair thing to ask him directly.`,
  },
];

// Individual projects are their own facts, matched by name.
for (const p of projects) {
  FACTS.push({
    id: `project:${p.shortName}`,
    keywords: [
      ...tokenize(p.name),
      ...tokenize(p.shortName),
      ...p.stack.flatMap((s) => tokenize(s)),
    ],
    text: `${p.name} — ${p.description} Stack: ${p.stack.join(", ")}.`,
  });
}

// Precompute the searchable body of each fact once.
const INDEX = FACTS.map((f) => {
  const body = typeof f.text === "function" ? f.text() : f.text;
  return {
    fact: f,
    keywords: new Set(f.keywords.map(stem)),
    body: new Set(tokenize(body)),
  };
});

const KEYWORD_WEIGHT = 3;
const BODY_WEIGHT = 1;
/** Below this, we refuse rather than guess. Tuned so a single strong keyword
 *  hit on a short question clears it, but stray body-word overlap does not. */
const CONFIDENCE_FLOOR = 0.3;

export function staticAnswer(query: string): StaticAnswer {
  const tokens = tokenize(query);

  if (tokens.length === 0) {
    return {
      text: `Ask me about ${personal.shortName}'s work, skills, or availability — I'm running on verified facts right now, so specifics work better than open-ended questions.`,
      confidence: 0,
      refused: true,
    };
  }

  let best = { score: 0, text: "" };
  for (const entry of INDEX) {
    let score = 0;
    for (const t of tokens) {
      if (entry.keywords.has(t)) score += KEYWORD_WEIGHT;
      else if (entry.body.has(t)) score += BODY_WEIGHT;
    }
    if (score > best.score) {
      best = { score, text: typeof entry.fact.text === "function" ? entry.fact.text() : entry.fact.text };
    }
  }

  // Normalise against the best achievable score for this query length, with a
  // floor on the divisor so a one-word question can't trivially score 1.0.
  const confidence = best.score / (Math.max(tokens.length, 2) * KEYWORD_WEIGHT);

  if (confidence < CONFIDENCE_FLOOR) {
    return {
      text:
        `I can't reason freely on reserve power, and I'd rather not guess at that one. ` +
        `What I can do right now: answer from ${personal.shortName}'s verified facts, open the resume (/resume), or jump you to /work, /skills, or /research. ` +
        `For anything deeper, leave a note in the contact section — he replies personally within 24 hours.`,
      confidence,
      refused: true,
    };
  }

  return { text: best.text, confidence, refused: false };
}

/** Greeting shortcut — matched before scoring so "hey" doesn't score as noise. */
export function isGreeting(q: string): boolean {
  return /^(hi|hey|hello|yo|howdy|sup|good (morning|afternoon|evening))\b/i.test(q.trim());
}

export function greeting(): string {
  return `Hi — I'm ${personal.shortName}'s AI concierge, currently on reserve power (every model provider is rate-limited). I can still answer from his verified facts and run /commands. What would you like to know?`;
}
