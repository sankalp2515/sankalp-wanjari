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

  githubUsername: "sankalp2515",

  // ── Single source of truth: hiring facts ──────────────────
  availability: "Available for hire",
  availabilityStatus: "active" as "active" | "passive" | "unavailable",
  noticePeriod: "Immediate to 2 weeks",
  location: "Maharashtra, India",
  workPreference: "Remote-first or hybrid; open to Bangalore on-site for the right role",
  targetRoles: "AI Engineer, AI Product Manager, or hybrid AI PM/Engineer roles",

  email: "sankalpwanjari1625@gmail.com",
  phone: "+91 90118 12149",
  // Exact Git filename case matters on Linux; npm run build verifies it.
  resumeUrl: "/sankalp-wanjari-resume.pdf",
  resumeUpdated: "November 2026",
  profilePhoto: "/profile_pic_2.png",

  // ── Hero (APM redesign) ───────────────────────────────────
  heroRole: "AI Product Manager · AI Engineer",
  // First-person intro, voiced ONCE by `npm run voice:gen` (ElevenLabs) into
  // public/voice/hero-intro.mp3 and served as a static file — zero credits per
  // visit. Changing this text and re-running the script re-records it.
  heroIntro:
    "Hi, I'm Sankalp. I'm an AI product manager who also builds. At FIS, I turned manual banking work into software, and cut manual data entry by ninety percent. Now I build AI that knows what to refuse. Scroll down: you'll see the decisions first, and the code second.",
  // The same intro split into the three spoken lines of the talking clip.
  heroIntroLines: [
    "Hi, I'm Sankalp. I'm an AI product manager who also builds.",
    "At FIS, I turned manual banking work into software, and cut manual data entry by ninety percent.",
    "Now I build AI that knows what to refuse. Scroll down: you'll see the decisions first, and the code second.",
  ],
  // Talking-avatar video (illustrated likeness lip-synced to heroIntro).
  // Leave empty until the asset exists; the hero then shows the portrait.
  avatarVideo: "",
  // Background-removed cutout of profilePhoto for the hero walk-in
  // (npx hyperframes remove-background public/profile_pic_2.png -o …).
  avatarCutout: "/avatar/sankalp-cutout.png",
  // Walk-in clip: generated in Google Flow from Sankalp's own photos (9:16,
  // 8 s), background removed locally (hyperframes remove-background), VP9 with
  // alpha at 540 px (~470 KB). Plays once on load; Safari/reduced motion fall
  // back to the CSS walk-in of avatarCutout.
  avatarWalkIn: "/avatar/walkin-540.webm",
  avatarWalkInPoster: "/avatar/walkin-first.webp",
  // Talking clip: three Flow clips (Veo voice) that start AND end on the
  // walk-in's final frame, joined, background removed, VP9+alpha with Opus
  // audio (~1 MB, preload none — fetched only when "Hear my intro" is tapped).
  avatarTalk: "/avatar/talk-540.webm",
  // Caption timing measured from the clip (Groq Whisper): one [start, end]
  // window in seconds per line of heroIntroLines; words spread evenly inside.
  avatarTalkCues: [[0, 5.0], [6.4, 13.3], [14.4, 22.4]] as [number, number][],
  avatarPoster: "",

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
    date: "2022-06-01",
    endDate: "2025-07-01",
    title: "Software Engineer (Implementation-Conversion Analyst)",
    company: "FIS Global",
    location: "Bangalore, India",
    metric: { value: "90%", label: "less manual data entry" },
    description:
      "Built tools for U.S. and U.K. bank clients. Cut manual document-data entry by 90% with a config-driven extraction framework across 50+ layouts (<5% correction rate). Led a team of 6, including 4 senior leads, to build an LLM query optimizer in an org-wide hackathon that cut estimated SQL execution time by ~35% and was adopted into the team's workflow. Joined as an IT Trainee and was promoted after six months.",
    tags: ["Python", "C#/.NET", "SQL Server", "LLM", "Angular", "PowerShell"],
    highlights: [
      "Led a team of 6 (4 senior leads) to build an LLM query optimizer: ~35% lower estimated SQL execution time, adopted into the team's workflow; scored 3 rewrites per query and fell back safely when none passed validation",
      "Config-driven extraction framework: 50+ financial-document layouts onboarded with no code changes, <5% correction rate, 90% less manual entry",
      "Delivered migrations of millions of bank records for U.S. and U.K. clients; diagnosed failures legacy tools could not trace and presented findings in client technical reports",
      "Cleared processing failures across 1,000+ regulated financial documents by tracing a hidden encryption flag, then turned the fix into a reusable detection tool",
      "Joined as IT Trainee (Jun 2022); promoted to Implementation-Conversion Analyst after 6 months",
    ],
  },
  {
    date: "2020-10-01",
    endDate: "2020-12-01",
    title: "Data Analyst Intern",
    company: "Suven Consultants & Technology Pvt. Ltd.",
    location: "India (Remote)",
    metric: { value: "95%", label: "digit-recognition accuracy" },
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
    id: "007",
    name: "IntentSeal",
    shortName: "intentseal",
    description:
      "A prompt-injection firewall that inspects what AI agents read and checks every tool call against the user's intent — with replayable evidence of what ran and why.",
    longDescription:
      "Built a provider-independent security layer for AI agents: extract hidden document content, normalise encoded payloads, detect attacks in tiers, and enforce deterministic action policies. A versioned intent contract limits tools, recipients, domains and paths even when content detection misses. The React Security Console exposes session replay, attack-to-action provenance, human approvals and an Investigator agent. Available through a Python SDK, REST API and OpenAI/Anthropic-compatible proxy.",
    stack: ["Python", "FastAPI", "React", "ONNX Runtime", "PostgreSQL", "Docker"],
    category: "Agent Security",
    status: "RELEASED",
    impact: "CRITICAL",
    highlights: [
      "Inspects hidden PDF, Word, HTML, email and OCR content before the model sees it",
      "Deterministic tool-call guard enforces the user's versioned intent contract",
      "99.2% recall on 359 third-party-content attacks in the published evaluation",
      "68.1% direct-turn recall; 5.1% false positives on 39 hard-benign cases",
      "Replayable execution receipts, Investigator agent and reviewer-gated repair loop",
      "Python package, SDK, REST API and compatible LLM proxy integrations",
    ],
    github: "https://github.com/sankalp2515/intentseal",
    liveUrl: "https://intentseal-agentic-cybersecurity.navattic.com/16s00ye",
    preview: "",
    poster: "/projects/intentseal/poster-distinct.webp",
    diagrams: [],
    year: "2026",
    breakdown: {
      problem:
        "Agents consume untrusted files, pages and messages, then act with real tool permissions. Detecting suspicious text alone cannot stop an agent from sending data or performing an action the user never authorised.",
      approach:
        "Separate detection from authority. Extract and normalise the content the model actually reads; combine structural rules, a local DeBERTa classifier and an optional AI judge. A deterministic guard independently checks tools and arguments against trusted session context, allow-lists, outbound secret scans and a hash-chained intent contract. Record the application's execution receipts and source provenance so reviewers can reconstruct the attack path.",
      results: [
        "Published 11 October evaluation: 99.2% third-party-content recall (359 attacks), versus 68.1% direct-turn recall (442 cases)",
        "5.1% false-positive rate on a 39-case held-out hard-benign set; isolated fast-path p95 latency 113.6 ms",
        "The 11 October report records 0/9 attack categories meeting the joint recall/FPR acceptance target; high aggregate recall alone is insufficient",
        "Detectors-off assurance run: 0 of 28 reference-agent attacks succeeded (95% CI 0–12%)",
        "Interactive Console tour and installable Python package; results are repository-reported evaluations, not a guarantee that prompt injection is solved",
      ],
      lessons:
        "Detection quality and action safety are different claims. Strong third-party-content recall does not erase weaker direct-turn detection or false alarms. Intent-bound action controls and actual execution receipts make that distinction inspectable.",
      role: "Agent-security product and engineering: detection pipeline, deterministic action guard, SDK/proxy integration, Security Console and evaluation evidence.",
    },
  },
  {
    id: "010",
    name: "Assever",
    shortName: "assever",
    description:
      "Purchase integrity for AI agents on India's commerce and payment rails: approve a purchase once, and the agent can't buy a second basket, swap the supplier or share extra data.",
    longDescription:
      "Payment rails check whether a payment is authorised and within limit. Assever checks whether it is exactly the purchase the person approved. The owner's plain-language request becomes an exact work order (items, suppliers, all-in cap, purchase count, data fields, expiry) that they confirm once. Every proposal from any agent, worker or child agent maps back to that one approved demand; money and stock are reserved together; only a private executor holds credentials; and a standard-library checker rebuilds what happened from separate order, payment and disclosure records.",
    stack: ["Python", "Vertex Gemini", "Model Armor", "PostgreSQL", "Google Cloud Run"],
    category: "Agent Commerce",
    status: "LIVE",
    impact: "CRITICAL",
    highlights: [
      "0/144 unsafe purchases vs 36/144 for a budget-only guard and 54/144 with no guard",
      "126/144 tasks completed vs 92/144 for the budget-only guard",
      "720-case campaign on the deployed system: 24 attack families × 3 provider profiles × 2 role topologies",
      "Unknown provider outcomes are held, never retried and never counted as success",
    ],
    github: "https://github.com/sankalp2515/assever",
    liveUrl: "https://assever-872171487489.us-central1.run.app/#/red-team",
    preview: "",
    poster: "/projects/assever/poster.webp",
    diagrams: [],
    year: "2026",
    breakdown: {
      problem:
        "Two ₹700 baskets fit inside a ₹1,500 cap even when the owner approved one. A seller's message can redirect an agent without breaking any limit, parallel workers can repeat a purchase with fresh request IDs, and a timed-out payment may have succeeded, so a blind retry pays twice.",
      approach:
        "Ask a different question from a budget guard: is this exactly the purchase the person approved, and did that, and only that, happen? Confirmation and activation happen in one PostgreSQL transaction bound to the order's digest; agent keys can never approve. Admission reserves integer paise, quantities and purchase count together with a durable outbox record. Outcomes are proven from independent records with hash-chained receipts.",
      results: [
        "Deployed comparison on the same proposals: no guard 54/144 unsafe, budget-only guard 36/144 unsafe (92/144 tasks), Assever 0/144 unsafe (126/144 tasks)",
        "Recorded on the live deployment: a real Vertex Gemini buyer fell for a fake notice and proposed two baskets; Assever admitted one ₹700 order",
        "Its own authored suite, so zero is not proof of safety; 12 unknown provider outcomes were held rather than retried",
      ],
      lessons:
        "Within budget is not the same as approved. The useful product question was what the person meant, not what the payment rail allows.",
      role: "See the repository for contributors and scope.",
    },
  },
  {
    id: "011",
    name: "Tasleem",
    shortName: "tasleem",
    description:
      "Know whether follow-up care actually happened: after a positive screening test, Tasleem reconciles referral status with clinical evidence, flags the gap and names the clinician who acts next.",
    longDescription:
      "A referral can say Completed while the care is unverified. Tasleem keeps the case open until the required evidence exists, assigns a named owner and escalates on deadlines. A deterministic case core owns workflow state, a hash-chained audit log and an outbox; a connector ingests HL7 v2 and FHIR; a scheduler and notifier handle deadlines and delivery; an AI service only extracts evidence and drafts suggestions for human review. Includes an Arabic right-to-left patient companion.",
    stack: ["Python", "PostgreSQL", "HL7 v2", "FHIR", "Azure"],
    category: "Health Workflow",
    status: "LIVE",
    impact: "HIGH",
    highlights: [
      "99.9% of journeys needing action flagged to a named human, vs 81.8% for a status-only monitor",
      "Median 1.9 days to an alert for cases without a colonoscopy, vs 16.5 days",
      "0 incomplete journeys counted as done, vs 160",
      "2,000 synthetic journeys; 72 of 75 hard cases, misses published",
    ],
    github: "https://github.com/sankalp2515/screening-to-care",
    liveUrl: "https://tasleem.swedencentral.cloudapp.azure.com/demo?tour=1",
    preview: "",
    poster: "/projects/tasleem/poster.webp",
    diagrams: [],
    year: "2026",
    breakdown: {
      problem:
        "In a cited 2015–16 study at Abu Dhabi's SEHA clinics, 30.5% of Emirati adults aged 40–75 with a positive stool screening test underwent follow-up colonoscopy. Referral systems record status, not whether the care happened, so incomplete journeys look finished.",
      approach:
        "Separate status from evidence. A case stays open until the specified evidence or a signed clinical decision exists, always with a named owner. Handoffs transfer ownership only after the recipient accepts. Deterministic rules decide; AI only extracts evidence and drafts for human review.",
      results: [
        "Against a team-built referral-status-only monitor on 2,000 synthetic journeys: 99.9% vs 81.8% of action-needed journeys flagged to a named human",
        "Median 1.9 vs 16.5 days to an alert; 0 vs 160 incomplete journeys counted as done; 53.5 vs 38.5 first alerts per 100 patients",
        "Distress routing reached a clinician within 24 hours for 10 of 11 messages; patient outcomes require a field pilot",
      ],
      lessons:
        "More alerts is a cost, not a win: the comparison publishes alert volume next to catch rate so the workload trade-off is visible.",
      role: "Future Health Digital Innovation Challenge 2026, Population Health, Challenge 05. See the repository for contributors.",
    },
  },
  {
    id: "008",
    name: "Abide",
    shortName: "abide",
    description:
      "A security checkpoint for delegated AI work: confirm a grounded work order once, check every agent action against it, and trace blocked instructions back to their source.",
    longDescription:
      "Built a delegation workflow where Gemini drafts a permission card from the employee's words and a grounding validator removes unsupported clauses. A deterministic gate checks each tool call, while agent credentials cannot confirm, widen or approve their own permissions. The Google Cloud deployment combines live Google ADK agents, revision-bound approvals, hash-chained receipts and BigQuery audit insights. Abide builds on IntentSeal's security foundations with a distinct employee-facing delegation experience.",
    stack: ["Python", "FastAPI", "React", "Google ADK", "Vertex AI", "Cloud Run", "PostgreSQL", "BigQuery"],
    category: "Agent Security",
    status: "DEPLOYED",
    impact: "HIGH",
    highlights: [
      "Grounded work orders: every permission must quote the employee's request",
      "0/28 unauthorised actions and 26/26 legitimate task completions at 0.38 clarifying questions per task, versus 28 of 28 failures for an approve-every-step baseline",
      "Agent keys cannot confirm or approve; approvals bind to one exact action",
      "190/190 handoff provenance labels preserved; 256/256 tampering probes caught",
      "Live Gemini/ADK agent demo with Cloud SQL persistence and BigQuery receipts",
    ],
    github: "https://github.com/sankalp2515/Abide",
    liveUrl: "https://abide-1041805455955.us-central1.run.app/#/tasks?task=new&preset=attack",
    preview: "",
    poster: "/projects/abide/poster-distinct.webp",
    diagrams: [],
    year: "2026",
    breakdown: {
      problem:
        "Content filtering can miss ordinary-looking malicious instructions, while asking a person to approve every agent step creates friction and approval fatigue. Teams need to delegate useful work without silently granting unlimited authority.",
      approach:
        "Compile the employee's task into a grounded, human-confirmed work order. Check tools, recipients, records and amounts with a pure deterministic gate at execution time. Keep agent credentials separate from human approval authority, carry sealed provenance through handoffs and bind exceptions to exact actions. Use Gemini on Vertex AI for drafting and explanations, Google ADK for the live agent team, and Cloud Run, Cloud SQL and BigQuery for service state and audit.",
      results: [
        "Own 64-scenario suite: 0/28 attacks caused unauthorised actions; 26/26 normal tasks completed",
        "0/126 false blocks on authorised calls; 26/28 attacked tasks safely recovered",
        "Median runtime overhead +166 ms per workflow in the model-free benchmark",
        "Live hijacked-Gemini evaluation reports 0/6 successful attacks with Abide; small internal suites are not proof of general safety",
        "Builds on IntentSeal rather than independently replicating it; approval-baseline behaviour is simulated, not a human usability study",
      ],
      lessons:
        "A detector asks whether content looks dangerous; a delegation gate asks whether a person authorised the action. Keep that authority deterministic, preserve source labels across agents and show users why only an exception needs their attention.",
      role: "Delegation product and engineering: work-order grounding, action gate, human approvals, live agent integration, Console and Google Cloud deployment.",
    },
  },
  {
    id: "009",
    name: "CaseProof",
    shortName: "caseproof",
    description:
      "A payment-scam investigation workspace that turns customer evidence and bank records into a cited brief, an inspectable money trail and a reviewer-approved handoff.",
    longDescription:
      "Built an end-to-end first-response workflow for bank fraud analysts: customer reporting, evidence processing, bank-ledger matching, a source-linked Money Trail, focused clarification requests, independent review and durable report delivery. Document AI and Vertex AI Gemini assist with evidence interpretation; backend rules own financial calculations, urgency, readiness and revision checks. The deployed application is explicitly a synthetic staging prototype, not a production bank integration.",
    stack: ["Python", "FastAPI", "React", "Vertex AI", "Document AI", "Firestore", "BigQuery", "Cloud Run", "Cloud Tasks"],
    category: "Financial AI",
    status: "STAGING PROTOTYPE",
    impact: "HIGH",
    highlights: [
      "Customer → analyst → independent reviewer → acknowledged handoff workflow",
      "Source-linked investigation briefs and interactive, evidence-backed Money Trail",
      "Approval bound to the current case revision and digest; new evidence requires fresh review",
      "Durable background jobs, idempotent report delivery and named follow-up ownership",
      "Repository records 51 public-cloud browser checks passed on 27 October 2026",
      "Synthetic practice data only; delivery does not imply a freeze, refund or regulatory filing",
    ],
    github: "https://github.com/sankalp2515/CaseProof-justified-first-response-for-analyst",
    liveUrl: "https://8-233-217-230.sslip.io/app/?tour=start#/victim/start",
    preview: "",
    poster: "/projects/caseproof/poster-distinct.webp",
    diagrams: [],
    year: "2026",
    breakdown: {
      problem:
        "In the first hour after a payment scam, analysts must reconcile receipts, chat logs, customer statements and bank records, trace onward movements and prepare a defensible referral. An unexplained AI summary cannot establish which payment is disputed or what a reviewer has actually authorised.",
      approach:
        "Preserve distinct provenance for customer statements, extracted evidence and bank observations. Use Document AI/Gemini to assist interpretation, with deterministic financial allocation, urgency and readiness checks. Let analysts request only missing information via scoped reply links. Bind independent approval to the current revision and digest, then persist outbound intents and both synthetic receivers' acknowledgements with an owner and next action.",
      results: [
        "Public-cloud verification record reports 51 browser checks passed on 27 October 2026, including live Document AI/Gemini processing and persisted follow-up",
        "Separate customer, analyst and reviewer journeys with source inspection and revision-bound approvals",
        "Cloud Run runtime with Firestore case state, Cloud Storage evidence, BigQuery records and Cloud Tasks/Scheduler background work",
        "Synthetic staging prototype only: no real bank integrations, funds recovery, regulatory submission or production-readiness claim",
      ],
      lessons:
        "Sending a report is not resolving a case. Preserve evidence lineage, invalidate approval when material changes, and keep delivery acknowledgements and follow-up ownership visible. Financial decisions and authorisation must stay outside free-form model output.",
      role: "Product and full-stack engineering: fraud-response workflow, evidence and money-trail experience, deterministic controls, reviewer handoff and cloud runtime.",
    },
  },
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
  {
    id: "012",
    name: "Assay",
    shortName: "assay",
    description:
      "AI outcome assurance for video delivery: recover clips that were made but never arrived, verify the buyer actually got them, and charge PayPal once for exactly that.",
    longDescription:
      "Generation APIs delete outputs on a timer (Replicate 1 hour, Veo 2 days, Runway 24–48 hours), so a failed callback can lose a finished, paid-for video. Assay archives each output, uses AI with read-only tools to investigate missing clips and cite its records, restores the original instead of re-rendering, verifies delivery by SHA-256 through the buyer's own route, then captures only the verified amount from a PayPal authorization and issues an Ed25519-signed per-clip statement. AI proposes; rules decide; PayPal moves money once.",
    stack: ["TypeScript", "Gemini", "PayPal", "PostgreSQL"],
    category: "AI Payments",
    status: "LIVE",
    impact: "HIGH",
    highlights: [
      "Hosted end to end on PayPal Sandbox: $50 hold, lost clip recovered, one $40 capture for 8 verified clips",
      "Gemini read buyer messages correctly 25/30 vs a keyword baseline's 15/30",
      "Gemini chose the right action 17/20 vs rules 20/20, which is why AI never decides actions",
      "75/75 local tests; 23-request Postman run with 0 failures against the hosted service",
    ],
    github: "https://github.com/sankalp2515/Assay",
    liveUrl: "https://assay-34-59-154-73.sslip.io",
    preview: "",
    poster: "/projects/assay/poster.webp",
    diagrams: [],
    year: "2026",
    breakdown: {
      problem:
        "AI-video apps lose money twice when a render 'fails': the provider deletes the finished output, then the app pays to render it again or refunds work that was actually done. Payments, models, queues and storage each hold their own version of the truth.",
      approach:
        "Authorize a ceiling, recover before re-rendering, verify delivery by bytes, capture exactly once, and give the buyer a signed statement anyone can verify. The AI investigates and cites; it never sets a price, approves a charge or moves money.",
      results: [
        "Real PayPal Sandbox run: $50 authorization, one $40 capture, remaining $10 released; webhooks verified",
        "AI reading of buyer messages 25/30 vs keyword baseline 15/30 (30 held-out messages, single run)",
        "AI action choice 17/20 vs rules 20/20: measured evidence for keeping decisions in rules",
      ],
      lessons:
        "Measuring the model against plain rules on the same task told me where the AI belonged and where it didn't.",
      role: "See the repository for contributors and scope.",
    },
  },
  {
    id: "013",
    name: "AutoML Autopilot",
    shortName: "autopilot",
    description:
      "An ML coding agent that checks beyond green tests: it repairs broken Python ML repositories and hands back a patch with independent code and model verification. Nothing merges automatically.",
    longDescription:
      "The agent investigates competing causes, writes source edits and regression tests in isolated candidate workspaces, and submits the result to a separate verifier that checks parity, leakage, quality and protected groups as well as fail-to-pass tests. Reviewers see the diff, the checks, missing evidence and a verdict before downloading a patch or requesting a draft PR.",
    stack: ["Python", "NVIDIA Nemotron", "Nebius Sandboxes", "PostgreSQL", "Docker"],
    category: "ML Agents",
    status: "LIVE",
    impact: "HIGH",
    highlights: [
      "Hosted runs: 3 VERIFIED, 1 REJECTED, 1 INCONCLUSIVE across five fixtures, all published",
      "$0.080805 estimated inference across six hosted attempts",
      "398 passing backend tests at the audited commit",
      "A rejected example where software checks passed but the ML comparison failed",
    ],
    github: "https://github.com/sankalp2515/AutoML-Autopilot",
    liveUrl: "https://136-112-7-18.sslip.io/repair",
    preview: "",
    poster: "/projects/autopilot/poster.webp",
    diagrams: [],
    year: "2026",
    breakdown: {
      problem:
        "Passing a test suite is evidence, not proof, that a model still behaves correctly after a code change. Leakage, preprocessing drift and online/batch mismatches can all ship with green tests.",
      approach:
        "Separate the agent that writes the patch from the verifier that grades it, run candidates in isolated sandboxes, and keep the human in control of the merge.",
      results: [
        "Five hosted fixtures: churn, loan scorer and fraud batch VERIFIED; refund risk REJECTED; credit approval INCONCLUSIVE with no success claimed",
        "A small integration sample, not a benchmark success rate",
      ],
      lessons:
        "Publishing the rejected and inconclusive runs is what makes the verified ones believable.",
      role: "See the repository for contributors and scope.",
    },
  },
  {
    id: "015",
    name: "PatchPilot",
    shortName: "patchpilot",
    description:
      "An agent that repairs broken API adapters when a vendor changes its API: it finds the official change, proposes a cited patch and proves the application's output contract still holds.",
    longDescription:
      "A vendor moves one field and an integration breaks. PatchPilot reproduces the failure, researches the target version through SerpApi, accepts only fetched official evidence with literal supporting quotations, and proposes a focused repair. The repair must pass the unchanged protected cases plus an independent audit; failed checks feed the next attempt (up to three, 240-second budget). Code runs in a restricted interpreter with no imports, shell, filesystem or network. Reviewers export the adapter, diff, citations and scoped proof.",
    stack: ["Python", "SerpApi", "React", "TypeScript", "SQLite", "Docker"],
    category: "Developer Agents",
    status: "LIVE",
    impact: "HIGH",
    highlights: [
      "Best in Track, AI Agents: SerpApi India Hackathon 2026 (700+ entries)",
      "Live Stripe migration: 0/5 to 5/5 protected cases, 20/20 audit cases",
      "First live proposal passed acceptance but only 14/20 audit cases; the second passed 20/20",
      "Missing evidence or exhausted attempts stay unresolved, never silently patched",
    ],
    github: "https://github.com/sankalp2515/PatchPilot",
    liveUrl: "",
    preview: "",
    poster: "/projects/patchpilot/poster.webp",
    diagrams: [],
    year: "2026",
    breakdown: {
      problem:
        "When a third-party API changes, finding the replacement field is only half the job: the repair must keep the exact output the application depends on, including the cases an obvious patch misses.",
      approach:
        "A bounded feedback loop, not one code-generation call: reproduce, research official evidence, propose a cited repair, then grade it against protected tests and a separate audit. Failures return as concrete feedback; the agent may change code, never the tests.",
      results: [
        "Live Stripe invoice migration: 0/5 to 5/5 protected cases and 20/20 applicable audit cases",
        "Controlled comparison: an adapter passing all 5 supplied cases still failed 14 of 20 audit cases",
        "Known gap: an adapter that already passes every supplied case returns no_change before the audit runs",
      ],
      lessons:
        "Green supplied tests can hide a broken contract; the audit is what caught the incomplete first repair.",
      role: "See the repository for contributors and scope.",
    },
  },
];

