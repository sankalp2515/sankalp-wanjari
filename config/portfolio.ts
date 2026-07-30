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
  roles: ["AI Engineer", "AI Product Owner"],
  tagline: "Research first. Systems second. Products that matter.",
  bio: `I enjoy understanding complex problems before writing a single line of code. Whether it's reading research papers, analysing markets, or exploring how existing systems work, I believe great products begin with deep understanding rather than quick solutions.

That curiosity has led me to build production-grade AI systems spanning multi-agent architectures, LLM infrastructure, retrieval pipelines, evaluation frameworks, and developer platforms. I'm not attached to a particular technology—I enjoy finding the right approach for the problem.

My teammates know me as a problem solver who enjoys simplifying complexity and automating repetitive work. I'm currently focused on building reliable AI systems, with the long-term goal of combining engineering and product thinking to create technology that delivers meaningful business value.`,

  // Phrases inside `bio` that the About-card scanner roams over and magnifies.
  // Each MUST be an exact substring of `bio` above — no new copy here.
  bioKeywords: [
    "complex problems",
    "research papers",
    "production-grade AI systems",
    "multi-agent architectures",
    "LLM infrastructure",
    "retrieval pipelines",
    "evaluation frameworks",
    "engineering and product thinking",
    "business value",
  ],

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
  resumeUpdated: "July 2026",
  profilePhoto: "/profile_pic_2.png",

  stats: [
    { value: "3+", label: "years solving business problems with software" },
    { value: "90%", label: "less manual effort through intelligent automation" },
    { value: "AI × Product", label: "engineering driven by product thinking" },
    { value: "132", label: "automated tests in AutoML Orchestrator" },
  ],
};

export const social = {
  github: "https://github.com/sankalp2515",
  linkedin: "https://www.linkedin.com/in/sankalp-w-a37721134/",
  twitter: "",
  website: "https://sankalp-wanjari.vercel.app",
};

