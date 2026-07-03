// ============================================================
// PORTFOLIO CONFIG — All data lives here.
// Update this file only — never touch component code for data.
//
// RULE: every fact (availability, notice, location, remote) has
// exactly ONE field here. UI, FAQ, and the AI system prompt all
// derive from these fields — never restate them elsewhere.
// ============================================================

export const personal = {
  name: "Sankalp Kailash Wanjari",
  shortName: "Sankalp",
  initials: "SKW",
  title: "AI Engineer",
  focus: "Agentic Systems · RAG · LLM Infrastructure", // specialization areas, NOT an employer
  roles: ["AI Engineer", "AI Product Manager"],
  tagline: "I build AI products — from model to market.",
  bio: `Turns complex AI problems into production systems — agentic pipelines, RAG architectures, and LLM applications built to be reliable, evaluated, and cost-efficient. Over 3 years at the intersection of what's technically possible and what's actually worth building.`,
  githubUsername: "sankalpwanjari",

  // ── Single source of truth: hiring facts ──────────────────
  availability: "Available for hire",
  availabilityStatus: "active" as "active" | "passive" | "unavailable",
  noticePeriod: "Immediate to 2 weeks",
  location: "Maharashtra, India",
  workPreference: "Remote-first or hybrid; open to Bangalore on-site for the right role",
  targetRoles: "AI Engineer, AI Product Manager, or hybrid AI PM/Engineer roles",

  email: "sankalpwanjari1625@gmail.com",
  phone: "+91 90118 12149",
  resumeUrl: "/Sankalp-Wanjari-Resume.pdf",
  resumeUpdated: "July 2025",
  profilePhoto: "/profile_pic_2.png",

  stats: [
    { value: "3+", label: "years shipping software" },
    { value: "10", label: "agents in one LangGraph pipeline" },
    { value: "90%", label: "less manual data entry at FIS" },
    { value: "132", label: "automated tests in AutoML Orchestrator" },
  ],
};

export const social = {
  github:   "https://github.com/sankalpwanjari",
  linkedin: "https://linkedin.com/in/sankalpwanjari",
  twitter:  "",
  website:  "https://sankalpwanjari.dev",
};

export const skills = [
  // AI / ML & Agentic
  { name: "LangGraph",          core: true,  category: "AI/ML" },
  { name: "RAG Systems",        core: true,  category: "AI/ML" },
  { name: "Prompt Engineering", core: true,  category: "AI/ML" },
  { name: "LLM Evaluation",     core: true,  category: "AI/ML" },
  { name: "Python",             core: true,  category: "AI/ML" },
  { name: "Agentic AI",         core: true,  category: "AI/ML" },
  { name: "Vector Search",      core: false, category: "AI/ML" },
  { name: "PyTorch",            core: false, category: "AI/ML" },
  // Engineering & MLOps
  { name: "FastAPI",            core: true,  category: "Engineering" },
  { name: "Docker",             core: true,  category: "Engineering" },
  { name: "CI/CD",              core: false, category: "Engineering" },
  { name: "PostgreSQL",         core: false, category: "Engineering" },
  { name: "Redis / Qdrant",     core: false, category: "Engineering" },
  { name: "REST APIs",          core: false, category: "Engineering" },
  { name: "TypeScript",         core: false, category: "Engineering" },
  { name: "Next.js",            core: false, category: "Engineering" },
  // Product
  { name: "AI System Design",       core: true,  category: "Product" },
  { name: "Feature Prioritisation", core: false, category: "Product" },
  { name: "Latency Optimisation",   core: false, category: "Product" },
  { name: "Rapid Prototyping",      core: false, category: "Product" },
];

