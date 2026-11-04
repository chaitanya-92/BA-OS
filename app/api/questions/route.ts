import { and, desc, eq, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { questions } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  examId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  year: z.coerce.number().int().min(1990).max(2100).optional(),
  difficulty: z.enum(["easy", "moderate", "difficult", "unrated"]).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid question filters.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const filters = parsed.data;
  try {
    const conditions = [
      eq(questions.isPublished, true),
      ...(filters.examId ? [eq(questions.examId, filters.examId)] : []),
      ...(filters.subjectId ? [eq(questions.subjectId, filters.subjectId)] : []),
      ...(filters.topicId ? [eq(questions.topicId, filters.topicId)] : []),
      ...(filters.sectionId ? [eq(questions.examSectionId, filters.sectionId)] : []),
      ...(filters.year ? [eq(questions.examYear, filters.year)] : []),
      ...(filters.difficulty ? [eq(questions.difficulty, filters.difficulty)] : []),
      ...(filters.q ? [ilike(questions.prompt, `%${filters.q}%`)] : []),
    ];

    const db = getDb();
    const items = await db
      .select({
        id: questions.id,
        examId: questions.examId,
        examSectionId: questions.examSectionId,
        subjectId: questions.subjectId,
        topicId: questions.topicId,
        subtopicId: questions.subtopicId,
        examYear: questions.examYear,
        examSlot: questions.examSlot,
        questionType: questions.questionType,
        difficulty: questions.difficulty,
        prompt: questions.prompt,
        verificationStatus: questions.verificationStatus,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .where(and(...conditions))
      .orderBy(desc(questions.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    return NextResponse.json({
      items,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        returned: items.length,
        hasMore: items.length === filters.limit,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Question bank is temporarily unavailable." },
      { status: 503 },
    );
  }
}