export const skills = [
  // AI / ML & Agentic
  { name: "LangGraph", core: true, category: "AI/ML" },
  { name: "RAG Systems", core: true, category: "AI/ML" },
  { name: "Prompt Engineering", core: true, category: "AI/ML" },
  { name: "LLM Evaluation", core: true, category: "AI/ML" },
  { name: "Python", core: true, category: "AI/ML" },
  { name: "Agentic AI", core: true, category: "AI/ML" },
  { name: "Vector Search", core: false, category: "AI/ML" },
  { name: "PyTorch", core: false, category: "AI/ML" },
  { name: "LoRA Fine-Tuning", core: true, category: "AI/ML" },
  { name: "Direct Preference Optimization (DPO)", core: false, category: "AI/ML" },
  { name: "Transformers", core: true, category: "AI/ML" },
  { name: "Synthetic Data Generation", core: false, category: "AI/ML" },
  { name: "LLM Guardrails", core: false, category: "AI/ML" },
  // Engineering & MLOps
  { name: "FastAPI", core: true, category: "Engineering" },
  { name: "Docker", core: true, category: "Engineering" },
  { name: "CI/CD", core: false, category: "Engineering" },
  { name: "PostgreSQL", core: false, category: "Engineering" },
  { name: "Redis / Qdrant", core: false, category: "Engineering" },
  { name: "REST APIs", core: false, category: "Engineering" },
  { name: "TypeScript", core: false, category: "Engineering" },
  { name: "Next.js", core: false, category: "Engineering" },
  { name: "Angular", core: false, category: "Engineering" },
  { name: "MLflow", core: true, category: "Engineering" },
  { name: "Langfuse", core: false, category: "Engineering" },
  { name: "Grafana", core: false, category: "Engineering" },
  { name: "Prometheus", core: false, category: "Engineering" },
  // Product
  { name: "AI System Design", core: true, category: "Product" },
  { name: "Market Research", core: true, category: "Product" },
  { name: "Market Analysis", core: true, category: "Product" },
  { name: "Feature Prioritization", core: false, category: "Product" },
  { name: "Latency Optimization", core: false, category: "Product" },
  { name: "Rapid Prototyping", core: false, category: "Product" },
  { name: "Figma", core: false, category: "Product" },
  { name: "Lovable", core: false, category: "Product" },
  { name: "Google Stitch", core: false, category: "Product" },
  { name: "Wireframes", core: false, category: "Product" },
  { name: "Responsible AI", core: false, category: "Product" },
  { name: "Agile", core: false, category: "Product" },
  { name: "Jira", core: false, category: "Product" },
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
    description: "Bachelor of Computer Engineering with specialization in AI/ML.",
    highlights: ["CGPA: 8.54", "Honors specialization in AI/ML"],
  },
  // Featured executive certification
  featuredCert: {
    title: "Product Management with Generative AI & Agentic AI",
    issuer: "BITSoM — BITS School of Management",
    year: "2025-2026",
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

// ── SHARED VISUALS ────────────────────────────────────────
// Architecture diagrams (engineering projects) and user-flow / journey maps
// (case studies) are exported images dropped in /public — a PNG or SVG from
// Figma, Excalidraw, draw.io, etc. Keep them wide (~16:9) and legible; the UI
// frames them and offers click-to-zoom for the fine print.
export type Diagram = {
  src: string;      // "/projects/automl/architecture.png" (path under /public)
  label?: string;   // short caption ABOVE the figure, e.g. "DATA FLOW"
  caption?: string; // one-line explanation shown UNDER the figure
  alt?: string;     // accessibility description of what the diagram shows
};

// ── ENGINEERING PROJECTS ──────────────────────────────────
// Things Sankalp designed and built: production systems, architecture,
// trade-offs, evaluation, deployment. These are NOT case studies —
// each one opens a "Technical Breakdown" (see `breakdown` below).
// Product-thinking case studies live in `caseStudies` further down.
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
    category: "Agentic Systems",
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
    github: "https://github.com/sankalp2515/AutoML",
    liveUrl: "",
    preview: "",
    poster: "/projects/automl/poster.webp",
    diagrams: [], // architecture / data-flow images (Diagram[]) — see CONTENT-GUIDE
    year: "2026",
    breakdown: {
      problem:
        "ML workflows are full of human bottlenecks — data scientists manually decide on features, model selection, and hyper-parameters at each step. Every decision is context-dependent, expertise-constrained, and impossible to parallelise. The goal: remove humans from the loop without removing quality.",
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
        "Letting the agent rewrite and re-execute its own failed code, inside a sandbox, killed off a whole category of bugs I used to have to fix manually. But the sandbox has to actually be locked down — non-root, no network, hard timeout — or you've just moved the failure somewhere you can't see it.",
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
      "Built a 7-node LangGraph multi-agent pipeline with hybrid RAG (BM25 + dense retrieval + RRF fusion + cross-encoder re-ranking). Every generated claim is immediately quote-matched and NLI-checked against its cited source. CI-gated groundedness evaluation framework makes hallucination a build-breaking condition. Deployed across FastAPI, Next.js, Qdrant, Redis, PostgreSQL with Prometheus and Langfuse observability.",
    stack: ["Python", "FastAPI", "LangGraph", "Qdrant", "Docker", "PostgreSQL"],
    category: "RAG & Research",
    status: "DEPLOYED",
    impact: "HIGH",
    highlights: [
      ">85% retrieval relevance via hybrid RAG + RRF fusion",
      "Zero fabricated citations — enforced as a CI gate, not a heuristic",
      "NLI-check on every claim before it leaves the pipeline",
      "7-node LangGraph with crash-recovery & replan-on-insufficient-evidence",
      "Langfuse + Prometheus observability across the full stack",
    ],
    github: "https://github.com/sankalp2515/Autonomous-Research-Agent-Multi-ai-agent", // TODO: replace with the actual repo URL
    liveUrl: "",
    preview: "",
    poster: "/projects/veriscope/poster.webp", // optional still frame, e.g. "/projects/x/poster.jpg"
    diagrams: [], // architecture / data-flow images (Diagram[]) — see CONTENT-GUIDE
    year: "2026",
    breakdown: {
      problem:
        "LLM research assistants hallucinate citations — they confidently cite papers that don't exist, or attribute claims to the wrong source. Post-deployment detection is too late: the research is already written, shared, and acted upon. The standard 'be careful' prompt instruction has near-zero effect at scale.",
      approach:
        "Built verification-first: every claim generated is immediately quote-matched and NLI-checked against its cited source before the pipeline proceeds. Hybrid RAG (BM25 + dense retrieval + RRF fusion + cross-encoder reranking + contextual embeddings) with a 4-provider LLM router (throttling, caching, fallback chains) maximises retrieval quality. A CI-gated groundedness eval framework enforces ≥98% claim support on a frozen golden test set — making hallucination a build-breaking condition.",
      results: [
        ">85% retrieval relevance on evaluation set via hybrid RAG + cross-encoder reranking",
        "Zero fabricated citations, verified against source text on every claim before it ships",
        "≥98% claim support on frozen golden test set — CI gate blocks any regression",
        "7-node LangGraph pipeline with token budgets, crash-recovery, replan-on-insufficient-evidence",
        "Full observability: FastAPI + Next.js + Qdrant + Redis + PostgreSQL + Prometheus + Langfuse",
      ],
      lessons:
        "A system that 'usually' doesn't hallucinate will hallucinate exactly when it matters most. So I stopped trying to reduce the rate and instead made fabrication impossible to ship: every claim gets checked before it leaves the pipeline, and CI blocks the build if it isn't.",
      role: "Full-stack — RAG architecture, LangGraph pipeline, NLI verification layer, evaluation framework, CI integration, multi-service deployment",
    },
  },
  {
    id: "003",
    name: "StructAgent",
    shortName: "structagent",
    description:
      "Fine-tuned a 1.5B LLM to reliably generate deterministic structured outputs for extraction, tool invocation, and machine-readable refusals, transforming a conversational model into a production-ready software component.",

    longDescription:
      "Built StructAgent, a production-oriented post-training pipeline that fine-tunes Qwen2.5-1.5B using LoRA and Direct Preference Optimization (DPO) to solve one of the biggest challenges in LLM systems: reliable structured outputs. Designed a deterministic inference pipeline with schema validation, structured refusals, synthetic data generation, reproducible evaluation, and production-style observability, achieving near-perfect schema compliance while maintaining a lightweight deployment footprint.",

    stack: [
      "Python",
      "PyTorch",
      "Transformers",
      "TRL",
      "LoRA",
      "DPO",
      "FastAPI",
      "Docker"
    ],

    category: "LLM Engineering",

    status: "DEPLOYED",

    impact: "HIGH",

    highlights: [
      "Improved schema compliance from 25% to 99% through LoRA fine-tuning and DPO alignment",
      "Achieved 100% JSON validity, tool selection accuracy, and structured refusal correctness",
      "Designed a unified JSON output contract covering extraction, tool invocation, and refusals",
      "Built a reproducible synthetic data generation pipeline with deterministic evaluation",
      "Implemented independent schema validation instead of trusting model outputs",
      "Developed a complete evaluation dashboard with baseline vs fine-tuned benchmarking"
    ],

    github: "https://github.com/sankalp2515/StructAgent_A-fine-tune-model",

    liveUrl: "",

    preview: "/projects/structagent/demo.mp4",

    poster: "/projects/structagent/poster.webp", // optional still frame, e.g. "/projects/x/poster.jpg"
    diagrams: [], // architecture / data-flow images (Diagram[]) — see CONTENT-GUIDE

    year: "2026",

    breakdown: {
      problem:
        "LLMs are great at conversation and bad at being software components. Even top instruction models wrap JSON in prose, invent fields that don't exist, or call tools you never gave them — which makes them a pain to wire into anything that needs to be deterministic.",

      approach:
        "Built StructAgent around a production-first philosophy. Fine-tuned Qwen2.5-1.5B using LoRA supervised fine-tuning followed by Direct Preference Optimization on carefully generated preference pairs. Designed a unified JSON response contract, deterministic greedy decoding, independent schema validation, structured refusals, and synthetic data generation with seeded reproducibility. Every prediction is validated outside the model before reaching downstream systems.",

      results: [
        "Schema compliance improved from 25% to 99%",
        "JSON validity increased from 97% to 100%",
        "Exact-match accuracy improved from 11% to 99%",
        "Tool selection accuracy reached 100%",
        "Required field recall increased from 6.6% to 99.8%",
        "Structured refusal correctness improved from 0% to 100%",
        "Built an end-to-end reproducible evaluation framework with automated reporting"
      ],

      lessons:
        "The model was never the hard part. Getting deterministic behavior out of it took reproducible datasets, evaluation I could trust, and validating everything outside the model itself — none of that is machine learning, it's just software engineering applied to ML.",

      role:
        "Sole engineer responsible for dataset generation, training pipeline, LoRA fine-tuning, DPO alignment, evaluation framework, inference engine, validation layer, FastAPI service, dashboard, Docker deployment, and production architecture."
    }
  },
  {
    id: "004",
    name: "OllamaLens",
    shortName: "ollamalens",

    description:
      "Built a local-first LLM engineering platform for benchmarking, evaluating, observing, and comparing Small Language Models with zero cloud dependency and zero API cost.",

    longDescription:
      "Developed a full-stack AI engineering platform that transforms Ollama into a complete local LLM experimentation environment. Features include agentic tool-calling, RAG, structured JSON generation, live model comparison, benchmark automation, LLM-as-a-judge evaluation, observability dashboards, and technical report generation. Designed for AI engineers who need reproducible experimentation, transparent performance metrics, and production-style observability while running entirely on consumer hardware.",

    stack: [
      "Python",
      "FastAPI",
      "React",
      "TypeScript",
      "Ollama",
      "SQLite",
      "Docker",
      "Pydantic",
      "SQLModel"
    ],

    category: "LLM Platform",

    status: "Open-Source",

    impact: "HIGH",

    highlights: [
      "Built a complete offline LLM engineering platform with zero API cost",
      "Implemented agentic ReAct tool-calling with hallucinated tool-call detection and recovery",
      "Designed a RAG pipeline with local embeddings and document retrieval",
      "Created statistically valid benchmarking for TTFT and Tokens/sec using repeated median runs",
      "Built live multi-model comparison with parallel Server-Sent Events streaming",
      "Implemented LLM-as-a-Judge evaluation with schema-validated structured scoring",
      "Developed observability dashboards tracking latency, token usage, tool execution and error rates",
      "Generated automated technical reports from benchmark results"
    ],

    github: "https://github.com/sankalp2515/OllamaLens_Small_Language_Model",

    liveUrl: "",

    preview: "/projects/ollamalens/demo.mp4",

    poster: "/projects/ollamalens/poster.webp", // optional still frame, e.g. "/projects/x/poster.jpg"
    diagrams: [], // architecture / data-flow images (Diagram[]) — see CONTENT-GUIDE

    year: "2026",

    breakdown: {

      problem:
        "Most developers experimenting with local LLMs rely on disconnected scripts, manual benchmarking, and isolated chat interfaces that provide little visibility into model quality, latency, reliability, or engineering trade-offs. There is no unified environment for evaluating and comparing small language models running locally.",

      approach:
        "Designed and built OllamaLens as an end-to-end LLM engineering platform. Integrated FastAPI, React, Ollama, SQLite, and Docker into a single local environment supporting agentic tool-calling, Retrieval-Augmented Generation, structured JSON generation, benchmark automation, multi-model comparison, observability dashboards, and LLM-as-a-Judge evaluation. Every subsystem was optimized to operate efficiently on consumer-grade hardware with a 6 GB GPU.",

      results: [
        "Unified benchmarking, evaluation, observability and experimentation into one platform",
        "Implemented real-time token streaming using Server-Sent Events",
        "Built side-by-side comparison across multiple local language models",
        "Created reproducible benchmark metrics including TTFT and Tokens per Second",
        "Developed structured-output validation with automatic retry and schema correction",
        "Enabled fully offline AI experimentation without cloud APIs or inference costs",
        "Delivered an extensible platform suitable for evaluating future Small Language Models"
      ],

      lessons:
        "Wiring up the model was the easy part. Benchmarking it honestly, streaming results without blocking, and making it all run on a 6GB GPU is where the real work was — the hardware constraint actually forced better decisions than I'd have made with unlimited compute.",

      role:
        "Designed and developed the complete platform including backend architecture, React frontend, benchmarking engine, observability system, RAG pipeline, ReAct agent implementation, evaluation framework, Docker deployment, and engineering documentation."
    }
  },
  {
    id: "005",

    name: "SQLens",

    shortName: "sqlens",

    description:
      "Built an AI-powered SQL optimization and natural-language analytics platform that safely transforms database schemas into intelligent query optimization without exposing production data.",

    longDescription:
      "Developed SQLens, a full-stack AI database assistant that helps developers optimize SQL queries and enables non-technical users to query databases using natural language. Designed around a privacy-first architecture where only schema metadata—not database records—is shared with the language model. The platform combines SQL optimization, NL-to-SQL generation, execution plan analysis, index recommendations, and multi-layer SQL safety validation into a production-oriented developer experience.",

    stack: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "SQLAlchemy",
      "Next.js",
      "TypeScript",
      "Groq",
      "Llama 3.3 70B",
      "Docker"
    ],

    category: "AI Developer Tool",

    status: "Open-Source",

    impact: "HIGH",

    highlights: [
      "Built AI-powered SQL optimization with execution-plan comparison and index recommendations",
      "Designed a three-layer SQL safety engine preventing destructive or injected queries",
      "Implemented privacy-first architecture that shares only schema metadata with the LLM",
      "Developed natural-language-to-SQL generation with explainable reasoning",
      "Created live PostgreSQL execution-plan integration using EXPLAIN without executing user queries",
      "Architected backend using Clean Architecture with repositories, services, and dependency inversion",
      "Implemented structured LLM outputs with validation, retry, and automatic repair",
      "Built 64 backend tests covering SQL safety, repositories, services, and API behavior"
    ],

    github: "https://github.com/sankalp2515/SQL_Optimizer_Generator",

    liveUrl: "",

    preview: "/projects/sqllens/demo.mp4",

    poster: "/projects/sqllens/poster.webp", // optional still frame, e.g. "/projects/x/poster.jpg"
    diagrams: [], // architecture / data-flow images (Diagram[]) — see CONTENT-GUIDE

    year: "2025",

    breakdown: {

      problem:
        "Writing correct SQL is relatively easy, but writing performant SQL requires database expertise. At the same time, non-technical users often depend on engineers for even simple business queries. Existing AI-powered SQL tools introduce another challenge by exposing sensitive production data to external language models or generating unsafe SQL without validation.",

      approach:
        "Designed SQLens around a safety-first architecture. The platform provides SQL optimization, natural-language analytics, execution-plan analysis, and index recommendations while exposing only database schema metadata to the LLM. Every query passes through multiple validation stages before reaching the language model and again before being returned to users. Clean Architecture separates HTTP, business logic, persistence, and LLM integrations, allowing providers to be replaced without affecting application logic.",

      results: [
        "Unified SQL optimization, natural-language analytics, and execution-plan analysis into one platform",
        "Protected production databases using three independent SQL validation stages",
        "Enabled AI-assisted query optimization without exposing user data",
        "Delivered live PostgreSQL execution-plan comparison using EXPLAIN",
        "Implemented structured LLM outputs with automatic validation and retry mechanisms",
        "Built a production-oriented backend with repository pattern, dependency inversion, and comprehensive automated testing"
      ],

      lessons:
        "Putting AI near a production database is a security problem before it's a prompting problem. Prompting the model well didn't matter nearly as much as validating everything it produced and never letting it see real data in the first place.",

      role:
        "Built the whole thing solo — backend, SQL optimization engine, NL-to-SQL, the safety layer, Groq integration, Postgres services, Next.js frontend, Docker deployment, and the test suite."
    }
  },
  {
    id: "006",
    name: "Live Portfolio OS",
    shortName: "portfolio_os",
    description:
      "This portfolio — and a live proof of what I build. An AI concierge, \"Helios,\" doesn't sit in a chat box; it operates the page: navigating sections, opening case studies, highlighting skills, opening a 3D knowledge graph, and narrating a cinematic guided tour — backed by a 5-provider streaming LLM router that runs at zero paid API cost.",
    longDescription:
      "Designed and built a portfolio where the AI isn't a chatbot bolted onto a website — it runs the website. Helios answers questions about my work and operates the UI through real tool calls (navigate, open a case study, highlight a skill, open the 3D knowledge graph), streams its answers token-by-token, and can narrate a five-act cinematic tour in two voices. Under the hood: a server-side LLM router across five free providers with health-tracking circuit-breakers, adaptive ordering, per-provider multi-key rotation, and response caching; true token streaming with sentence-chunked text-to-speech; a small-model orchestrator that trims the context sent per request; a 'reserve power' mode that keeps the whole site answerable from verified facts when every provider is rate-limited; guardrails against prompt injection; and end-to-end structured logging with usage stats. The entire site is the argument: reliability engineered in, at zero paid API cost.",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js / R3F", "Multi-provider LLM router", "ElevenLabs + Gemini TTS"],
    category: "AI Product",
    status: "LIVE",
    impact: "CRITICAL",
    highlights: [
      "Agentic UI control — Helios navigates, opens case studies, highlights skills & opens the 3D graph via tagged tool calls on a decoupled CustomEvent bus",
      "5-provider LLM router (Groq · Gemini · Mistral · OpenRouter · NVIDIA) with health circuit-breaker, adaptive ordering, per-provider multi-key rotation & response cache — zero paid API cost",
      "True token streaming (provider SSE → NDJSON) with fallback-before-first-token — a real typing effect, not a paste",
      "Cinematic 5-act guided tour: letterbox film mode, compositor-driven camera dolly, two-voice narration (ElevenLabs + Gemini TTS) pre-generated at build time",
      "Opt-in voice with a TTS fallback chain (ElevenLabs → Gemini → browser Web Speech) and sentence-chunk streaming for low latency",
      "Reserve-power mode — a static verified-fact brain answers, with an auto health-probe that recovers and re-asks, so the chat never dies",
      "Interactive 3D knowledge graph of every skill, project & credential (React Three Fiber)",
      "Guardrails: prompt-injection filters, an intent gate, a server-owned system prompt, and a navigation allowlist — plus per-step structured logging and a /api/ai/stats usage counter",
    ],
    github: "https://github.com/sankalp2515/sankalp-wanjari", // TODO: replace with the actual repo URL
    liveUrl: "https://sankalp-wanjari.vercel.app",
    // The portfolio IS the live site — its strongest hover preview is a short
    // screen recording of the concierge operating the page. Drop it at
    // /projects/portfolio/demo.mp4 and set preview below. Until then the poster
    // reuses the site's own generated OG card, so the card shows a real branded
    // still instead of the fallback signal animation.
    preview: "",
    poster: "/projects/portfolio_os/poster.webp", // optional still frame, e.g. "/projects/x/poster.jpg"
    diagrams: [], // architecture / data-flow images (Diagram[]) — see CONTENT-GUIDE
    year: "2026",
    breakdown: {
      problem:
        "Every portfolio is a document. Visitors browse it like a website — recruiters skim, developers scroll, and nobody remembers the candidate. Worse, a portfolio for an AI engineer usually just *claims* AI skills instead of demonstrating them. The goal: make the portfolio itself the proof — a live AI system reliable enough to run in front of strangers, at zero paid cost.",
      approach:
        "Built content-first with an agentic layer on top, so the site works fully with the AI (and JavaScript) turned off, then gets better with it on. The concierge, Helios, operates the page through real UI tool calls emitted as tags and dispatched over a decoupled CustomEvent bus — navigate, highlight a skill, open a case study, open the 3D knowledge graph. The whole LLM stack is server-owned: a router across five free providers with a health circuit-breaker, adaptive ordering that pins whatever is currently working, per-provider multi-key rotation, and a response cache. Answers stream token-by-token via provider SSE re-emitted as NDJSON (fallback only happens before the first token, then it commits). A small-model orchestrator trims the context sent per request. Voice is a separate service with its own fallback chain and sentence-chunk streaming so audio tracks the text. When every provider is exhausted, a 'reserve power' mode answers from a static verified-fact brain and auto-probes for recovery. Guardrails (injection filters, an intent gate, a nav allowlist, a server-owned prompt) and per-step structured logging run throughout.",
      results: [
        "Helios operates the page via tagged tool calls with visible, followable consequences — navigation, skill highlights, case studies, and a 3D knowledge graph",
        "5-provider LLM router with health tracking, cooldown, adaptive ordering, per-provider multi-key rotation and caching — zero paid API cost",
        "True token streaming with a real typing effect; sentence-chunked TTS keeps the optional voice in sync",
        "A cinematic five-act guided tour with two-voice narration, pre-generated at build time so it costs nothing to play",
        "Reserve-power mode + auto-recovery means the concierge never dies, even when all providers are rate-limited",
        "Decoupled event bus (context dispatches, sections listen) — no circular deps; a static-FAQ brain and slash-command deck work with the AI off",
      ],
      lessons:
        "The hard part wasn't the AI — it was making an AI that controls the page feel natural instead of gimmicky, and making it never break in front of someone. Every action needs a visible consequence, the site has to work with the AI off, and the reliability layer (fallbacks, reserve power, guardrails, streaming) is most of the real engineering.",
      role: "Full product, solo: concept, architecture, design system, Next.js/React frontend, the 3D knowledge graph, the multi-provider streaming LLM backend, agent + tool design, the cinematic tour and voice pipeline, guardrails, observability, and motion choreography.",
    },
  },
];

