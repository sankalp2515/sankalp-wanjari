import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateResume, validateTrackedResume } from "./check-resume";

function fixture(name: string, content: string, check: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), "portfolio-resume-test-"));
  try { writeFileSync(join(root, name), content); check(root); }
  finally { rmSync(root, { recursive: true }); }
}

test("accepts the exact lowercase PDF path", () => fixture("resume.pdf", "%PDF-1.7", root => assert.equal(validateResume(root, "/resume.pdf"), "public/resume.pdf")));
test("rejects case mismatch even on Windows", () => fixture("Resume.pdf", "%PDF-1.7", root => assert.throws(() => validateResume(root, "/resume.pdf"), /case mismatch/)));
test("rejects missing files", () => fixture("resume.pdf", "%PDF-1.7", root => assert.throws(() => validateResume(root, "/missing.pdf"), /Missing resume/)));
test("rejects non-PDF content", () => fixture("resume.pdf", "<!doctype html>", root => assert.throws(() => validateResume(root, "/resume.pdf"), /valid .pdf/)));
test("rejects path traversal", () => fixture("resume.pdf", "%PDF-1.7", root => assert.throws(() => validateResume(root, "/../resume.pdf"), /Invalid resume path/)));
test("accepts exact Git case", () => assert.doesNotThrow(() => validateTrackedResume("public/resume.pdf", ["public/resume.pdf"])));
test("rejects an unrecorded case-only Git rename", () => assert.throws(() => validateTrackedResume("public/resume.pdf", ["public/Resume.pdf"]), /Git resume case mismatch/));
test("rejects an untracked deployment asset", () => assert.throws(() => validateTrackedResume("public/resume.pdf", []), /not tracked/));