// Competition work stays separate from the engineering-project catalogue.
export const achievements = [
  {
    id: "et-ai-hackathon-2026",
    project: "IntentSeal",
    title: "National 1st Runner-Up",
    rank: "2nd",
    event: "ET AI Hackathon: Agentic Edition 2026",
    organiser: "The Economic Times × Accenture",
    team: "Team Helios",
    date: "2026",
    prize: "₹60,000",
    // Official winners card (shared by The Economic Times) and the announcement post.
    image: "/achievements/et-ai-hackathon-2026.webp",
    proofUrl: "https://www.linkedin.com/posts/hackathon-results-ugcPost-7522997024439595008-aeym/",
    proofLabel: "ET announcement",
    description:
      "Second place nationally with IntentSeal: a prompt-injection firewall that inspects everything an AI agent reads and checks every action against what the user actually asked for.",
    approach:
      "Detection and authority are separated: content is extracted, normalised and scored, while a deterministic guard checks each tool call against a versioned intent contract, so an attack that slips past detection still can't act.",
    highlights: [
      "99.2% recall on 359 third-party-content attacks",
      "0 of 28 reference-agent attacks succeeded with detectors switched off",
      "Python SDK, REST API and compatible LLM proxy",
    ],
    limitation:
      "Direct-turn recall is 68.1% with 5.1% false positives on hard benign cases; the published report says high aggregate recall alone is not enough.",
    github: "https://github.com/sankalp2515/intentseal",
  },
  {
    id: "hackerrank-orchestrate-2026",
    project: "Buy or Wait?",
    title: "7th of 3,062 finalists",
    rank: "7th",
    organiser: "HackerRank",
    team: "",
    event: "HackerRank Orchestrate",
    date: "September 2026",
    description:
      "Built an AI financial decision agent in 24 hours: can you safely afford a purchase now, and if not, when?",
    approach:
      "The model reads financial messages and resolves ambiguous evidence; deterministic Python owns the 90-day ledger, affordability calculations and payment-plan ranking.",
    highlights: [
      "3,062 finalists from 35,712 registrants",
      "77.3/100 final competition score",
      "250 purchase decisions; 51 offline validation checks",
      "Python standard library + Gemini; no third-party packages",
      "$0.2392 reported cold-cache model cost for the submitted run",
    ],
    limitation:
      "Competition submission, not financial advice. The repository documents forecast error and a pending-credit validation limitation.",
    github: "https://github.com/sankalp2515/buy-or-wait",
  },
  {
    id: "serpapi-india-2026",
    project: "PatchPilot",
    title: "Best in Track: AI Agents",
    rank: "1st",
    organiser: "SerpApi",
    team: "",
    event: "SerpApi India Hackathon 2026",
    date: "October 2026",
    description:
      "Won the AI Agents track with PatchPilot, one of 14 projects named among 700+ entries: an agent that repairs integration code after an API change and proves the output contract still holds.",
    approach:
      "SerpApi finds the official change; only fetched vendor text with literal quotations counts as evidence, and every repair is graded against unchanged tests plus an independent audit.",
    highlights: [
      "700+ entries across six tracks",
      "0/5 to 5/5 protected cases, 20/20 audit cases on a live Stripe migration",
      "Prize: 10,000 SerpApi credits",
    ],
    limitation:
      "Verified within the tested contract only; adapters that already pass every supplied case skip the audit today.",
    github: "https://github.com/sankalp2515/PatchPilot",
    proofUrl: "https://serpapi.com/blog/meet-the-winners-of-the-serpapi-india-hackathon-2026/",
    proofLabel: "Winners list",
  },
];

