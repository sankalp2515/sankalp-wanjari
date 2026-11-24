// AI Radar — server side.
//
// Cost and freshness policy (the owner's rule: hit the API only because a
// person is on the portfolio, never on a schedule):
//   1. The browser asks for the radar only when its section nears the viewport
//      (components/v2/RadarSection.tsx), so a visitor who leaves from the hero
//      triggers nothing.
//   2. Here, the whole build (one SerpAPI Google News query + one batched LLM
//      annotation) is wrapped in Next's data cache for RADAR_TTL. Every visitor
//      in that window shares one result; the first request after it expires
//      rebuilds it. No cron, no warm-up job. Worst case ~2 SerpAPI calls a day.
//   3. Any failure degrades: no key / quota / network → status "unavailable",
//      LLM failure → items without the "so what" line. Never invented news.

import { unstable_cache } from "next/cache";
import { getKeys } from "@/lib/llm/keys";
import { logEvent, logWarn } from "@/lib/log";
import { radarWatchlist, radarProjectLinks, projects } from "@/config/portfolio";

export const RADAR_TTL = 12 * 60 * 60; // seconds

export interface RadarItem {
  id: string;
  title: string;
  link: string;
  source: string;
  date: string | null; // ISO
  entity: string | null;
  soWhat?: string;
  related?: { id: string; name: string };
}

export interface RadarPayload {
  status: "live" | "unavailable";
  updatedAt: string;
  items: RadarItem[];
  reason?: string;
}

interface SerpNews {
  title?: string;
  link?: string;
  source?: { name?: string } | string;
  date?: string;
  iso_date?: string;
  stories?: SerpNews[];
  highlight?: SerpNews;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

function toIso(n: SerpNews): string | null {
  const raw = n.iso_date || n.date;
  if (!raw) return null;
  // SerpAPI google_news dates look like "11/20/2026, 08:00 AM, +0000 UTC".
  const cleaned = raw.replace(/, \+0000 UTC$/, " UTC").replace(/,(?=\s\d{1,2}:)/, "");
  const d = new Date(cleaned);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function entityFor(text: string): string | null {
  const t = text.toLowerCase();
  for (const e of radarWatchlist) {
    if (e.match.some((m) => t.includes(m))) return e.name;
  }
  return null;
}

function relatedFor(text: string): RadarItem["related"] {
  const t = text.toLowerCase();
  for (const r of radarProjectLinks) {
    if (r.keywords.some((k) => t.includes(k))) {
      const p = projects.find((x) => x.id === r.projectId);
      if (p) return { id: p.id, name: p.name };
    }
  }
  return undefined;
}

async function fetchNews(): Promise<RadarItem[]> {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) throw new Error("SERPAPI_API_KEY not set");
  const q = `${radarWatchlist.map((e) => (e.query.includes(" ") ? `"${e.query}"` : e.query)).join(" OR ")} when:7d`;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_news");
  url.searchParams.set("q", q);
  url.searchParams.set("gl", "us");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", key);
  const t0 = Date.now();
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
  logEvent("radar.serpapi", { status: res.status, ms: Date.now() - t0 });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  const data = (await res.json()) as { news_results?: SerpNews[]; error?: string };
  if (data.error) throw new Error(`SerpAPI: ${data.error}`);

  const flat: SerpNews[] = [];
  for (const n of data.news_results ?? []) {
    if (n.stories?.length) flat.push(...n.stories);
    else if (n.highlight) flat.push(n.highlight, ...(n.stories ?? []));
    else flat.push(n);
  }

  const seen = new Set<string>();
  const items: RadarItem[] = [];
  for (const n of flat) {
    if (!n.title || !n.link) continue;
    const k = norm(n.title).slice(0, 80);
    if (seen.has(k)) continue;
    seen.add(k);
    const source = typeof n.source === "string" ? n.source : n.source?.name ?? "";
    const entity = entityFor(`${n.title} ${source}`);
    if (!entity) continue; // keep the feed on the watchlist
    items.push({
      id: k.slice(0, 40).replace(/ /g, "-"),
      title: n.title,
      link: n.link,
      source,
      date: toIso(n),
      entity,
      related: relatedFor(n.title),
    });
  }
  items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  // At most 3 per entity so one lab's news cycle can't flood the radar.
  const perEntity = new Map<string, number>();
  return items.filter((it) => {
    const c = perEntity.get(it.entity!) ?? 0;
    perEntity.set(it.entity!, c + 1);
    return c < 4;
  }).slice(0, 24);
}

// One batched call: keep only headlines that matter to people building AI
// products (drops stock sales, lawsuits, gossip), and write a <= 24-word
// product implication for each kept one. Groq first, rotating its keys; on
// failure every item is kept without a note.
const GROQ_MODEL = "openai/gpt-oss-120b";
async function annotate(items: RadarItem[]): Promise<RadarItem[]> {
  const keys = getKeys("GROQ_API_KEY");
  if (!keys.length || !items.length) return items;
  const list = items.map((it, i) => `${i + 1}. [${it.entity}] ${it.title}`).join("\n");
  const body = {
    model: GROQ_MODEL,
    temperature: 0.3,
    max_tokens: 2200,
    reasoning_effort: "low",
    include_reasoning: false,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior AI product manager curating news for other product managers. For each numbered headline decide keep=true only if it changes how teams build, ship, price, secure or evaluate AI products (models, capabilities, platforms, policy, safety, pricing). keep=false for stock sales, lawsuits about individuals, gossip, hiring and generic marketing. For kept items write note: ONE plain sentence (max 24 words) on the decision, risk, cost or opportunity it creates for product teams. Use only what the headline states. No hype words, no emojis, no em dashes. Reply as JSON: {\"items\":[{\"n\":1,\"keep\":true,\"note\":\"...\"}]} covering every number.",
      },
      { role: "user", content: list },
    ],
  };
  for (const key of keys) {
    try {
      const t0 = Date.now();
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
      logEvent("radar.annotate", { status: res.status, ms: Date.now() - t0, count: items.length });
      if (!res.ok) continue;
      const json = await res.json();
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as { items?: { n: number; keep?: boolean; note?: string }[] };
      const byN = new Map((parsed.items ?? []).map((x) => [x.n, x]));
      if (!byN.size) return items;
      const kept = items
        .map((it, i) => ({ it, a: byN.get(i + 1) }))
        .filter(({ a }) => a?.keep !== false)
        .map(({ it, a }) => ({ ...it, soWhat: a?.note?.trim() || undefined }));
      logEvent("radar.curated", { kept: kept.length, dropped: items.length - kept.length });
      return kept.length >= 3 ? kept : items;
    } catch (err) {
      logWarn("radar.annotate_failed", { error: (err as Error).message });
    }
  }
  return items;
}

async function build(): Promise<RadarPayload> {
  try {
    const items = await annotate(await fetchNews());
    return { status: items.length ? "live" : "unavailable", updatedAt: new Date().toISOString(), items, reason: items.length ? undefined : "No watchlist news this week" };
  } catch (err) {
    logWarn("radar.build_failed", { error: (err as Error).message });
    // Thrown, so the failure is NOT cached for 12 hours; the route degrades.
    throw err;
  }
}

export const getRadar = unstable_cache(build, ["ai-radar-v2"], { revalidate: RADAR_TTL, tags: ["ai-radar"] });
