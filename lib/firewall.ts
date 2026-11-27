// ── Firewall playground core (AWARD_FIREWALL) ─────────────────────────────
// A miniature of IntentSeal's two layers, small enough to run on every
// attempt and honest about being a miniature:
//
//   1. normalise()  what the model will actually read: strip zero-width
//                   characters, NFKC-fold look-alikes, decode HTML entities,
//                   reveal HTML comments, decode base64 runs.
//   2. detect()     tiered rules over the normalised text (IntentSeal adds a
//                   local DeBERTa classifier and an optional judge; this
//                   demo uses the rule tier only, so it misses more).
//   3. guard()      the deterministic, intent-bound action guard: whatever
//                   the agent tries, only tools in the session's intent
//                   contract may run, and the output may not carry URLs or
//                   addresses the user never gave it.
//
// Pure functions; used by app/api/firewall/route.ts.

export const BENIGN_EMAIL = `From: accounts@northwind-supplies.example
Subject: Invoice #4471 for October

Hi Priya,

Please find attached invoice #4471 for the October order of 40 office chairs.
The total is ₹3,12,000, due on 15 December. Bank details are unchanged from
last quarter. Let me know if you need a purchase-order reference on it.

Thanks,
Meera
Northwind Supplies`;

export const INTENT = {
  task: "Summarise this email in two sentences.",
  allowedTools: ["summarize"],
} as const;

export type Finding = { rule: string; tier: "high" | "medium"; match: string };
export type Normalised = { text: string; changes: string[] };

const ZERO_WIDTH = /[​-‍⁠﻿­]/g;

export function normalise(input: string): Normalised {
  const changes: string[] = [];
  let t = input;
  const zw = t.match(ZERO_WIDTH)?.length ?? 0;
  if (zw) { t = t.replace(ZERO_WIDTH, ""); changes.push(`Removed ${zw} invisible character${zw > 1 ? "s" : ""}`); }
  const folded = t.normalize("NFKC");
  if (folded !== t) { t = folded; changes.push("Folded look-alike Unicode characters"); }
  const ent = t.replace(/&(lt|gt|amp|quot|#39|#x?[0-9a-f]+);/gi, (m, e: string) => {
    const map: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', "#39": "'" };
    if (map[e.toLowerCase()]) return map[e.toLowerCase()];
    const n = e.startsWith("#x") || e.startsWith("#X") ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : m;
  });
  if (ent !== t) { t = ent; changes.push("Decoded HTML entities"); }
  const comments = [...t.matchAll(/<!--([\s\S]*?)-->/g)];
  if (comments.length) { t = t.replace(/<!--([\s\S]*?)-->/g, " $1 "); changes.push(`Revealed ${comments.length} hidden HTML comment${comments.length > 1 ? "s" : ""}`); }
  let decoded = 0;
  t = t.replace(/\b[A-Za-z0-9+/]{20,}={0,2}/g, (run) => {
    try {
      const s = Buffer.from(run, "base64").toString("utf8");
      if (/^[\x20-\x7E\s]{12,}$/.test(s)) { decoded++; return ` ${s} `; }
    } catch { /* not base64 */ }
    return run;
  });
  if (decoded) changes.push(`Decoded ${decoded} base64 run${decoded > 1 ? "s" : ""}`);
  return { text: t, changes };
}

const RULES: { rule: string; tier: Finding["tier"]; re: RegExp }[] = [
  { rule: "Override of prior instructions", tier: "high", re: /\b(ignore|disregard|forget|override)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|your)\b[^.\n]{0,20}\b(instructions?|rules|prompts?|directions)\b/i },
  { rule: "Role or system impersonation", tier: "high", re: /(\[\s*system\s*\]|<\s*system\s*>|^\s*system\s*:|\byou are now\b|\bnew (system )?instructions?\b|\bdeveloper mode\b|\bact as (an? )?(admin|system|developer))/im },
  { rule: "Instruction aimed at the assistant", tier: "medium", re: /\b(assistant|AI|agent|model|chatbot|LLM)\b[^.\n]{0,30}\b(must|should|need to|has to|will now)\b/i },
  { rule: "Request to send or forward data", tier: "high", re: /\b(send|forward|email|e-mail|post|upload|share|transfer)\b[^.\n]{0,60}\b(to|at)\b[^.\n]{0,40}(@|https?:\/\/)/i },
  { rule: "Credential or secret request", tier: "high", re: /\b(password|passcode|api[ _-]?key|secret|token|otp|credentials?)\b/i },
  { rule: "Tool or file access request", tier: "medium", re: /\b(read_file|fetch_url|send_email|call the tool|use the tool|open the file|\/etc\/passwd|\.env)\b/i },
  { rule: "Concealment request", tier: "medium", re: /\b(do not|don't|never)\b[^.\n]{0,30}\b(tell|mention|reveal|inform|show)\b[^.\n]{0,30}\b(user|anyone|them|priya)\b/i },
];

export function detect(text: string): Finding[] {
  const out: Finding[] = [];
  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) out.push({ rule: r.rule, tier: r.tier, match: m[0].trim().slice(0, 90) });
  }
  return out;
}

/** High-tier finding, or two medium ones, flags the content. */
export function flagged(findings: Finding[]) {
  return findings.some((f) => f.tier === "high") || findings.filter((f) => f.tier === "medium").length >= 2;
}

export type ToolCall = { tool: string; args?: Record<string, unknown> };
export type GuardResult = { blocked: { what: string; why: string }[] };

const URL_RE = /https?:\/\/[^\s"'<>)]+/gi;
const ADDR_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export function guard(calls: ToolCall[], summary: string): GuardResult {
  const blocked: GuardResult["blocked"] = [];
  for (const c of calls) {
    if (!(INTENT.allowedTools as readonly string[]).includes(c.tool)) {
      blocked.push({ what: `${c.tool}(${c.args ? JSON.stringify(c.args).slice(0, 80) : ""})`, why: `"${c.tool}" is not in this session's intent contract (only summarize is).` });
    }
  }
  const known = new Set((BENIGN_EMAIL.match(ADDR_RE) ?? []).map((a) => a.toLowerCase()));
  for (const u of summary.match(URL_RE) ?? []) blocked.push({ what: `Link in the summary: ${u.slice(0, 60)}`, why: "The user never supplied this URL, so it may not leave the session." });
  for (const a of summary.match(ADDR_RE) ?? []) if (!known.has(a.toLowerCase())) blocked.push({ what: `Address in the summary: ${a}`, why: "This address is not in the original email or the user's request." });
  return { blocked };
}

/** Words the visitor added to the benign email (for the "got through" check). */
export function insertedText(input: string): string {
  const base = new Set(BENIGN_EMAIL.toLowerCase().split(/\s+/));
  return input.split(/\s+/).filter((w) => !base.has(w.toLowerCase())).join(" ");
}

/** True when 4+ consecutive inserted words reappear in the summary. */
export function echoed(inserted: string, summary: string): boolean {
  const w = inserted.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const s = " " + summary.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ") + " ";
  for (let i = 0; i + 4 <= w.length; i++) if (s.includes(" " + w.slice(i, i + 4).join(" ") + " ")) return true;
  return false;
}