// ── DIRECTOR (PARKED) — per-project ranking dimensions + hero variants ──
// Data for the parked persona/Director autonomy layer (lib/director.ts). Kept
// in place so that system can be revived without reconstruction. Unused while
// the persona features are parked. See docs/FEATURES.md §4.
export type ProjectDimensions = {
  businessImpact: number;
  architectureDepth: number;
  codeCraft: number;
  novelty: number;
};
export const projectDimensions: Record<string, ProjectDimensions> = {
  "001": { businessImpact: 0.7, architectureDepth: 1.0, codeCraft: 0.9, novelty: 0.9 },
  "002": { businessImpact: 0.6, architectureDepth: 0.95, codeCraft: 0.85, novelty: 0.95 },
  "003": { businessImpact: 0.55, architectureDepth: 0.8, codeCraft: 0.95, novelty: 0.7 },
  "004": { businessImpact: 0.5, architectureDepth: 0.7, codeCraft: 0.8, novelty: 0.75 },
  "005": { businessImpact: 0.75, architectureDepth: 0.75, codeCraft: 0.8, novelty: 0.6 },
  "006": { businessImpact: 0.65, architectureDepth: 0.6, codeCraft: 0.7, novelty: 1.0 },
};

export type HeroVariantKey = "vision" | "outcome" | "architecture" | "builder";
export const heroVariants: Record<HeroVariantKey, {
  eyebrow: string; l1: string; em: string; l3: string; statement: string;
}> = {
  vision: {
    eyebrow: "THE PROOF ENGINE / 2026",
    l1: "AI THAT", em: "CAN PROVE", l3: "ITSELF.",
    statement: "I build the layer between a model's output and a decision you can defend — verified, evaluated, and cheap to run.",
  },
  outcome: {
    eyebrow: "SHIPPED, NOT SLIDEWARE / 2026",
    l1: "AI THAT", em: "SHIPS", l3: "OUTCOMES.",
    statement: "3 years shipping production software and six AI systems that actually run — measurable impact, and available to start now.",
  },
  architecture: {
    eyebrow: "BUILT TO SURVIVE PRODUCTION / 2026",
    l1: "SYSTEMS", em: "BUILT TO", l3: "SURVIVE.",
    statement: "Multi-agent orchestration, six-provider fallback, and CI-gated groundedness evals — reliability engineered in, not bolted on.",
  },
  builder: {
    eyebrow: "THE HARD PARTS / 2026",
    l1: "I BUILD", em: "THE HARD", l3: "PARTS.",
    statement: "Sandboxed executors, 130+ tests, LoRA + DPO pipelines — the unglamorous engineering that makes AI dependable.",
  },
};

