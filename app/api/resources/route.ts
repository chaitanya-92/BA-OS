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

type ResourceRow = {
  id: string;
  subjectId: string | null;
  topicId: string | null;
  title: string;
  slug: string;
  kind: string;
  content: string | null;
  externalUrl: string | null;
  verificationStatus: string;
  sourceReference: string | null;
  sourcePage: string | null;
};

export async function GET(request: NextRequest) {
  const parsed = filtersSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resource filters." }, { status: 400 });
  }

  const filters = parsed.data;
  const db = getDb();
  const resourceConditions = [
    eq(studyResources.isPublished, true),
    ...(filters.subjectId ? [eq(studyResources.subjectId, filters.subjectId)] : []),
    ...(filters.topicId ? [eq(studyResources.topicId, filters.topicId)] : []),
    ...(filters.kind ? [eq(studyResources.kind, filters.kind)] : []),
  ];
  const entryConditions = [
    eq(contentEntries.status, "published"),
    ...(filters.subjectId ? [eq(contentEntries.subjectId, filters.subjectId)] : []),
    ...(filters.topicId ? [eq(contentEntries.topicId, filters.topicId)] : []),
    ...(filters.kind ? [eq(contentEntries.entryType, filters.kind as "note" | "formula" | "trap" | "shortcut" | "checklist")] : []),
  ];

  // These are two independently managed content stores. A missing table or a
  // migration mismatch in one must not hide records successfully loaded from
  // the other store.
  const [resourceResult, entryResult] = await Promise.allSettled([
    db.select({
      id: studyResources.id,
      subjectId: studyResources.subjectId,
      topicId: studyResources.topicId,
      title: studyResources.title,
      slug: studyResources.slug,
      kind: studyResources.kind,
      content: studyResources.content,
      externalUrl: studyResources.externalUrl,
      verificationStatus: sql<string>`'verified'`,
      sourceReference: sql<string | null>`null`,
      sourcePage: sql<string | null>`null`,
    }).from(studyResources).where(and(...resourceConditions))
      .orderBy(asc(studyResources.title)).limit(500),
    db.select({
      id: contentEntries.id,
      subjectId: contentEntries.subjectId,
      topicId: contentEntries.topicId,
      title: contentEntries.title,
      slug: contentEntries.slug,
      kind: contentEntries.entryType,
      content: contentEntries.content,
      externalUrl: sql<string | null>`null`,
      verificationStatus: contentEntries.verificationStatus,
      sourceReference: contentEntries.sourceReference,
      sourcePage: contentEntries.sourcePage,
    }).from(contentEntries).where(and(...entryConditions))
      .orderBy(asc(contentEntries.title)).limit(500),
  ]);

  if (resourceResult.status === "rejected" && entryResult.status === "rejected") {
    return NextResponse.json(
      { error: "Learning resources are temporarily unavailable. Check the database connection and run the latest migrations." },
      { status: 503 },
    );
  }

  const resources: ResourceRow[] = resourceResult.status === "fulfilled"
    ? resourceResult.value
    : [];
  const authored: ResourceRow[] = entryResult.status === "fulfilled"
    ? entryResult.value
    : [];
  const items = [...resources, ...authored]
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, 500);

  return NextResponse.json({
    items,
    counts: {
      studyResources: resources.length,
      contentEntries: authored.length,
      total: items.length,
    },
    partial: resourceResult.status === "rejected" || entryResult.status === "rejected",
    unavailableSources: [
      ...(resourceResult.status === "rejected" ? ["study_resources"] : []),
      ...(entryResult.status === "rejected" ? ["content_entries"] : []),
    ],
  });
}
