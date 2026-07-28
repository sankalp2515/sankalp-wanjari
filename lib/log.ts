// ── Unified logging / telemetry ──────────────────────────────
// One helper so every meaningful action and decision is observable, in dev
// and in production, without scattering ad-hoc console.logs.
//
//   • On the CLIENT it (a) prints a structured line to the console (dev only,
//     or when ?debug=log is present) and (b) forwards the event to Vercel Web
//     Analytics as a custom event, so decisions like device-tier and hero-mode
//     show up in the dashboard next to page views.
//   • On the SERVER it prints ONE JSON line per event, which Vercel captures in
//     Runtime Logs — grep-able, no external service.
//
// Event payloads must be flat and primitive (string | number | boolean | null)
// to satisfy Vercel Analytics; nested objects are stringified defensively.

type Primitive = string | number | boolean | null | undefined;
export type LogData = Record<string, Primitive>;

export type LogLevel = "debug" | "info" | "warn" | "error";

const isServer = typeof window === "undefined";

// Verbose client console only in dev or when explicitly asked via ?debug=log —
// so production visitors never see internal chatter, but you can flip it on for
// a live debugging session by adding the query param.
function clientVerbose(): boolean {
  if (isServer) return true;
  if (process.env.NODE_ENV !== "production") return true;
  try {
    return new URLSearchParams(window.location.search).has("debug");
  } catch {
    return false;
  }
}

// Flatten to Analytics-safe primitives.
function flatten(data?: LogData): LogData {
  if (!data) return {};
  const out: LogData = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] =
      v === null || v === undefined || typeof v === "string" ||
      typeof v === "number" || typeof v === "boolean"
        ? v
        : JSON.stringify(v);
  }
  return out;
}

/**
 * Record a named event. `event` is a stable slug (e.g. "device_tier",
 * "hero_mode", "client_error", "api_request").
 */
export function logEvent(event: string, data?: LogData, level: LogLevel = "info"): void {
  const payload = flatten(data);

  if (isServer) {
    // One JSON line → Vercel Runtime Logs.
    const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...payload });
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
    return;
  }

  if (clientVerbose()) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[${event}]`, payload);
  }

  // Forward to Vercel Web Analytics (client only, best-effort, never throws).
  try {
    // Lazy import keeps this file usable on the server and in tests.
    import("@vercel/analytics").then(({ track }) => {
      try { track(event, payload); } catch { /* analytics disabled / blocked */ }
    }).catch(() => { /* package or network unavailable */ });
  } catch { /* noop */ }
}

export const logError = (event: string, data?: LogData) => logEvent(event, data, "error");
export const logWarn = (event: string, data?: LogData) => logEvent(event, data, "warn");

// Some conditions (blocked storage, a failing provider) can recur every frame
// or every request. `logOnce` de-dupes by key for the life of the page/process
// so telemetry shows the condition without flooding.
const seen = new Set<string>();
export function logOnce(key: string, event: string, data?: LogData, level: LogLevel = "warn"): void {
  if (seen.has(key)) return;
  seen.add(key);
  logEvent(event, data, level);
}

// Catch everything that would otherwise die silently: uncaught errors and
// rejected promises become `client_error` events. Idempotent.
let handlersInstalled = false;
export function installClientErrorHandlers(): void {
  if (isServer || handlersInstalled) return;
  handlersInstalled = true;
  window.addEventListener("error", (e) => {
    logError("client_error", {
      kind: "error",
      message: e.message,
      source: e.filename,
      line: e.lineno,
      col: e.colno,
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    logError("client_error", {
      kind: "unhandledrejection",
      message: reason instanceof Error ? reason.message : String(reason),
    });
  });
}
