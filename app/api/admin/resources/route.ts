import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { sources, studyResources } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({
  title: z.string().trim().min(3).max(220),
  slug: z.string().trim().min(3).max(240),
  kind: z.string().trim().min(1).max(40).default("notes"),
  subject: z.string().trim().min(1).max(120),
  topic: z.string().trim().min(1).max(160),
  sourceFile: z.string().trim().min(1).max(240),
  content: z.string().min(1).max(200000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
function authorised(request: NextRequest) {
  const expected = process.env.ADMIN_IMPORT_TOKEN, received = request.headers.get("x-admin-import-token");
  if (!expected || !received) return false;
  const a = Buffer.from(expected), b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function POST(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid resource payload.", details: parsed.error.flatten() }, { status: 400 });
  try {
    const db = getDb(), item = parsed.data;
    const result = await db.transaction(async (tx) => {
      let [source] = await tx.select({ id: sources.id }).from(sources).where(eq(sources.name, item.sourceFile)).limit(1);
      if (!source) [source] = await tx.insert(sources).values({
        name: item.sourceFile, kind: "editorial", publisher: "User-provided study material",
        rightsNote: "Original study notes supplied in the user's Library; source text preserved during extraction.",
        notes: "Imported from PDF with page layout extraction. Review diagrams/tables before public release.",
      }).returning({ id: sources.id });
      const [existing] = await tx.select({ id: studyResources.id }).from(studyResources).where(eq(studyResources.slug, item.slug)).limit(1);
      const values = { title: item.title, slug: item.slug, kind: item.kind, content: item.content,
        sourceId: source.id, isPublished: false };
      if (existing) {
        await tx.update(studyResources).set(values).where(eq(studyResources.id, existing.id));
        return { id: existing.id, status: "updated" as const };
      }
      const [created] = await tx.insert(studyResources).values(values).returning({ id: studyResources.id });
      return { id: created.id, status: "created" as const };
    });
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Study resource import failed. Check database schema and connection." }, { status: 500 });
  }
}
