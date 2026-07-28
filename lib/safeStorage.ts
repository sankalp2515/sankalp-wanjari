// ── Safe storage ─────────────────────────────────────────────
// Brave (mobile Shields), Safari Private Mode, and locked-down enterprise
// browsers can make `sessionStorage`/`localStorage` *throw* on access — not
// just return null. An unguarded `sessionStorage.getItem(...)` in a boot path
// (e.g. the loader) then throws during render and the site never paints.
//
// These wrappers never throw. If the real Storage is unavailable they fall
// back to an in-memory Map for the lifetime of the page, so behaviour degrades
// (state won't persist across reloads) instead of breaking. Every failure is
// reported once via the logger so blocked storage is *visible* in telemetry.

import { logOnce } from "./log";

type Kind = "session" | "local";

const memory: Record<Kind, Map<string, string>> = {
  session: new Map(),
  local: new Map(),
};

function backing(kind: Kind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const s = kind === "session" ? window.sessionStorage : window.localStorage;
    // Access alone can throw in Brave/private mode; a probe write confirms it.
    const probe = "__probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    logOnce(`storage_blocked:${kind}`, "storage_blocked", { kind });
    return null;
  }
}

function make(kind: Kind) {
  return {
    get(key: string): string | null {
      const store = backing(kind);
      if (store) {
        try {
          return store.getItem(key);
        } catch {
          logOnce(`storage_blocked:${kind}`, "storage_blocked", { kind });
        }
      }
      return memory[kind].get(key) ?? null;
    },
    set(key: string, value: string): void {
      const store = backing(kind);
      if (store) {
        try {
          store.setItem(key, value);
          return;
        } catch {
          logOnce(`storage_blocked:${kind}`, "storage_blocked", { kind });
        }
      }
      memory[kind].set(key, value);
    },
    remove(key: string): void {
      const store = backing(kind);
      if (store) {
        try {
          store.removeItem(key);
        } catch {
          /* fall through to memory */
        }
      }
      memory[kind].delete(key);
    },
  };
}

export const safeSession = make("session");
export const safeLocal = make("local");
