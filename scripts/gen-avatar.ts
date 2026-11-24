// ── Generate the hero avatar poses from Sankalp's own photo ─────────
// Gemini image editing (the user's own GEMINI_API_KEY[_N], free tier) turns
// public/profile_pic_2.png into an illustrated likeness in the site's identity,
// in two poses for the hero's walk-in: `walk` (mid-stride toward the viewer)
// and `greet` (arrived, relaxed, a small open-hand greeting). Backgrounds are
// then removed locally with `npx hyperframes remove-background`.
//
//   npx tsx scripts/gen-avatar.ts [walk|greet|all] [variant-count]
//
// Writes public/avatar/raw/<pose>-<n>.png — pick the best, then cut out.

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "avatar", "raw");
const MODEL = process.env.AVATAR_IMAGE_MODEL || "gemini-3.1-flash-image";

async function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const raw = await fs.readFile(path.join(ROOT, f), "utf8").catch(() => "");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
const keys = () => [process.env.GEMINI_API_KEY, ...[2, 3, 4, 5, 6, 7, 8].map((n) => process.env[`GEMINI_API_KEY_${n}`])].filter(Boolean) as string[];

// One identity across poses: same illustration language, same outfit.
const STYLE =
  "Create a full-body EDITORIAL ILLUSTRATION of exactly this person — keep his face, hairstyle, beard, skin tone and build recognisably the same. " +
  "Style: premium editorial magazine illustration, confident clean ink linework, flat warm colour fills with subtle soft shading, no photorealism, no 3D render, no cartoon exaggeration. " +
  "Outfit: the same navy suit, white open-collar shirt, dark trousers, clean dark shoes; one small amber (#F5A623) pocket-square as the only accent colour. " +
  "Framing: the whole body from head to shoes, centred, vertical 2:3 composition, generous empty space around him. " +
  "Background: perfectly plain flat off-white #F4F2EE, no floor line, no shadow, no props, no text.";

const POSES: Record<string, string> = {
  walk: "Pose: walking straight TOWARD the viewer, mid-stride, one foot forward, arms swinging naturally, slight friendly smile, eyes to camera.",
  greet: "Pose: standing still facing the viewer, weight relaxed, right hand raised at chest height in a small open-palm greeting, warm smile, eyes to camera.",
};

async function generate(pose: string, photoB64: string): Promise<Buffer> {
  let last = "";
  for (const key of keys()) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/png", data: photoB64 } }, { text: `${STYLE} ${POSES[pose]}` }] }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "2:3" } },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const json = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[]; error?: { message?: string } };
    const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
    if (res.ok && img) return Buffer.from(img, "base64");
    last = `${res.status} ${json.error?.message ?? "no image in response"}`;
    console.warn(`  ↷ key unusable for ${MODEL}: ${last.slice(0, 120)}`);
  }
  throw new Error(last);
}

async function main() {
  await loadEnv();
  if (!keys().length) throw new Error("No GEMINI_API_KEY set");
  const which = process.argv[2] ?? "all";
  const count = Number(process.argv[3] ?? 2);
  await fs.mkdir(OUT, { recursive: true });
  const photo = (await fs.readFile(path.join(ROOT, "public", "profile_pic_2.png"))).toString("base64");
  for (const pose of which === "all" ? Object.keys(POSES) : [which]) {
    for (let i = 1; i <= count; i++) {
      const buf = await generate(pose, photo);
      const file = path.join(OUT, `${pose}-${i}.png`);
      await fs.writeFile(file, buf);
      console.log(`  ✓ ${path.relative(ROOT, file)} (${Math.round(buf.length / 1024)} KB)`);
    }
  }
}

main().catch((e) => { console.error("✗", (e as Error).message); process.exit(1); });