// ── PRODUCT CASE STUDIES ──────────────────────────────────
// A deliberately separate track from `projects`. These demonstrate product
// thinking — user research, problem framing, prioritization, trade-offs,
// success metrics, GTM — not engineering builds. The Case Studies section
// and its nav entry only render when this array is non-empty, so it stays
// invisible until there is real work to show. Never seed it with samples.
export type CaseStudy = {
  id: string;            // "CS-001"
  title: string;         // "Netflix retention redesign"
  company: string;       // product/company analysed
  year: string;
  summary: string;       // one line — what the study argues
  tags: string[];        // e.g. ["Growth", "Retention", "Discovery"]
  cover?: string;        // /case-studies/xyz.jpg
  externalUrl?: string;  // Notion / PDF / write-up, if hosted elsewhere
  liveUrl?: string;  // Notion / PDF / write-up, if hosted elsewhere
  study: {
    context: string;       // the market/product situation
    problem: string;       // the user problem, framed
    users: string;         // personas / research basis
    hypothesis: string;    // the bet
    decisions: string[];   // prioritization calls and trade-offs made
    metrics: string[];     // how success is measured
    gtm?: string;          // launch / rollout plan
    outcome: string;       // what the analysis concluded
    flows?: Diagram[];     // user-flow / journey diagrams (optional)
  };
};