// Career = work experience only. Education lives in `education` below.
export const experience = [
  {
    date: "2022-12-01",
    endDate: "2025-07-01",
    title: "Implementation Conversion Analyst (Software Engineer)",
    company: "FIS Global",
    location: "Bangalore, India",
    description:
      "Cut manual data entry by 90% with a config-driven PDF table extraction pipeline spanning 50+ layouts (<5% correction rate). Led end-to-end bank data conversion and deconversion across U.S. and U.K. migrations. Built an LLM-powered SQL generation system for an org-wide innovation challenge.",
    tags: ["Python", ".NET", "SQL Server", "LLM", "PowerShell"],
    highlights: [
      "PDF extraction pipeline: 50+ layouts, <5% correction rate, 90% less manual entry",
      "LLM-powered SQL generation system for FIS innovation challenge",
      "Data Migration Manager with AES encryption & project tracking",
      "Eliminated manual checks across 1,000+ documents via Python automation",
    ],
  },
  {
    date: "2022-06-01",
    endDate: "2022-12-01",
    title: "IT Trainee",
    company: "FIS Global",
    location: "Bangalore, India",
    description:
      "Six-month graduate training across FIS banking platforms, data conversion tooling, and enterprise engineering practices — promoted to Implementation Conversion Analyst.",
    tags: ["SQL Server", ".NET", "Banking Systems"],
    highlights: [
      "Trained across FIS banking platforms and conversion tooling",
      "Promoted to Implementation Conversion Analyst after 6 months",
    ],
  },
  {
    date: "2020-10-01",
    endDate: "2020-12-01",
    title: "Data Analyst Intern",
    company: "Suven Consultants & Technology Pvt. Ltd.",
    location: "India (Remote)",
    description:
      "Applied data-analysis and classic ML across client projects — meteorological data analysis, digit recognition, and NLP sentiment analysis — publishing a blog write-up for each project.",
    tags: ["Python", "Scikit-learn", "NLP", "Data Analysis"],
    highlights: [
      "Handwritten Digit Recognition with Scikit-learn — 95% accuracy on MNIST + scratch datasets",
      "Sentiment analysis on movie reviews using NLP techniques",
      "Meteorological data analysis project",
      "Published a blog for every project, sharing methods and learnings",
    ],
  },
];

export const education = {
  degree: {
    date: "2018-06-01",
    endDate: "2022-06-01",
    title: "B.E. Computer Engineering, Honors in AI/ML",
    school: "IIIT Pune",
    location: "Pune, India",
    description: "Bachelor of Computer Engineering with specialisation in AI/ML.",
    highlights: ["CGPA: 8.54", "Honors specialisation in AI/ML"],
  },
  // Featured executive certification
  featuredCert: {
    title: "Product Management using Generative AI & Agentic AI",
    issuer: "BITSoM — BITS School of Management",
    year: "2025",
    description:
      "Executive certification covering AI product strategy, GenAI product lifecycle, and agentic-AI product design — the PM half of the AI PM/Engineer hybrid.",
  },
};

// Certificate gallery — previewed in the frontend, never downloaded.
// Drop images in /public/certificates/ and reference them here.
// Only entries listed here render; empty array hides the rail.
export const certificates: {
  title: string;
  issuer: string;
  year: string;
  image?: string; // e.g. "/certificates/deep-learning-coursera.png"
  url?: string;   // optional verification link
}[] = [
  // TODO(Sankalp): add Coursera/Udemy certificates — title, issuer, year, image path
];

