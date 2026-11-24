// ── /api/radar — the AI Radar feed ────────────────────────────
// Called by the browser only when the Radar section nears the viewport.
// The heavy work (SerpAPI + LLM annotation) is cached for 12 h in lib/radar.ts,
// so this route is cheap to call; the per-IP limit only guards abuse.
// force-dynamic: nothing runs at build time — the API is hit because a person
// is on the portfolio, never by a deploy or a schedule.

import { NextRequest, NextResponse } from "next/server";
import { getRadar, RADAR_TTL } from "@/lib/radar";
import { getClientIP } from "@/lib/clientIP";
import { rateLimit } from "@/lib/rateStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  if (!(await rateLimit(`radar:${ip}`, 20, 60_000))) {
    return NextResponse.json({ status: "unavailable", reason: "Too many requests", items: [], updatedAt: new Date().toISOString() }, { status: 429 });
  }
  try {
    const data = await getRadar();
    return NextResponse.json(data, {
      headers: { "Cache-Control": `public, s-maxage=1800, stale-while-revalidate=${RADAR_TTL}` },
    });
  } catch {
    return NextResponse.json(
      { status: "unavailable", reason: "The live feed is resting. Try again later.", items: [], updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