export const caseStudies: CaseStudy[] = [
  {
    id: "CS-001",
    title: "ArthRakshak AI — Financial Risk Radar for Informal India",
    company: "",
    year: "2026",
    summary:
      "Built a volatility-aware financial risk platform for 500M informal-income Indians. The product answers one question: given my actual irregular income, is this loan safe? Led problem discovery, product strategy, backend architecture, and zero-budget GTM across an 8-sprint Agile build.",
    tags: [
      "Financial Inclusion",
      "AI Product Safety",
      "Fintech",
      "Zero-to-One",
      "Emerging Markets",
      "Product Strategy",
    ],
    cover: "/case-studies/arthrakshak-cover.webp",
    liveUrl:
      "https://arthrakshak-mu.vercel.app/",
    externalUrl: "https://docs.google.com/document/d/1DtmFJ8AxXEiXGL9baHFWdAkR7K5-AOel2IBVEF54UQg/edit?usp=sharing",
    study: {
      context:
        "India has ~500M people in the informal economy. They have UPI accounts and smartphones, but formal finance treats them as invisible. Without CIBIL scores, they face 24–60% interest from predatory lenders. Existing fintech (Kuber AI, ET Money) assumes stable salaried income — a condition these users will never meet. The RBI Account Aggregator framework and Groq's multilingual LLaMA 3.3 70B created a window to build something specifically for them.",
      problem:
        "Five structural barriers lock informal earners out of safe credit: (1) income volatility of 30–60% month-to-month, (2) no formal credit history, (3) low financial literacy — most cannot distinguish flat rate from reducing rate, (4) deep trust deficit from scam apps and hidden charges, and (5) zero emergency buffer so every shock triggers high-interest borrowing. The core question: how can AI deliver personalized, trustworthy financial guidance without requiring formal financial knowledge or infrastructure?",
      users:
        "Primary: Ravi Kumar (28, Swiggy delivery partner, Indore, ₹18k/month irregular) — needs to know safe EMI limits before accepting a loan. Ram Mohan Y. (37, kirana owner, semi-urban) — manages seasonal cash flow, compares loan offers, fears fraud. Economic customer (Phase 3): Ankit Sharma (42, Head of Credit Risk, Mumbai NBFC) — needs volatility-aware risk signals beyond static CIBIL.",
      hypothesis:
        "If we build a product that sometimes says 'do not take this loan' — the exact opposite of every loan app's optimization — we will earn durable trust with informal earners. That trust, combined with a volatility-aware risk engine and multilingual AI guidance, creates a moat that feature-matching cannot replicate.",
      decisions: [
        "Demo mode before login: User journey research revealed that a signup wall was the single largest drop-off point for this audience. We removed it entirely — first value before first login. This reduced friction but increased engineering complexity for stateless sessions.",
        "Volatility-aware risk engine over CIBIL proxy: Instead of approximating creditworthiness through demographic proxies, we built a cash-flow risk radar that analyses 6 months of actual income to detect lean months and compute a safe EMI limit (30–35% of lowest-income month). No competitor had this for informal earners.",
        "Intent-gated AI pipeline with regulatory boundary: Every user message passes through a 5-class intent classifier (finance / indirect / off-topic / advisory / calculator) before reaching Groq/Anthropic. Off-topic and regulated-advice queries are blocked upstream. This added latency but prevented hallucinated financial advice — a guardrail we treated as non-negotiable.",
        "Session-only data processing: Full DPDP Act 2023 compliance from Sprint 0. No financial data stored beyond the session. This limited feature richness (no historical trend analysis in V1) but eliminated the primary trust barrier for a segment scarred by data misuse.",
        "Rules-based credit scoring in V1: The AI transaction-categorization engine did not pass internal testing. We shipped a rules-based parser with an explicit honesty notice to users rather than overpromising. Cutting this feature preserved trust with users, but it pushed the B2B revenue plan back.",
        "Zero paid acquisition in Phase 1: With no marketing budget, we designed the product to earn distribution through usefulness. The Loan Safety Check result screen includes a WhatsApp share button — creating a viral loop where one user's protection becomes another user's discovery.",
        "No referral revenue from lenders: We committed to zero commissions, zero ads, and zero data sharing with financial institutions without explicit consent. This closed off the easiest fintech revenue model but aligned the product's incentives permanently with user welfare.",
      ],
      metrics: [
        "Primary — 100+ Loan Safety Check completions/day by Month 3",
        "Primary — 40%+ of active users engage with Cash Flow Risk Radar weekly",
        "Primary — 200+ AI Tutor sessions/week by Month 3",
        "Secondary — 40% 30-day retention rate (vs. 10–15% fintech average)",
        "Secondary — 2+ modules used per session",
        "Secondary — NPS > 40",
        "Guardrail — <1% confirmed AI hallucination rate (10-prompt audit/sprint, 20-prompt pre-launch hardening)",
        "Guardrail — 0 advisory boundary violations (no specific product/lender recommendations)",
        "Guardrail — 0 persistent user financial data storage (session-only processing)",
      ],
      gtm:
        "Three-phase soft launch following the Ansoff Matrix. Phase 1 (Market Penetration): Pune-only, 5 delivery-partner ambassadors sharing scam alerts via WhatsApp. Zero paid spend. Target: 500 demo users. Phase 2 (Market Development): Diwali counter-campaign across Mumbai. Ride competitor ad spend as free fuel. RBI Verification Directory as shareable content. Target: 2,500 cumulative users. Phase 3 (Product Development): ₹99 Credit Profile report for existing users. NGO/SHG offline channels for kirana owners. Target: 5,000 users, 500 paid conversions.",
      outcome:
        "Shipped a functional 6-module MVP on Next.js/Vercel in 8 sprints (65 story points). Core features live: multilingual AI Tutor (7 Indian languages), Loan Safety Checker with true APR and RBI verification, Cash Flow Risk Radar with volatility engine, Financial Calculators, Daily Quiz, and Dashboard. Figma prototype with connected navigation flows. Full PRD, project plan, ethical framework, launch strategy, customer service architecture, and brand system delivered. Honest limitation: the AI-powered Credit Profile transaction engine remains in refinement — V1 uses rules-based parsing with transparent user disclosure.",
    },
  },
];

