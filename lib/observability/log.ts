// ── Structured logging & metrics (zero-dependency) ─────────────
// Emits one JSON object per line to stdout/stderr. Vercel captures every
// console line automatically and — because each line is valid JSON — its
// Observability/Logs view lets you filter and aggregate on any field below
// (event, route, outcome, provider, durationMs, tokens…) with no external
// service, no API key, and no runtime cost beyond a console call.
//
// Why not console.log with interpolated strings? Interpolated strings aren't
// queryable. `{"event":"ai.exhausted","route":"/api/ai"}` is. This is the
// whole difference between "we have logs" and "we have observability".

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  /** Stable machine name, e.g. "ai.request", "ai.provider", "contact.send". */
  event: string;
  route?: string;
  /** Correlates every line emitted while serving one request. */
  reqId?: string;
  /** "ok" | "failed" | "exhausted" | "rate_limited" | "guarded" … */
  outcome?: string;
  provider?: string;
  durationMs?: number;
  tokens?: number;
  status?: number;
  /** Anything else worth filtering on. Keep it flat and primitive. */
  [k: string]: unknown;
}

function emit(level: LogLevel, fields: LogFields) {
  const line = JSON.stringify({ level, ts: new Date().toISOString(), ...fields });
  // stderr for warn/error so platform log-levels line up; stdout otherwise.
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const log = {
  debug: (f: LogFields) => emit("debug", f),
  info: (f: LogFields) => emit("info", f),
  warn: (f: LogFields) => emit("warn", f),
  error: (f: LogFields) => emit("error", f),
};

/** Short, dependency-free correlation id for one request's log lines. */
export function newReqId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Times an async span and logs exactly one line for it (success or failure),
 * carrying duration and any extra fields. Returns the awaited value, or
 * rethrows after logging — so instrumenting a call never changes its behavior.
 */
export async function span<T>(
  fields: LogFields,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const value = await fn();
    log.info({ ...fields, durationMs: Date.now() - start, outcome: fields.outcome ?? "ok" });
    return value;
  } catch (err) {
    log.error({
      ...fields,
      durationMs: Date.now() - start,
      outcome: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
