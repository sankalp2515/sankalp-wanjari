# Adding content (projects, papers, skills, jobs)

**Everything is config-driven.** You edit one file — [`config/portfolio.ts`](../config/portfolio.ts) — and the whole site (cards, modals, AI concierge, knowledge graph, tour) updates. You never touch component code to change data.

---

## Will the layout break if I add more?

No — it's built to scale:

| Section | How it scales | Watch out for |
|---|---|---|
| **Projects** | 2-column grid; the **first** project is the full-width "featured" card, the rest flow 2-per-row (1 on mobile). Add as many as you like. | The featured card is always index 0 — put your strongest project **first**. Cards without a `preview` image and an id other than `001/002/003` fall back to a generic animated tile (still looks fine). |
| **Research** | Renders one card per entry. | — |
| **Career** | Vertical timeline, one node per job, sorted as listed (newest first). | Keep `date`/`endDate` accurate — the timeline and graph read them. |
| **Skills** | Chips grouped by `category` (`AI/ML` \| `Engineering` \| `Product`). Add a chip by adding an object. | The 3D constellation and graph clusters are by these 3 categories — new categories won't get their own cluster without a code change. |
| **Knowledge graph** | Projects, papers, and jobs auto-appear as nodes wired to their hub. | Cross-category relationships live in `graphLinks` (edit those to connect nodes). |

The only manual touch for a new project is an optional **preview image**: drop a file in `public/projects/` and set `preview: "/projects/yourfile.gif"`. Skip it and you get the default tile.

---

## Add a project — copy this prompt into any LLM

Paste the prompt below into Claude (or any LLM), fill the ISSUE, and it returns a ready-to-paste object. Then add it to the `projects` array in `config/portfolio.ts` (put your best one first).

```
You are generating ONE project entry for a TypeScript portfolio config. Output ONLY a
single JavaScript object literal (no imports, no markdown fences, no commentary) that
EXACTLY matches this shape and field order — every field is required:

{
  id: "004",                        // next sequential 3-digit string, unique
  name: "Human Project Title",
  shortName: "machine_slug",        // lowercase_snake, used for search matching
  description: "1–2 sentences, plain, concrete. What it is and why it matters.",
  longDescription: "3–5 sentences of technical depth for the overview modal.",
  stack: ["Tool", "Tool", "Tool"],  // real technologies, 4–6 items
  category: "Agentic Systems",      // free text; reused as a filter chip
  status: "DEPLOYED",               // one of: DEPLOYED | LIVE | IN PROGRESS | ARCHIVED
  impact: "CRITICAL",               // one of: CRITICAL | HIGH  (drives the badge colour)
  highlights: [                     // 4–6 punchy, metric-first bullets
    "Bullet with a number or a hard capability",
  ],
  github: "https://github.com/USER/REPO",  // real repo URL, or "" to hide the link
  liveUrl: "https://demo-url.com",         // live/demo URL, or "" to hide the link
  preview: "",                             // "/projects/x/demo.mp4" or an image, else ""
  poster: "",                              // optional still frame for the video preview
  year: "2025",
  breakdown: {   // technical breakdown — these are engineering projects, NOT case studies
    problem:  "The real problem, with stakes. 2–4 sentences.",
    approach: "How it was actually solved — architecture and key decisions. 3–5 sentences.",
    results: [ "Outcome bullet, evidence-first", "..." ],  // 4–6 items
    lessons:  "The non-obvious lesson learned. 2–3 sentences.",
    role:     "Your exact role and what you owned.",
  },
}

RULES:
- Only facts I give you below — invent nothing (no fake metrics, dates, or repos).
- Third-person-safe, professional, no emoji, no hype adjectives without evidence.
- Keep every string on one line (no line breaks inside strings).

PROJECT FACTS:
<paste the raw facts about your project here — what it does, the stack, the numbers,
the problem it solved, your role, links>
```

**After pasting the object into `projects`:** run `npx tsc --noEmit` — if a field is missing or misnamed, TypeScript tells you immediately. That's your safety net.

---

## Add an architecture / user-flow diagram

Diagrams are plain images (PNG or SVG exported from Figma, Excalidraw, draw.io…).
Keep them wide (~16:9) and readable — the modal frames them and adds click-to-zoom.

1. Drop the file in `public/`, e.g. `public/projects/automl/architecture.png`.
2. Fill the `diagrams` slot on that item (path is relative to `public/`, no `public` prefix):

```ts
// Engineering project → shows up as an "ARCHITECTURE" block in the breakdown
diagrams: [
  { src: "/projects/automl/architecture.png", label: "SYSTEM ARCHITECTURE",
    caption: "10 agents over a LangGraph state machine; sandboxed executor validates each stage.",
    alt: "Diagram of the AutoML agent pipeline" },
],
```

For a **product case study**, put the same shape under `study.flows` instead — it
renders as a "USER FLOW" block:

```ts
study: {
  ...,
  flows: [
    { src: "/case-studies/arthrakshak-flow.png", label: "LOAN SAFETY CHECK FLOW",
      caption: "Demo-mode entry → income input → volatility engine → safe-EMI verdict." },
  ],
}
```

You can list several diagrams per project/study — each is framed and individually
zoomable. Leave `diagrams: []` / omit `flows` when you have none.

## Add a case-study cover image

`cover` is the image shown at the top of the case-study card and as a hero inside
its modal. Drop the file in `public/case-studies/` and set `cover: "/case-studies/your-cover.png"`.
The **file extension must match exactly** — a wrong extension is why a cover shows
up blank. If the path is missing the card/modal just drops the image silently.

## Project previews (poster + video)

- `poster` = the still shown before hover (and the only thing touch users see).
- `preview` = an `.mp4`/`.webm` that streams **only on hover**, then rewinds.
- The Portfolio OS project uses `poster: "/opengraph-image"` — the site's own
  generated OG card — so it shows a branded still with no asset to add. To upgrade
  it, record a short clip of the concierge operating the page, save it as
  `public/projects/portfolio/demo.mp4`, and set `preview` to that path.

---

## Add a knowledge-graph relationship

Open `graphLinks` in `config/portfolio.ts`. Each entry connects two existing nodes:

```ts
{ from: "p-004", to: "sk-0", note: "why these connect" },
```

Node ids: `me`, hubs (`hub-work`, `hub-research`, `hub-career`, `hub-education`, `hub-skills`),
projects (`p-001`, `p-004`, …), papers (`paper-001`, …), jobs (`e-0` = newest, `e-1`, …),
`edu-degree`, `edu-cert`, skill clusters (`sk-0` AI/ML, `sk-1` Engineering, `sk-2` Product).
A link pointing at a node that doesn't exist is silently skipped — it can't break the graph.
