#!/usr/bin/env tsx
/**
 * Extract a PDF into page-preserving JSONL for MBA OS review.
 * Requires the system utility pdftotext (Poppler). Does not attempt to guess
 * question boundaries or answer keys: extraction is a staging step, not approval.
 *
 * Usage:
 *   npx tsx scripts/extract-pdf-pages.ts "./source.pdf" "./source.pages.jsonl"
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { basename, resolve } from "node:path";

const run = promisify(execFile);
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: npx tsx scripts/extract-pdf-pages.ts <input.pdf> <output.jsonl>");
  process.exit(1);
}
const sourcePath = resolve(input);
const bytes = await readFile(sourcePath);
if (bytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("Input is not a PDF.");
const checksum = createHash("sha256").update(bytes).digest("hex");
const { stdout } = await run("pdftotext", ["-layout", "-enc", "UTF-8", sourcePath, "-"], { maxBuffer: 256 * 1024 * 1024 });
const pages = stdout.split("\f");
if (pages.at(-1)?.trim() === "") pages.pop();
const rows = pages.map((text, index) => ({
  sourceFile: basename(sourcePath),
  sourceSha256: checksum,
  pdfPage: index + 1,
  extraction: text.trim() ? "text_extracted" : "needs_ocr_or_visual_review",
  text: text.replace(/\r/g, "").trim(),
  reviewStatus: "not_reviewed",
}));
await writeFile(resolve(output), rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
console.log(JSON.stringify({
  sourceFile: basename(sourcePath), sha256: checksum, pages: rows.length,
  textPages: rows.filter((row) => row.text.length > 0).length,
  reviewPages: rows.filter((row) => !row.text.length).length,
  output: resolve(output),
}, null, 2));
