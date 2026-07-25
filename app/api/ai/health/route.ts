// ── /api/ai/health — the "are you back yet?" probe ────────────
// Zero tokens, zero provider calls. The client polls this while the dock is
// on reserve power so recovery is AUTOMATIC — the old build only noticed the
// models had returned if a visitor happened to ask again, which meant the
// dock could stay dark forever after a single rate-limit blip.

import { NextResponse } from "next/server";
import { PROVIDERS } from "@/lib/llm/providers";
import { isProviderHealthy } from "@/lib/llm/rateLimit";

export const runtime = "nodejs"; // shares the in-memory health Map with /api/ai
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  // Ollama needs no key, so it is ALWAYS in `configured` — which is why
  // "unconfigured" is decided by the keyed providers alone. Otherwise a
  // deployment with every key commented out would still claim to be
  // configured and promise a recovery that can never arrive.
  const keyed      = PROVIDERS.filter((p) => p.apiKeyEnv && !!process.env[p.apiKeyEnv]);
  const configured = PROVIDERS.filter((p) => !p.apiKeyEnv || !!process.env[p.apiKeyEnv]);
  const up = configured.filter((p) => isProviderHealthy(p.id));

  // Only `ok` + a coarse `reason` are exposed — raw provider counts are
  // recon value with no client use, so they stay server-side.
  return NextResponse.json(
    {
      ok: up.length > 0,
      reason: up.length > 0 ? "ok" : keyed.length === 0 ? "unconfigured" : "cooling",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
