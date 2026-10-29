import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { personal } from "../config/portfolio";

/** Walk directory entries instead of existsSync alone: Windows accepts the
 * wrong case, but Linux deployment URLs do not. */
export function validateResume(publicDir: string, url: string): string {
  if (!url.startsWith("/") || /[?#\\]/.test(url)) throw new Error("Resume must be a local public PDF URL without query or fragment.");
  const segments = decodeURIComponent(url.slice(1)).split("/");
  if (segments.some(segment => !segment || segment === "." || segment === "..")) throw new Error("Invalid resume path.");
  let directory = publicDir;
  for (const segment of segments) {
    const entries = readdirSync(directory);
    if (!entries.includes(segment)) {
      const actual = entries.find(entry => entry.toLowerCase() === segment.toLowerCase());
      throw new Error(actual ? `Resume case mismatch: URL uses "${segment}", disk contains "${actual}". Use a two-step git mv to record case-only renames.` : `Missing resume asset: ${url}`);
    }
    directory = join(directory, segment);
  }
  if (!url.endsWith(".pdf") || readFileSync(directory).subarray(0, 5).toString() !== "%PDF-") throw new Error("Resume must reference a valid .pdf asset.");
  return `public/${segments.join("/")}`;
}

export function validateTrackedResume(asset: string, trackedPaths: string[]): void {
  if (!trackedPaths.includes(asset)) {
    const actual = trackedPaths.find(path => path.toLowerCase() === asset.toLowerCase());
    throw new Error(actual ? `Git resume case mismatch: tracks "${actual}", URL requires "${asset}". Record the rename with git mv before deploying.` : `Resume asset is not tracked by Git: ${asset}`);
  }
}

export function checkResume(): void {
  const root = resolve(process.cwd());
  const asset = validateResume(join(root, "public"), personal.resumeUrl);
  // Deployment source bundles may omit .git. The exact on-disk check above
  // remains mandatory; locally, also catch unrecorded Windows case renames.
  if (existsSync(join(root, ".git"))) {
    const tracked = execFileSync("git", ["ls-files", "-z", "--", "public"], { cwd: root, encoding: "utf8" }).split("\0");
    validateTrackedResume(asset, tracked);
  }
  console.log(`Resume verified: ${personal.resumeUrl} (exact filename case and PDF header).`);
}

if (process.argv.includes("--check")) checkResume();