export const projects = [
  {
    id: "001",
    name: "AutoML Orchestrator",
    shortName: "automl_orchestrator",
    description:
      "10-agent LangGraph system that converts a CSV + plain-English goal into a fully deployed, evaluated ML model — LLM drives every pipeline decision while a sandboxed executor validates outputs.",
    longDescription:
      "Architected a 10-agent LangGraph system where each agent owns a specific ML pipeline stage: data profiling, feature engineering, model selection, hyperparameter tuning, evaluation, and MLflow deployment. LLM drives every decision. Sandboxed executor validates outputs. Agentic self-repair rewrites and re-executes failed code in a network-isolated, non-root, hard-timeout sandbox.",
    stack: ["Python", "FastAPI", "LangGraph", "Docker", "MLflow", "Prometheus"],
    category: "AI/ML",
    status: "DEPLOYED",
    impact: "CRITICAL",
    highlights: [
      "10-agent LangGraph orchestration — LLM drives every decision",
      "6-provider LLM fallback with circuit-breaker & cooldown",
      "Agentic self-repair: rewrites + re-executes failed code in sandboxed env",
      "132 automated tests including full E2E LangGraph harness",
      "MLflow model registry with Staging→Production promotion",
      "Prometheus/Grafana per-call token, cost & latency tracing",
    ],
    github: "https://github.com/sankalpwanjari", // TODO: replace with the actual repo URL
    liveUrl: "",
    year: "2024",
    caseStudy: {
      problem:
        "ML workflows are full of human bottlenecks — data scientists manually decide on features, model selection, and hyperparameters at each step. Every decision is context-dependent, expertise-constrained, and impossible to parallelise. The goal: remove humans from the loop without removing quality.",
      approach:
        "Architected a 10-agent LangGraph system with one agent per pipeline stage. LLM drives every decision. A sandboxed executor (network-isolated, non-root, hard-timeout) validates every output. Agentic self-repair: on template failure, the agent rewrites and re-executes in the sandbox. Engineered an LLM reliability layer with 6-provider fallback, rate-limit circuit-breaker with cooldown, and completion caching.",
      results: [
        "Zero unhandled pipeline crashes — agentic self-repair catches all template failures",
        "6-provider LLM fallback eliminating rate-limit failures across concurrent runs",
        "132 automated tests including an end-to-end LangGraph harness",
        "MLflow model registry with Staging→Production promotion pipeline",
        "Prometheus/Grafana observability: per-call token, cost & latency tracing",
        "LLM cost budgets, active-run quotas, and prompt-injection guardrails in production",
      ],
      lessons:
        "Agentic self-repair is the most underrated feature in multi-agent systems. An agent that can rewrite and re-execute its own failed code in a sandboxed environment removes an entire class of failure modes. The sandbox constraints matter: non-root, network-isolated, hard-timeout — otherwise you've just shifted the failure mode.",
      role: "Sole architect and engineer — system design, agent architecture, LLM reliability layer, sandboxed executor, observability stack, and full test suite",
    },
  },
  {
    id: "002",
    name: "Autonomous AI Research System",
    shortName: "research_system",
    description:
      "Verification-gated research assistant that quote-matches and NLI-checks every generated claim against its source — making fabricated citations structurally impossible rather than probabilistically unlikely.",
    longDescription:
      "Built a 7-node LangGraph multi-agent pipeline with hybrid RAG (BM25 + dense retrieval + RRF fusion + cross-encoder reranking). Every generated claim is immediately quote-matched and NLI-checked against its cited source. CI-gated groundedness evaluation framework makes hallucination a build-breaking condition. Deployed across FastAPI, Next.js, Qdrant, Redis, PostgreSQL with Prometheus and Langfuse observability.",
    stack: ["Python", "FastAPI", "LangGraph", "Qdrant", "Docker", "PostgreSQL"],
    category: "AI/ML",
    status: "DEPLOYED",
    impact: "HIGH",
    highlights: [
      ">85% retrieval relevance via hybrid RAG + RRF fusion",
      "Zero fabricated citations — enforced as a CI gate, not a heuristic",
      "NLI-check on every claim before it leaves the pipeline",
      "7-node LangGraph with crash-recovery & replan-on-insufficient-evidence",
      "Langfuse + Prometheus observability across the full stack",
    ],
    github: "https://github.com/sankalpwanjari", // TODO: replace with the actual repo URL
    liveUrl: "",
    year: "2024",
    caseStudy: {
      problem:
        "LLM research assistants hallucinate citations — they confidently cite papers that don't exist, or attribute claims to the wrong source. Post-deployment detection is too late: the research is already written, shared, and acted upon. The standard 'be careful' prompt instruction has near-zero effect at scale.",
      approach:
        "Built verification-first: every claim generated is immediately quote-matched and NLI-checked against its cited source before the pipeline proceeds. Hybrid RAG (BM25 + dense retrieval + RRF fusion + cross-encoder reranking + contextual embeddings) with a 4-provider LLM router (throttling, caching, fallback chains) maximises retrieval quality. A CI-gated groundedness eval framework enforces ≥98% claim support on a frozen golden test set — making hallucination a build-breaking condition.",
      results: [
        ">85% retrieval relevance on evaluation set via hybrid RAG + cross-encoder reranking",
        "Zero fabricated citations — verified as structural property, not probabilistic estimate",
        "≥98% claim support on frozen golden test set — CI gate blocks any regression",
        "7-node LangGraph pipeline with token budgets, crash-recovery, replan-on-insufficient-evidence",
        "Full observability: FastAPI + Next.js + Qdrant + Redis + PostgreSQL + Prometheus + Langfuse",
      ],
      lessons:
        "Citation grounding must be structural, not probabilistic. A system that 'usually' doesn't hallucinate is a system that will hallucinate in production when it matters most. The only reliable approach is making fabrication architecturally impossible — validate every claim before it leaves the pipeline, then enforce that guarantee as a CI gate.",
      role: "Full-stack — RAG architecture, LangGraph pipeline, NLI verification layer, evaluation framework, CI integration, multi-service deployment",
    },
  },
  {
    id: "003",
    name: "Live Portfolio OS",
    shortName: "portfolio_os",
    description:
      "This portfolio. An AI concierge with real UI tools — it navigates sections, opens case studies, and highlights skills in real time while answering questions about my work.",
    longDescription:
      "Designed and built a portfolio where the AI is not a chatbot inside a website — it operates the website. The agent has real UI tools: navigate, open case study, highlight skill. Multi-provider LLM fallback (6 providers) with zero paid API cost. The entire portfolio is a proof of what Sankalp builds.",
    stack: ["Next.js", "TypeScript", "Framer Motion", "Tailwind"],
    category: "Engineering",
    status: "LIVE",
    impact: "CRITICAL",
    highlights: [
      "Agent operates the page via tagged tool calls — navigate, highlight, open case study",
      "6-provider LLM fallback — zero paid API cost",
      "Decoupled event bus: concierge dispatches CustomEvents, UI listens",
      "Server-rendered content with a progressive AI layer on top",
    ],
    github: "https://github.com/sankalpwanjari", // TODO: replace with the actual repo URL
    liveUrl: "https://sankalpwanjari.dev",
    year: "2025",
    caseStudy: {
      problem:
        "Every portfolio is a document. Visitors browse it like a website. Recruiters skim, developers scroll, and nobody remembers the candidate. The goal: make the portfolio itself the proof of what Sankalp builds.",
      approach:
        "Designed the portfolio as content-first with an agentic layer. The concierge doesn't just answer questions — it operates the page as a set of UI tools: navigate to sections, highlight skills, open case studies. Built a multi-provider LLM backend (6 fallbacks) so it works at zero API cost, with a static-FAQ fallback so the chat never dies.",
      results: [
        "Agent controls the page via tagged tool calls with visible consequences",
        "6-provider LLM fallback with health tracking and cooldown — zero paid cost",
        "Decoupled event bus: concierge context dispatches, sections listen — no circular deps",
        "Two-level project deep-dive: overview, then full case study",
      ],
      lessons:
        "The hardest design challenge wasn't the AI — it was making the AI's control of the UI feel natural rather than gimmicky. Each agent action needs a clear visible consequence the visitor can follow. And the content must stand on its own: the AI is a layer, never a gate.",
      role: "Full product: concept, architecture, design system, Next.js frontend, LLM backend, agent design, motion choreography",
    },
  },
];