// ── Knowledge-graph cross-links (the "why it matters" relationships) ──
// The graph auto-wires every project/paper/role/skill to its hub. THESE are
// the extra edges that show how the work connects across categories — the
// story a résumé can't tell. Edit freely: each pair is [fromNodeId, toNodeId].
// Node ids: "me" · hubs ("hub-work" | "hub-research" | "hub-career" |
// "hub-education" | "hub-skills") · projects ("p-001"…) · papers (the paper
// id, e.g. "paper-001") · roles ("e-0" = most-recent job, "e-1"…) · degree
// ("edu-degree") · cert ("edu-cert") · skill clusters ("sk-0" AI/ML, "sk-1"
// Engineering, "sk-2" Product). Drop a link if it no longer holds.

// export const graphLinks: { from: string; to: string; note: string }[] = [
//   { from: "p-001", to: "sk-0", note: "AutoML Orchestrator is built on the AI/ML & agents cluster" },
//   { from: "p-003", to: "sk-1", note: "The Portfolio OS is an engineering / MLOps proof" },
//   { from: "e-0", to: "p-001", note: "FIS enterprise discipline fed the flagship's reliability work" },
//   { from: "edu-cert", to: "sk-2", note: "The BITSoM certification backs the product cluster" },
//   { from: "p-002", to: "hub-research", note: "The Research System embodies the published-work mindset" },
// ];

