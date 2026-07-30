// ── /api/faq — self-learning starter questions ───────────────
// Learns which topics visitors actually ask about and surfaces the most-asked
// as the concierge's starter chips. SAFE BY DESIGN: a POSTed question is
// classified into one of a FIXED set of canonical questions (deterministic
// keyword match) and only that canonical's counter is incremented. Raw visitor
// text is never stored, never returned, never surfaced — so there's no privacy
// or moderation exposure, and no way to inject arbitrary text into the UI.
//
// Persistence uses the same Upstash REST store as the rate limiter, with an
// in-memory fallback so local/unconfigured deploys still work (per-instance).

import { NextRequest, NextResponse } from "next/server";
import { getClientIP } from "@/lib/clientIP";
import { rateLimit } from "@/lib/rateStore";

export const runtime = "nodejs";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const HASH = "faq:counts";
const TOP_N = 4;

// The ONLY questions that can ever surface. Order here is the cold-start /
// tie-break order. `match` classifies an incoming question into one bucket.
const CANONICAL: { id: string; q: string; match: RegExp }[] = [
  { id: "best-work",       q: "What's his best work?",          match: /\b(best|proud|flagship|impressive|strongest|standout|favou?rite)\b/i },
  { id: "availability",    q: "When can he start?",             match: /\b(start|available|availability|notice|join|when|hire|hiring)\b/i },
  { id: "different",       q: "What makes him different?",      match: /\b(different|unique|stand ?out|why him|special|apart)\b/i },
  { id: "fit",             q: "Paste a JD for a fit check",     match: /\b(fit|match|job ?description|\bjd\b|suitable|right for|good for)\b/i },
  { id: "reliability",     q: "How does he make AI reliable?",  match: /\b(reliab|trust|hallucinat|eval|verif|production|robust|safe)\b/i },
  { id: "stack",           q: "What's his tech stack?",         match: /\b(stack|tech|tools?|languages?|frameworks?|libraries)\b/i },
  { id: "experience",      q: "What's his experience?",         match: /\b(experience|background|worked|fis|years|career|history)\b/i },
  { id: "research",        q: "Has he published research?",     match: /\b(research|papers?|publish|journal|academic)\b/i },
];

function classify(question: string): string | null {
  const q = question.trim().slice(0, 200);
  for (const c of CANONICAL) if (c.match.test(q)) return c.id;
  return null;
}

// ── In-memory fallback (per-instance) ──
const memCounts = new Map<string, number>();

function storeConfigured(): boolean {
  return !!(REST_URL && REST_TOKEN);
}

async function redis(cmd: (string | number)[]): Promise<unknown> {
  const res = await fetch(REST_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    signal: AbortSignal.timeout(3_000),
  });
  if (!res.ok) throw new Error(`upstash: HTTP ${res.status}`);
  return ((await res.json()) as { result?: unknown }).result;
}

async function bump(id: string): Promise<void> {
  if (!storeConfigured()) { memCounts.set(id, (memCounts.get(id) ?? 0) + 1); return; }
  try { await redis(["HINCRBY", HASH, id, 1]); }
  catch { memCounts.set(id, (memCounts.get(id) ?? 0) + 1); } // fail-open to memory
}

async function counts(): Promise<Record<string, number>> {
  if (storeConfigured()) {
    try {
      // HGETALL → flat [field, value, field, value, …]
      const flat = (await redis(["HGETALL", HASH])) as string[] | null;
      const out: Record<string, number> = {};
      if (Array.isArray(flat)) {
        for (let i = 0; i < flat.length; i += 2) out[flat[i]] = Number(flat[i + 1]) || 0;
      }
      return out;
    } catch { /* fall through to memory */ }
  }
  return Object.fromEntries(memCounts);
}

// GET → the top starter chips, most-asked first, cold-starting to CANONICAL order.
export async function GET(): Promise<NextResponse> {
  const c = await counts();
  const chips = CANONICAL
    .map((x, i) => ({ q: x.q, n: c[x.id] ?? 0, i }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, TOP_N)
    .map((x) => x.q);
  return NextResponse.json({ chips }, { headers: { "Cache-Control": "no-store" } });
}

// POST { question } → classify + increment. Returns nothing useful on purpose.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIP(req);
  // Light cap so nobody can hammer the counters. Over-limit = silently ignored.
  if (!(await rateLimit(`faq:${ip}`, 60, 3_600_000))) {
    return NextResponse.json({ ok: true });
  }
  let question = "";
  try { question = String(((await req.json()) as { question?: unknown }).question ?? ""); }
  catch { return NextResponse.json({ ok: true }); }

  const id = classify(question);
  if (id) await bump(id);
  return NextResponse.json({ ok: true });
}
