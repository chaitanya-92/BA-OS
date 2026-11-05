#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";
type Resource = { title: string; slug: string; kind: string; subject: string; topic: string; sourceFile: string; content: string; metadata: Record<string, unknown> };
const file = process.argv[2] ?? "data/imports/mba-os-study-resources.json";
const base = process.env.MBA_OS_BASE_URL?.replace(/\/$/, "");
const token = process.env.ADMIN_IMPORT_TOKEN;
if (!base || !token) throw new Error("Set MBA_OS_BASE_URL and ADMIN_IMPORT_TOKEN before importing.");
const payload = JSON.parse(await readFile(file, "utf8")) as { resources: Resource[] };
let imported = 0, failed = 0; const errors: string[] = [];
for (const resource of payload.resources) {
  try {
    const response = await fetch(base + "/api/admin/resources", {
      method: "POST", headers: { "content-type": "application/json", "x-admin-import-token": token },
      body: JSON.stringify(resource),
    });
    const result = await response.json() as { status?: string; error?: string };
    if (!response.ok) throw new Error(result.error ?? "HTTP " + response.status);
    if (result.status === "created" || result.status === "updated") imported++;
  } catch (error) { failed++; errors.push(resource.title + ": " + (error instanceof Error ? error.message : String(error))); }
}
console.log(JSON.stringify({ total: payload.resources.length, imported, failed, errors }, null, 2));
if (failed) process.exitCode = 1;