export type GraphRelation =
  | "demonstrates"
  | "built_with"
  | "inspired_by"
  | "validated_by"
  | "research"
  | "career"
  | "education"
  | "product"
  | "frontend"
  | "backend";

export interface GraphLink {
  from: string;
  to: string;
  relation: GraphRelation;
  strength: 1 | 2 | 3;
  note: string;
}
export const graphLinks: GraphLink[] = [

  // =====================================================
  // AutoML Orchestrator
  // =====================================================

  {
    from: "p-001",
    to: "sk-agentic",
    relation: "demonstrates",
    strength: 3,
    note:
      "AutoML Orchestrator demonstrates autonomous multi-agent reasoning through a 10-agent LangGraph pipeline capable of planning, executing, validating, repairing and deploying machine learning workflows."
  },

  {
    from: "p-001",
    to: "sk-infra",
    relation: "built_with",
    strength: 3,
    note:
      "Built as production infrastructure with sandbox execution, MLflow deployment, observability, testing and reliability engineering rather than as a research prototype."
  },

  {
    from: "p-001",
    to: "sk-eval",
    relation: "validated_by",
    strength: 3,
    note:
      "Production readiness is reinforced through automated evaluation, monitoring, cost tracking and over 130 automated tests covering the complete agent workflow."
  },

  // =====================================================
  // Autonomous Research System
  // =====================================================

  {
    from: "p-002",
    to: "sk-rag",
    relation: "demonstrates",
    strength: 3,
    note:
      "Uses hybrid retrieval, reranking and verification-first generation to create trustworthy research answers grounded in evidence rather than probabilistic text generation."
  },

  {
    from: "p-002",
    to: "sk-eval",
    relation: "validated_by",
    strength: 3,
    note:
      "Every generated claim is independently validated using quote matching, NLI verification and CI-based groundedness evaluation."
  },

  {
    from: "p-002",
    to: "paper-001",
    relation: "research",
    strength: 2,
    note:
      "Builds on an academic mindset established through published AI research while extending those ideas into production retrieval systems."
  },

  // =====================================================
  // StructAgent
  // =====================================================

  {
    from: "p-003",
    to: "sk-finetune",
    relation: "demonstrates",
    strength: 3,
    note:
      "Transforms a general-purpose language model into a deterministic production component using supervised fine-tuning, LoRA and Direct Preference Optimization."
  },

  {
    from: "p-003",
    to: "sk-eval",
    relation: "validated_by",
    strength: 3,
    note:
      "Every prediction is independently evaluated for schema compliance, JSON validity, tool correctness and structured refusals before deployment."
  },

  {
    from: "p-003",
    to: "paper-001",
    relation: "inspired_by",
    strength: 2,
    note:
      "Represents the evolution from earlier deep-learning research into modern LLM alignment and post-training techniques."
  },

  // =====================================================
  // OllamaLens
  // =====================================================

  {
    from: "p-004",
    to: "sk-platform",
    relation: "demonstrates",
    strength: 3,
    note:
      "Designed as a complete local AI engineering platform combining benchmarking, observability, structured generation and evaluation into one developer experience."
  },

  {
    from: "p-004",
    to: "sk-rag",
    relation: "built_with",
    strength: 2,
    note:
      "Integrates retrieval augmented generation alongside local embeddings and document management for reproducible experimentation."
  },

  {
    from: "p-004",
    to: "sk-eval",
    relation: "validated_by",
    strength: 3,
    note:
      "Benchmarks models using statistically valid latency measurements, structured evaluation and LLM-as-a-Judge scoring."
  },

  // =====================================================
  // SQLens
  // =====================================================

  {
    from: "p-005",
    to: "sk-backend",
    relation: "backend",
    strength: 3,
    note:
      "Applies enterprise backend engineering through layered architecture, dependency inversion, SQL validation and privacy-first LLM integration."
  },

  {
    from: "p-005",
    to: "sk-platform",
    relation: "demonstrates",
    strength: 2,
    note:
      "Combines AI-assisted SQL optimization, execution-plan analysis and developer tooling into one production-oriented platform."
  },
  // =====================================================
  // Portfolio OS
  // =====================================================

  {
    from: "p-006",
    to: "sk-product",
    relation: "product",
    strength: 3,
    note:
      "The portfolio itself demonstrates product thinking where AI enhances discovery without becoming the product itself."
  },

  {
    from: "p-006",
    to: "sk-frontend",
    relation: "frontend",
    strength: 3,
    note:
      "Combines advanced frontend engineering, motion design and real AI tool invocation into an interactive developer portfolio."
  },

  // =====================================================
  // Career
  // =====================================================

  {
    from: "e-0",
    to: "p-001",
    relation: "career",
    strength: 2,
    note:
      "Enterprise experience building reliable banking software directly influenced the architecture, testing discipline and operational reliability of AutoML Orchestrator."
  },

  {
    from: "e-0",
    to: "p-005",
    relation: "career",
    strength: 3,
    note:
      "Real-world experience with SQL optimization, enterprise databases and migration tooling inspired SQLens' safety-first architecture."
  },

  {
    from: "e-0",
    to: "p-006",
    relation: "career",
    strength: 1,
    note:
      "Experience building production software shaped the portfolio's focus on usability, maintainability and engineering quality."
  },



  // =====================================================
  // Education
  // =====================================================

  {
    from: "edu-degree",
    to: "paper-001",
    relation: "education",
    strength: 2,
    note:
      "Academic AI/ML foundations resulted in published research exploring deep learning for music generation."
  },

  {
    from: "edu-degree",
    to: "p-003",
    relation: "education",
    strength: 2,
    note:
      "Fundamental machine learning concepts developed during engineering studies later evolved into advanced LLM fine-tuning work."
  },

  {
    from: "edu-cert",
    to: "p-006",
    relation: "product",
    strength: 2,
    note:
      "The BITSoM executive program strengthened the product strategy, user experience and storytelling principles reflected throughout the portfolio."
  },

  {
    from: "edu-cert",
    to: "sk-product",
    relation: "education",
    strength: 2,
    note:
      "Formal product management training complements the engineering background, supporting a hybrid AI Engineer and AI Product Manager profile."
  }

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
    `${projects.length} engineering projects — AutoML Orchestrator (10-agent LangGraph pipeline), Autonomous AI Research System (verification-gated RAG), StructAgent (LoRA + DPO structured outputs), OllamaLens (local LLM benchmarking platform), SQLens (AI SQL optimization), and this Portfolio OS itself. These are production systems, not product case studies — each card opens a technical breakdown.`,
  contact: `Reach Sankalp at ${personal.email} or connect on LinkedIn.`,
  salary: "Open to discussion based on role and scope — best discussed directly with Sankalp.",
  remote: personal.workPreference + ".",
  stack:
    "Primary: Python, LangGraph, FastAPI, Qdrant, Docker. Secondary: Next.js, TypeScript, PostgreSQL, Redis, MLflow.",
};

const capabilityNodes = [

  { id: "sk-agentic", label: "Agentic AI" },

  { id: "sk-rag", label: "RAG Systems" },

  { id: "sk-finetune", label: "LLM Fine-Tuning" },

  { id: "sk-infra", label: "AI Infrastructure" },

  { id: "sk-eval", label: "Evaluation" },

  { id: "sk-platform", label: "Developer Platforms" },

  { id: "sk-backend", label: "Backend Engineering" },

  { id: "sk-frontend", label: "Frontend Systems" },

  { id: "sk-product", label: "Product Strategy" }

];