export const research = [
  {
    id: "paper-001",
    title: "Music Generation Using LSTM Model",
    journal: "TIJER International Research Journal",
    year: "2023",
    status: "PUBLISHED",
    abstract:
      "Application of Long Short-Term Memory (LSTM) networks for generating musical compositions. The model learns from existing music datasets to produce new, coherent musical pieces — demonstrating the capabilities of LSTM in creative domains.",
    tags: ["LSTM", "Deep Learning", "Generative AI"],
    pdfUrl: "https://tijer.org/tijer/papers/TIJER2312015.pdf",
  },
  {
    id: "paper-002",
    title: "Automated HTML Code Generation on Sketch Images Using Storm Breaker Algorithm",
    journal: "TIJER International Research Journal",
    year: "2023",
    status: "PUBLISHED",
    abstract:
      "An algorithm for generating HTML code from hand-drawn web page sketches, combining YOLOv5 for element detection with OCR for text recognition to translate visual sketches into functional HTML.",
    tags: ["Computer Vision", "YOLOv5", "OCR", "Code Generation"],
    pdfUrl: "https://tijer.org/tijer/papers/TIJER2312012.pdf",
  },
];

// Agent FAQ — pre-scripted responses (zero API cost).
// The concierge speaks ABOUT Sankalp (third person), never as him.
export const agentFAQ: Record<string, string> = {
  availability: `Sankalp is actively looking for full-time ${personal.targetRoles}. Notice period: ${personal.noticePeriod.toLowerCase()}.`,
  notice: `Notice period: ${personal.noticePeriod.toLowerCase()}.`,
  location: `Based in ${personal.location}. ${personal.workPreference}.`,
  experience:
    "3 years at FIS Global — 6 months as IT Trainee, then Implementation Conversion Analyst (Software Engineer) building data pipelines, LLM tools, and enterprise systems. Earlier: Data Analyst Intern at Suven Consultants (2020). Now specialising in Agentic AI, RAG, and LLM infrastructure.",
  skills:
    "Core: Python, LangGraph, FastAPI, RAG systems, LLM Evaluation. Also strong in Docker, Qdrant, Redis, PostgreSQL, TypeScript, Next.js.",
  education:
    "B.E. Computer Engineering with Honors in AI/ML from IIIT Pune (CGPA 8.54), plus an executive certification in Product Management using Generative AI & Agentic AI from BITSoM.",
  research:
    "Two published papers in TIJER International Research Journal (2023): 'Music Generation Using LSTM Model' and 'Automated HTML Code Generation on Sketch Images' (YOLOv5 + OCR). Both PDFs are linked in the Research section.",
  projects:
    "3 key projects: AutoML Orchestrator (10-agent LangGraph pipeline), Autonomous AI Research System (verification-gated RAG), and this Portfolio OS itself.",
  contact: `Reach Sankalp at ${personal.email} or connect on LinkedIn.`,
  salary: "Open to discussion based on role and scope — best discussed directly with Sankalp.",
  remote: personal.workPreference + ".",
  stack:
    "Primary: Python, LangGraph, FastAPI, Qdrant, Docker. Secondary: Next.js, TypeScript, PostgreSQL, Redis, MLflow.",
};
