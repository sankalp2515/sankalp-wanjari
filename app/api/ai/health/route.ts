// ── /api/ai/health — the "are you back yet?" probe ────────────
// Zero tokens, zero provider calls. The client polls this while the dock is
// on reserve power so recovery is AUTOMATIC — the old build only noticed the
// models had returned if a visitor happened to ask again, which meant the
// dock could stay dark forever after a single rate-limit blip.

import { NextResponse } from "next/server";
import { PROVIDERS } from "@/lib/llm/providers";
import { isProviderHealthy } from "@/lib/llm/rateLimit";
import { getKeys } from "@/lib/llm/keys";

export const runtime = "nodejs"; // shares the in-memory health Map with /api/ai
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  // Every provider requires a key now — so "configured" is simply the providers
  // whose key is present. A deploy with all keys absent reports "unconfigured"
  // and never promises a recovery that can't arrive.
  const configured = PROVIDERS.filter((p) => getKeys(p.apiKeyEnv).length > 0);
  const up = configured.filter((p) => isProviderHealthy(p.id));

  // Only `ok` + a coarse `reason` are exposed — raw provider counts are
  // recon value with no client use, so they stay server-side.
  return NextResponse.json(
    {
      ok: up.length > 0,
      reason: up.length > 0 ? "ok" : configured.length === 0 ? "unconfigured" : "cooling",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