// Verified credentials (issuer-hosted records). Shown after the ranked results,
// as credentials, never as placements.
export const credentials: { title: string; issuer: string; date: string; context: string; id: string; url: string; project?: { name: string; line: string; github: string } }[] = [
  {
    title: "AI Data Harness Solution Developer",
    issuer: "Zetaris × SpaceXSI",
    date: "November 2026",
    context: "Awarded for building an AI agent on the Zetaris Data Harness during the Open Agent Hackathon.",
    id: "ZTR-DHSD-J343CA",
    url: "https://www.zetaris.com/credentials/ztr-dhsd-j343ca",
    // The hackathon build that earned it (its README loads evidence through Zetaris).
    project: {
      name: "TraceVerdict",
      line: "Explain an agent incident. Test a repair. Preserve useful work.",
      github: "https://github.com/sankalp2515/TraceVerdict",
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
  "007": { businessImpact: 0.85, architectureDepth: 1.0, codeCraft: 0.95, novelty: 0.95 },
  "008": { businessImpact: 0.9, architectureDepth: 0.95, codeCraft: 0.9, novelty: 0.95 },
  "009": { businessImpact: 0.9, architectureDepth: 0.95, codeCraft: 0.9, novelty: 0.9 },
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
    statement: `3 years shipping production software and ${projects.length} AI systems spanning agent security, financial workflows and ML infrastructure — available to start now.`,
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

// ── DECISION FILM (the pinned flagship-project story) ─────
// Four beats per flagship, condensed from that project's own breakdown above
// (problem / approach / lessons+results / results). `video` is an optional
// pre-rendered motion loop (HyperFrames, motion/<project>/) whose four scenes
// line up with the beats via `beats` (seconds). Without it the poster is used.
export type FilmBeatKey = "problem" | "decision" | "tradeoff" | "outcome";
// The three builds told as decision films, in order. Others stay in the index.
export const flagshipIds = ["007", "010", "011"];

export const projectFilms: Record<string, {
  tagline: string;
  beats: Record<FilmBeatKey, string>;
  metric: { value: string; label: string };
  video?: string;
  videoPoster?: string;
  segments?: Record<FilmBeatKey, [number, number]>;
}> = {
  "007": {
    video: "/motion/intentseal.mp4",
    videoPoster: "/motion/intentseal-poster.webp",
    segments: { problem: [0, 2.45], decision: [2.5, 4.95], tradeoff: [5, 7.45], outcome: [7.5, 9.95] },
    tagline: "A prompt-injection firewall for AI agents",
    beats: {
      problem: "Agents read untrusted files, pages and messages, then act with real permissions. Flagging suspicious text cannot stop an action the user never authorised.",
      decision: "Separate detection from authority. A deterministic guard checks every tool call against the user's versioned intent contract, even when detection misses.",
      tradeoff: "Recall is strong on third-party content (99.2%) but weaker on direct turns (68.1%), with 5.1% false positives on hard benign cases. All of it published.",
      outcome: "With detectors switched off, 0 of 28 reference-agent attacks succeeded. Shipped as a Python SDK, REST API and compatible LLM proxy.",
    },
    metric: { value: "99.2%", label: "third-party-content recall, 359 attacks" },
  },
  "010": {
    video: "/motion/assever.mp4",
    videoPoster: "/motion/assever-poster.webp",
    segments: { problem: [0, 2.45], decision: [2.5, 4.95], tradeoff: [5, 7.45], outcome: [7.5, 9.95] },
    tagline: "Purchase integrity for AI agents on India's payment rails",
    beats: {
      problem: "Two ₹700 baskets fit inside a ₹1,500 cap even when the owner approved one. A seller's message can redirect an agent without breaking any limit.",
      decision: "Ask a different question from a budget guard: is this exactly the purchase the person approved? Approve once; every proposal maps back to that one demand.",
      tradeoff: "Stricter than a budget guard, and unknown provider outcomes are held, never retried, so some tasks wait for reconciliation instead of finishing fast.",
      outcome: "On the deployed system: 0/144 unsafe purchases vs 36/144 for a budget-only guard, while completing more tasks (126 vs 92). Our own suite, stated as such.",
    },
    metric: { value: "0/144", label: "unsafe purchases on the deployed system" },
  },
  "011": {
    video: "/motion/tasleem.mp4",
    videoPoster: "/motion/tasleem-poster.webp",
    segments: { problem: [0, 2.45], decision: [2.5, 4.95], tradeoff: [5, 7.45], outcome: [7.5, 9.95] },
    tagline: "Know whether follow-up care actually happened",
    beats: {
      problem: "A referral can say Completed while the colonoscopy never happened. Status systems record paperwork, not care, so incomplete journeys look finished.",
      decision: "Keep the case open until the evidence exists, always with a named clinician as owner. Deterministic rules decide; AI only extracts evidence for human review.",
      tradeoff: "More alerts: 53.5 first alerts per 100 patients vs 38.5 for a status-only monitor. Catching gaps costs clinician attention, and that cost is published.",
      outcome: "On 2,000 synthetic journeys: 99.9% of action-needed cases reached a named human (vs 81.8%), and 0 incomplete journeys were counted as done (vs 160).",
    },
    metric: { value: "99.9%", label: "of action-needed journeys reached a named human" },
  },
  "008": {
    video: "/motion/abide.mp4",
    videoPoster: "/motion/abide-poster.webp",
    segments: { problem: [0, 2.45], decision: [2.5, 4.95], tradeoff: [5, 7.45], outcome: [7.5, 9.95] },
    tagline: "A permission checkpoint for delegated AI work",
    beats: {
      problem: "Content filters miss ordinary-looking malicious instructions, and approving every agent step by hand creates approval fatigue.",
      decision: "Turn the employee's request into a grounded work order they confirm once. A deterministic gate checks every action against it; agents can never approve themselves.",
      tradeoff: "A +166 ms median overhead per workflow, and approvals bind to one exact action, so genuine exceptions still need a person.",
      outcome: "0/28 attacks caused an unauthorised action, 26/26 normal tasks completed and 0/126 authorised calls were falsely blocked. Live on Google Cloud.",
    },
    metric: { value: "0/28", label: "attacks caused an unauthorised action" },
  },
  "009": {
    video: "/motion/caseproof.mp4",
    videoPoster: "/motion/caseproof-poster.webp",
    segments: { problem: [0, 2.45], decision: [2.5, 4.95], tradeoff: [5, 7.45], outcome: [7.5, 9.95] },
    tagline: "A first-hour workspace for payment-scam analysts",
    beats: {
      problem: "In the first hour after a scam, analysts reconcile receipts, chats, statements and bank records. An unexplained AI summary cannot show which payment is disputed.",
      decision: "Keep the provenance of every piece of evidence. Gemini helps interpret documents; deterministic rules own money allocation, urgency and readiness.",
      tradeoff: "Approval is bound to the case revision, so any new evidence forces a fresh review. Slower, but a report never ships on stale sign-off.",
      outcome: "51 public-cloud browser checks passed, across customer, analyst and reviewer journeys. A synthetic staging prototype, stated as such.",
    },
    metric: { value: "51", label: "public-cloud browser checks passed" },
  },
};

// Projects kept in the data (Helios can still discuss them) but not shown in
// the Work section's project wall.
export const hiddenFromIndex = ["005", "006"];

// ── PROOF LINE per indexed project ────────────────────────
// The one number a reviewer reads in the 10-second scan of the project index.
// Each line restates a fact already in that project's highlights or results.
export const projectProof: Record<string, string> = {
  "008": "0/28 attacks · 26/26 tasks · 0.38 questions per task",
  "009": "Approval bound to one case revision · 51 cloud checks",
  "001": "132 automated tests · 6-provider fallback",
  "002": "0 fabricated citations, enforced in CI",
  "003": "Schema compliance 25% → 99%",
  "004": "Fully offline · $0 API cost",
  "005": "Schema-only to the LLM · 3-layer SQL guard",
  "006": "5-provider router · $0 paid API",
  "012": "Message reading 25/30 vs keyword 15/30",
  "013": "3 verified · 1 rejected · 1 inconclusive",
  "015": "0/5 → 5/5 tests · 20/20 audit",
};

// ── PRODUCT MAP (the Graph button's default view) ─────────
// The work as a map: territories are problem domains, cities are projects,
// routes are the relationships already recorded in `graphLinks` between two
// projects (plus `mapExtraRoutes`, each sourced from a project's own text).
// Coordinates are in a 1000 × 620 viewBox.
export const mapTerritories: { id: string; name: string; blurb: string; path: string; label: [number, number]; projects: { id: string; at: [number, number] }[] }[] = [
  {
    id: "trust", name: "Trust & safety", blurb: "Keeping agents inside what a person authorised.",
    path: "M70 120 C 140 60, 330 50, 400 110 C 450 160, 430 260, 360 300 C 280 340, 130 320, 80 260 C 40 210, 40 160, 70 120 Z",
    label: [96, 108], projects: [{ id: "007", at: [160, 190] }, { id: "008", at: [300, 225] }, { id: "010", at: [230, 280] }],
  },
  {
    id: "agents", name: "Agents & research", blurb: "Multi-agent systems that plan, check and repair their own work.",
    path: "M520 70 C 620 30, 820 40, 900 110 C 960 170, 930 270, 840 300 C 740 330, 590 310, 530 250 C 480 200, 470 110, 520 70 Z",
    label: [560, 78], projects: [{ id: "001", at: [640, 160] }, { id: "002", at: [790, 220] }, { id: "013", at: [700, 260] }, { id: "015", at: [830, 150] }],
  },
  {
    id: "platform", name: "LLM platform", blurb: "The infrastructure under the products: fine-tuning, local models, tooling.",
    path: "M540 360 C 640 330, 840 340, 910 410 C 960 470, 920 560, 820 580 C 700 600, 570 580, 530 510 C 500 460, 490 390, 540 360 Z",
    label: [570, 378], projects: [{ id: "003", at: [630, 450] }, { id: "004", at: [780, 430] }, { id: "005", at: [720, 530] }],
  },
  {
    id: "product", name: "Product & finance", blurb: "Workflows for real users with real money at stake.",
    path: "M80 380 C 160 340, 360 345, 420 400 C 470 450, 450 540, 370 575 C 280 610, 140 590, 90 530 C 50 480, 40 420, 80 380 Z",
    label: [104, 396], projects: [{ id: "009", at: [170, 460] }, { id: "006", at: [330, 500] }, { id: "011", at: [262, 452] }, { id: "012", at: [200, 540] }],
  },
];
export const mapExtraRoutes: { from: string; to: string; note: string }[] = [
  { from: "007", to: "008", note: "Abide builds on IntentSeal's security foundations with an employee-facing delegation experience." },
  { from: "008", to: "010", note: "Assever applies the approve-once checkpoint idea to purchases on Indian commerce and payment rails." },
];

// ── AI RADAR ───────────────────────────────────────────────
// The labs and companies Sankalp follows. `query` goes into ONE combined
// Google News search (SerpAPI) per 12 h; `match` tags each headline to an
// entity (lower-case substrings of title + source). `angle` places the entity
// on the radar dial (degrees, 0 = top, clockwise).
export const radarWatchlist: { name: string; query: string; match: string[]; angle: number }[] = [
  { name: "OpenAI", query: "OpenAI", match: ["openai", "chatgpt", "sam altman"], angle: 0 },
  { name: "Anthropic", query: "Anthropic", match: ["anthropic", "claude"], angle: 40 },
  { name: "Google DeepMind", query: "Google DeepMind", match: ["deepmind", "gemini", "google ai"], angle: 80 },
  { name: "Meta AI", query: "Meta AI", match: ["meta ai", "llama"], angle: 120 },
  { name: "NVIDIA", query: "NVIDIA AI", match: ["nvidia"], angle: 160 },
  { name: "Microsoft", query: "Microsoft AI", match: ["microsoft", "copilot"], angle: 200 },
  { name: "Mistral AI", query: "Mistral AI", match: ["mistral"], angle: 240 },
  { name: "Hugging Face", query: "Hugging Face", match: ["hugging face", "huggingface"], angle: 280 },
  { name: "Perplexity", query: "Perplexity AI", match: ["perplexity"], angle: 320 },
];

// Deterministic "related to my work" links (keyword → project). Kept in code,
// not left to the LLM, so a link is never hallucinated. First match wins.
export const radarProjectLinks: { projectId: string; keywords: string[] }[] = [
  { projectId: "007", keywords: ["prompt injection", "jailbreak", "security", "attack", "vulnerab"] },
  { projectId: "008", keywords: ["agent", "agentic", "mcp", "computer use", "operator", "autonomous"] },
  { projectId: "009", keywords: ["fraud", "payment", "bank", "scam", "fintech"] },
  { projectId: "002", keywords: ["research", "benchmark", "eval", "hallucinat", "reasoning"] },
  { projectId: "003", keywords: ["fine-tun", "fine tun", "small model", "distill", "open-weight", "open weight"] },
  { projectId: "004", keywords: ["local model", "on-device", "ollama", "llama"] },
];

// ── PROOF METRICS (hero proof strip) ──────────────────────
// Every number is restated from a record above, with its source named, so a
// reviewer can trace it. Do not add a metric that has no source here.
export const proofMetrics: { value: string; label: string; source: string }[] = [
  { value: "90%", label: "less manual data entry from a PDF-extraction pipeline across 50+ layouts", source: "FIS Global · 2022–2025" },
  { value: "2nd", label: "nationally with IntentSeal, the agent-security firewall, judged by The Economic Times and Accenture", source: "ET AI Hackathon: Agentic Edition · 2026" },
  { value: "7th", label: "of 3,062 finalists (35,712 registrants), building an AI purchase-decision agent in 24 hours", source: "HackerRank Orchestrate · Sep 2026" },
  { value: "99.2%", label: "recall on 359 third-party-content prompt-injection attacks", source: "IntentSeal · published evaluation" },
];

// ── PRODUCT DECISIONS (the rotating "How I decide" tile) ───
// Each entry is lifted from a case study or project breakdown above: the call,
// why it was made, and what it cost. The cost is the point: a decision with no
// stated trade-off is not included.
export const productDecisions: {
  id: string;
  theme: string;
  project: string;
  decision: string;
  why: string;
  cost: string;
}[] = [
  {
    id: "d1",
    theme: "Activation",
    project: "ArthRakshak AI",
    decision: "Removed the signup wall. First value before first login.",
    why: "Journey mapping after 10 JTBD interviews showed sign-up-first onboarding broke trust; for informal earners it was the single largest drop-off point.",
    cost: "Stateless demo sessions made the engineering harder.",
  },
  {
    id: "d2",
    theme: "AI safety",
    project: "ArthRakshak AI",
    decision: "Every message passes a 5-class intent gate before it reaches the model.",
    why: "Off-topic and regulated-advice questions are blocked upstream, so the tutor cannot hallucinate financial advice.",
    cost: "Added latency to every answer. We treated the guardrail as non-negotiable.",
  },
  {
    id: "d3",
    theme: "Trust",
    project: "ArthRakshak AI",
    decision: "Process financial data for the session only. Store nothing.",
    why: "Full DPDP Act 2023 compliance from Sprint 0, for a segment scarred by data misuse.",
    cost: "No historical trend analysis in V1.",
  },
  {
    id: "d4",
    theme: "Scope",
    project: "ArthRakshak AI",
    decision: "Shipped rules-based credit parsing, with an honesty notice, instead of the AI engine.",
    why: "The AI transaction-categorisation engine did not pass internal testing. Overpromising would break trust.",
    cost: "Pushed the B2B revenue plan back.",
  },
  {
    id: "d5",
    theme: "Business model",
    project: "ArthRakshak AI",
    decision: "No commissions, ads or lender referrals.",
    why: "Keeps the product's incentives permanently aligned with the user it sometimes tells not to borrow.",
    cost: "Closed off the easiest fintech revenue model.",
  },
  {
    id: "d6",
    theme: "Permissions",
    project: "Abide",
    decision: "Agent credentials can never confirm, widen or approve their own permissions.",
    why: "A detector asks whether content looks dangerous; a delegation gate asks whether a person authorised the action.",
    cost: "+166 ms median overhead per workflow.",
  },
  {
    id: "d7",
    theme: "Honesty",
    project: "IntentSeal",
    decision: "Published the evaluation with its failures, not just the headline recall.",
    why: "Detection quality and action safety are different claims; reviewers need both to trust either.",
    cost: "On record: 0 of 9 attack categories met the joint recall and false-positive target.",
  },
];

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
  stat?: { value: string; label: string }; // one number from the study, counted up on the card
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
      "Built a volatility-aware financial risk platform for 500M informal-income Indians. The product answers one question: given my actual irregular income, is this loan safe? As research, UX and engineering lead in a cross-functional team of 6: reframed it from investment advice to a pre-loan safety check after 10 JTBD interviews, then took it to a 50-user pilot with gig workers and kirana owners after 8 sprints.",
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
        "Discovery: 10 JTBD interviews with gig workers, kirana owners and daily-wage earners, plus 10 listening sources, distilled into 3 personas, reframed the product from investment advice to a pre-loan safety check. Launched a 50-user pilot with gig and kirana users after 8 two-week sprints; the 7-language AI tutor was moved to Sprint 3 to de-risk it early and passed a 10/10 safety rubric. A 5-dimension trust test found the product more accurate but less trusted than Kuber AI (5/10 vs 6/10); a 2-channel experiment then led to a WhatsApp-first launch plan with a scam-alert referral loop. Shipped a functional 6-module MVP on Next.js/Vercel in 8 sprints (65 story points). Core features live: multilingual AI Tutor (7 Indian languages), Loan Safety Checker with true APR and RBI verification, Cash Flow Risk Radar with volatility engine, Financial Calculators, Daily Quiz, and Dashboard. Figma prototype with connected navigation flows. Full PRD, project plan, ethical framework, launch strategy, customer service architecture, and brand system delivered. Honest limitation: the AI-powered Credit Profile transaction engine remains in refinement — V1 uses rules-based parsing with transparent user disclosure.",
    },
    stat: { value: "50", label: "-user pilot, after 10 JTBD interviews" },
  },
  {
    id: "CS-002",
    title: "LinguaLearn: one growth bet for the board",
    company: "LinguaLearn (course case, fictional company)",
    year: "2026",
    summary:
      "Four executives, four growth bets, capacity for one. I recommended fixing the core experience for career-motivated learners, and showed the most persuasive number in the room was probably a mix effect.",
    tags: ["Product strategy", "Unit economics", "Experiment design", "EdTech"],
    externalUrl: "https://app.notion.com/p/LinguaLearn-A-Product-Strategy-Case-Study-42087cf3bb3c81e2b651f37934535ca0",
    stat: { value: "93%", label: "of 10,000 re-weightings kept the same ranking" },
    study: {
      context:
        "A Bengaluru learning app (fictional, from a course brief) with 4.1M registered users and $24.5M revenue. Engineering was at capacity and investors had moved from rewarding growth to rewarding capital discipline. Role played: senior PM advising the CEO before a board meeting.",
      problem:
        "The board could fund one of four bets: employability services, institutional partnerships, core experience, or regional expansion. Each sponsor had real data behind their option, and the brief said the data clarifies assumptions rather than removing uncertainty.",
      users:
        "Segment economics from the case tables: working professionals are 25% of users, about 33% of revenue and about 43% of estimated lifetime value. Students are the largest group (42%) but buy on price and retain worst.",
      hypothesis:
        "Growth is masking weaker engagement (revenue growth fell from 217% to 56%; active share from 32% to 28%), so retention for career-motivated learners is worth more than another acquisition-led bet.",
      decisions: [
        "Tested the strongest-looking evidence first: the interview-prep revenue premium. Segment mix alone predicts a $2.44 gap against $2.40 observed; even under much weaker assumptions mix explains two-thirds or more. The number was real but couldn't show causation.",
        "Priced the CPO's claim instead of dismissing it: five points of premium retention adds about $0.9M in year one and over $3M a year later, equal to roughly 564k new registered users. Told the board both the year-one and long-run numbers.",
        "Preferred the reversible bet: a retention investment can be undone; enterprise contracts and new-language content cannot.",
        "Made the scoring judgement explicit, then stress-tested it: the ranking held in 93% of 10,000 random re-weightings.",
      ],
      metrics: [
        "North Star — weekly active learners completing 3+ lessons",
        "Inputs — % of new users reaching 10 lessons in month one; D30 retention",
        "Guardrails — notification opt-outs, uninstalls, lesson ratings, refund requests; no streak dark patterns",
        "Kill criterion — if month-one lessons rise but D30 and 6-month retention don't move in two quarters, stop and re-diagnose churn",
      ],
      outcome:
        "Recommended prioritising core experience for career-motivated learners, with cheap experiments (a career-track matched test, a pricing test, one institutional pilot) deciding whether employability earns the next cycle. My gut pick before the analysis was employability; the mix-shift test changed my mind.",
    },
  },
  {
    id: "CS-003",
    title: "NovaAssist: choosing the next enterprise AI bet",
    company: "NovaAssist (PwC case brief)",
    year: "2026",
    summary:
      "One flagship AI initiative, four executive sponsors, each with a positive pilot. I recommended governed workflow agents, with grounded retrieval and governance built in rather than funded separately.",
    tags: ["AI product strategy", "Agents", "Enterprise SaaS", "Evals"],
    externalUrl: "https://app.notion.com/p/NovaAssist-Case-Study-Choosing-the-Next-Generation-of-Enterprise-AI-42087cf3bb3c810da026ddfafcd890b8",
    stat: { value: "80%", label: "of workflow time is outside search" },
    study: {
      context:
        "NovaAssist (case brief): US$190M ARR, 4,800 enterprise customers, 3.2M users, able to fund one flagship AI initiative: Knowledge Copilot (RAG), Autonomous Workflow Agents, an AI Platform for Enterprises, or Responsible Enterprise AI.",
      problem:
        "ARR per customer has been flat at about $40K for five years ($41.6K to $39.6K), so the existing AI features are not earning revenue. Growth slowed to 17.3%, about half the market's >35% CAGR, while infrastructure cost rose 38%.",
      users:
        "Search is only 20% of workflow time; the other 80% is approvals, data entry, follow-ups and coordination. Launch segment chosen: Process Optimizers (tech and manufacturing).",
      hypothesis:
        "Value sits in the 80% of work that isn't search, so the flagship should be governed workflow agents, not another copilot.",
      decisions: [
        "Fund Governed Workflow Agents as the flagship; build grounded retrieval (from the Copilot) and governance controls (from Responsible AI) into it.",
        "Discounted the Copilot pilot: its customers were stronger than average (31% verification baseline vs 41% across all users).",
        "Launch with three workflows: customer service, HR scheduling and procurement requests. The configurable platform follows in Year 3.",
      ],
      metrics: [
        "Metrics and evals defined per workflow, with assumptions, risks and a research plan written up as separate steps of the case",
      ],
      outcome:
        "A nine-step strategy workspace (frame, data, market, options, decision, metrics and evals, risks, AI-PM workflow, interview story) plus an 11-frame Miro board.",
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
    `${projects.length} engineering projects — ${projects.map((project) => project.name).join(", ")}. Recent work: IntentSeal (prompt-injection firewall), Abide (permission-bound delegation) and CaseProof (synthetic payment-scam investigation prototype). Each card opens a technical breakdown. Competition work is listed separately under Achievements.`,
  achievements:
    achievements.map((achievement) => `${achievement.project}: ${achievement.title} at ${achievement.event}, ${achievement.date}. ${achievement.description} ${achievement.approach} Source: ${achievement.github}`).join("\n"),
  contact: `Reach Sankalp at ${personal.email} or connect on LinkedIn.`,
  salary: "Open to discussion based on role and scope — best discussed directly with Sankalp.",
  remote: personal.workPreference + ".",
  stack:
    "Primary: Python, LangGraph, FastAPI, Qdrant, Docker. Secondary: Next.js, TypeScript, PostgreSQL, Redis, MLflow.",
};

