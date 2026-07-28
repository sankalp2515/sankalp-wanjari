// ── Vercel AI Gateway (optional, opt-in via env) ─────────────
// When AI_GATEWAY_API_KEY is set, every OpenAI-compatible provider call is
// routed THROUGH the Vercel AI Gateway instead of the provider's native
// endpoint. You get ONE dashboard for tokens / cost / latency / errors across
// all providers, without giving up our own orchestrator + failover (this app
// still decides the order and the fallback; the gateway is just the transport).
//
// The gateway is a transparent OpenAI-compatible proxy, so nothing else in the
// request/response shape changes. Requests authenticate with the gateway key;
// each provider's own key stays configured as a BYOK credential in the Vercel
// dashboard. When AI_GATEWAY_API_KEY is ABSENT, calls go direct to the provider
// and behaviour is byte-identical to having no gateway — so this is safe to
// ship dark and switch on later.
//
// A provider is only gateway-routed if it declares a `gatewayModel` slug (the
// gateway's `creator/model` id). Providers without one (or that the gateway
// doesn't front) keep calling their native endpoint, even when the gateway is
// enabled — a mixed setup is fine.

export const GATEWAY_ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";

export function gatewayEnabled(): boolean {
  return !!process.env.AI_GATEWAY_API_KEY;
}
