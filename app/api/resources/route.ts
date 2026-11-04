import { and, asc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { contentEntries, studyResources } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const filtersSchema = z.object({
  subjectId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  kind: z.string().trim().max(40).optional(),
});

export async function GET(request: NextRequest) {
  const parsed = filtersSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resource filters." }, { status: 400 });
  }

  try {
    const filters = parsed.data;
    const conditions = [
      eq(studyResources.isPublished, true),
      ...(filters.subjectId ? [eq(studyResources.subjectId, filters.subjectId)] : []),
      ...(filters.topicId ? [eq(studyResources.topicId, filters.topicId)] : []),
      ...(filters.kind ? [eq(studyResources.kind, filters.kind)] : []),
    ];
    const items = await getDb()
      .select({
        id: studyResources.id,
        subjectId: studyResources.subjectId,
        topicId: studyResources.topicId,
        title: studyResources.title,
        slug: studyResources.slug,
        kind: studyResources.kind,
        content: studyResources.content,
        externalUrl: studyResources.externalUrl,
      })
      .from(studyResources)
      .where(and(...conditions))
      .orderBy(asc(studyResources.title))
      .limit(100);
    const authored = await getDb().select({
      id: contentEntries.id,
      subjectId: contentEntries.subjectId,
      topicId: contentEntries.topicId,
      title: contentEntries.title,
      slug: contentEntries.slug,
      kind: contentEntries.entryType,
      content: contentEntries.content,
      externalUrl: sql<string | null>`null`,
    }).from(contentEntries).where(and(
      eq(contentEntries.status, "published"),
      eq(contentEntries.verificationStatus, "verified"),
      ...(filters.subjectId ? [eq(contentEntries.subjectId, filters.subjectId)] : []),
      ...(filters.topicId ? [eq(contentEntries.topicId, filters.topicId)] : []),
      ...(filters.kind ? [eq(contentEntries.entryType, filters.kind as "note" | "formula" | "trap" | "shortcut" | "checklist")] : []),
    )).orderBy(asc(contentEntries.title)).limit(100);
    return NextResponse.json({ items: [...items, ...authored].sort((a,b) => a.title.localeCompare(b.title)).slice(0,150) });
  } catch {
    return NextResponse.json({ error: "Learning resources are temporarily unavailable." }, { status: 503 });
  }
}
