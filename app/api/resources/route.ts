import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { studyResources } from "@/lib/db/schema";

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
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Learning resources are temporarily unavailable." }, { status: 503 });
  }
}
