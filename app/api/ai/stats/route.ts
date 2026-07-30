// ── /api/ai/stats — LLM usage counters ────────────────────────
// A read-only snapshot of how often each provider was hit and how it fared, so
// you can decide which providers to keep or drop next cycle. Counts are
// in-memory per serverless instance (see lib/llm/stats.ts caveats).
//
// Optional protection: set AI_STATS_TOKEN in the env and pass it as
// ?token=... (or the x-stats-token header) to gate access. If AI_STATS_TOKEN is
// unset, the endpoint is open (the data is aggregate, non-sensitive counts).

import { NextRequest, NextResponse } from "next/server";
import { snapshot } from "@/lib/llm/stats";

export const runtime = "nodejs"; // shares the in-memory stats with /api/ai
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const required = process.env.AI_STATS_TOKEN;
  if (required) {
    const provided = req.nextUrl.searchParams.get("token") ?? req.headers.get("x-stats-token");
    if (provided !== required) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  return NextResponse.json(snapshot(), { headers: { "Cache-Control": "no-store" } });
}
