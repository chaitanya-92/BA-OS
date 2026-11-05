#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";
import { config } from "dotenv";
config({ path: ".env.local" });

type Resource = {
  title: string; slug: string; kind: string; subject: string; topic: string;
  sourceFile: string; content: string; metadata: Record<string, unknown>;
  sourceKind?: "editorial" | "original_practice" | "third_party";
  contentMode?: "original" | "licensed" | "summary";
  publisher?: string; rightsNote?: string;
};

async function main() {
  const file = process.argv[2] ?? "data/imports/mba-os-study-resources.json";
  const base = process.env.MBA_OS_BASE_URL?.replace(/\/$/, "");
  const token = process.env.ADMIN_IMPORT_TOKEN ?? "";
  if (!base || !token) throw new Error("Set MBA_OS_BASE_URL and ADMIN_IMPORT_TOKEN before importing.");
  const adminToken: string = token;
  const payload = JSON.parse(await readFile(file, "utf8")) as { resources: Resource[] };
  if (!Array.isArray(payload.resources) || payload.resources.length === 0) throw new Error("No resources found in import file.");

  let created = 0, skipped = 0, failed = 0;
  const errors: string[] = [];

  for (const resource of payload.resources) {
    try {
      const start = resource.metadata?.pdfPageStart;
      const end = resource.metadata?.pdfPageEnd;
      const pageRange = typeof start === "number" && typeof end === "number" ? `${start}-${end}` : undefined;
      const response = await fetch(base + "/api/admin/content", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-import-token": adminToken },
        body: JSON.stringify({
          source: {
            name: resource.sourceFile,
            kind: resource.sourceKind ?? "editorial",
            publisher: resource.publisher ?? "User-provided study material",
            rightsNote: resource.rightsNote ?? "User-provided study material. Extracted text is preserved; diagrams, tables and mathematical notation should be visually checked before approval.",
            notes: "Imported as draft content with original PDF page references."
          },
          contentMode: resource.contentMode ?? "original",
          entries: [{
            title: resource.title,
            slug: resource.slug,
            entryType: "note",
            content: resource.content,
            sourceReference: resource.sourceFile,
            sourcePage: pageRange,
            tags: [resource.subject, resource.topic, "PDF extraction", ...(pageRange ? [`PDF pages ${pageRange}`] : [])].slice(0, 20)
          }]
        })
      });
      const responseText = await response.text();
      let result: { created?: number; skipped?: number; error?: string };
      try {
        result = JSON.parse(responseText) as { created?: number; skipped?: number; error?: string };
      } catch {
        const contentType = response.headers.get("content-type") ?? "unknown content type";
        const preview = responseText.slice(0, 240).replace(/\\s+/g, " ").trim();
        throw new Error(`HTTP ${response.status}; expected JSON but received ${contentType}. Response: ${preview}`);
      }
      if (!response.ok) throw new Error(result.error ?? "HTTP " + response.status);
      created += result.created ?? 0;
      skipped += result.skipped ?? 0;
    } catch (error) {
      failed++;
      errors.push(resource.title + ": " + (error instanceof Error ? error.message : String(error)));
    }
  }
  console.log(JSON.stringify({ source: file, total: payload.resources.length, created, skipped, failed, errors }, null, 2));
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
