"use client";

// Client side of the self-learning FAQ. `logQuestion` reports a real,
// visitor-typed question so the server can learn which topics matter (it only
// stores a classification, never the text — see app/api/faq/route.ts).
// `getTopChips` fetches the most-asked starter questions for the concierge.
//
// Both are best-effort: any failure is swallowed and the caller falls back to
// the static defaults, so the chat is never blocked on this.

export function logQuestion(text: string): void {
  const q = text.trim();
  if (!q || q.startsWith("/")) return; // skip empties and slash commands
  try {
    void fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q.slice(0, 200) }),
      keepalive: true, // may fire as the visitor navigates away
    });
  } catch { /* best-effort */ }
}

export async function getTopChips(): Promise<string[] | null> {
  try {
    const res = await fetch("/api/faq", { signal: AbortSignal.timeout(3_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { chips?: unknown };
    const chips = Array.isArray(data.chips) ? data.chips.filter((c): c is string => typeof c === "string") : [];
    return chips.length ? chips : null;
  } catch {
    return null;
  }
}
