import { createHash, timingSafeEqual } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { questionOptions, questions, solutions } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const optionSchema = z.object({
  key: z.string().trim().min(1).max(8),
  content: z.string().trim().min(1).max(4000),
  isCorrect: z.boolean().nullable().optional(),
});

const importSchema = z.object({
  examId: z.string().uuid().nullable().optional(),
  examSectionId: z.string().uuid().nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
  topicId: z.string().uuid().nullable().optional(),
  subtopicId: z.string().uuid().nullable().optional(),
  sourceId: z.string().uuid().nullable().optional(),
  sourceReference: z.string().trim().max(240).nullable().optional(),
  sourcePage: z.string().trim().max(40).nullable().optional(),
  sourceQuestionNumber: z.string().trim().max(40).nullable().optional(),
  examYear: z.number().int().min(1990).max(2100).nullable().optional(),
  examSlot: z.string().trim().max(80).nullable().optional(),
  questionType: z.enum(["mcq_single", "mcq_multiple", "numeric", "text", "passage", "set"]).default("mcq_single"),
  difficulty: z.enum(["easy", "moderate", "difficult", "unrated"]).default("unrated"),
  prompt: z.string().trim().min(5).max(20000),
  passage: z.string().max(30000).nullable().optional(),
  options: z.array(optionSchema).max(8).default([]),
  solution: z.object({
    methodName: z.string().trim().max(160).nullable().optional(),
    content: z.string().trim().min(1).max(20000),
    answerText: z.string().trim().max(2000).nullable().optional(),
  }).optional(),
});

function authorised(request: NextRequest) {
  const expected = process.env.ADMIN_IMPORT_TOKEN;
  const received = request.headers.get("x-admin-import-token");
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  try {
    const db = getDb();
    const pending = await db.select({
      id: questions.id,
      prompt: questions.prompt,
      passage: questions.passage,
      questionType: questions.questionType,
      difficulty: questions.difficulty,
      examYear: questions.examYear,
      examSlot: questions.examSlot,
      sourceReference: questions.sourceReference,
      sourcePage: questions.sourcePage,
      verificationStatus: questions.verificationStatus,
      createdAt: questions.createdAt,
    }).from(questions)
      .where(eq(questions.isPublished, false))
      .orderBy(asc(questions.createdAt))
      .limit(100);

    return NextResponse.json({ items: pending });
  } catch {
    return NextResponse.json({ error: "Pending questions could not be loaded." }, { status: 503 });
  }
}

const reviewSchema = z.object({
  questionId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review action." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [question] = await db.select({
      id: questions.id,
      questionType: questions.questionType,
    }).from(questions).where(and(
      eq(questions.id, parsed.data.questionId),
      eq(questions.isPublished, false),
    )).limit(1);

    if (!question) return NextResponse.json({ error: "Pending question not found." }, { status: 404 });

    if (parsed.data.action === "approve") {
      if (question.questionType === "mcq_single" || question.questionType === "mcq_multiple") {
        const correct = await db.select({ id: questionOptions.id })
          .from(questionOptions)
          .where(and(eq(questionOptions.questionId, question.id), eq(questionOptions.isCorrect, true)));
        if (correct.length === 0 || (question.questionType === "mcq_single" && correct.length !== 1)) {
          return NextResponse.json({ error: "Add and verify the correct option before publishing." }, { status: 409 });
        }
      } else {
        const verified = await db.select({ id: solutions.id })
          .from(solutions).where(and(
            eq(solutions.questionId, question.id),
            eq(solutions.answerVerification, "verified"),
          )).limit(1);
        if (verified.length === 0) {
          return NextResponse.json({ error: "Add a verified answer key before publishing this question." }, { status: 409 });
        }
      }

      await db.update(questions).set({
        isPublished: true,
        verificationStatus: "verified",
        updatedAt: new Date(),
      }).where(eq(questions.id, question.id));
      return NextResponse.json({ status: "published", questionId: question.id });
    }

    await db.update(questions).set({
      verificationStatus: "disputed",
      updatedAt: new Date(),
    }).where(eq(questions.id, question.id));
    return NextResponse.json({ status: "rejected", questionId: question.id });
  } catch {
    return NextResponse.json({ error: "Question review could not be saved." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const parsed = importSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid question payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const fingerprint = createHash("sha256")
    .update([payload.examId ?? "unknown-exam", payload.examYear ?? "unknown-year", payload.examSlot ?? "unknown-slot", payload.sourceReference ?? "unknown-source", payload.prompt.replace(/\s+/g, " ").trim().toLowerCase()].join("|"))
    .digest("hex");

  try {
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(questions).values({
        examId: payload.examId ?? null,
        examSectionId: payload.examSectionId ?? null,
        subjectId: payload.subjectId ?? null,
        topicId: payload.topicId ?? null,
        subtopicId: payload.subtopicId ?? null,
        sourceId: payload.sourceId ?? null,
        sourceReference: payload.sourceReference ?? null,
        sourcePage: payload.sourcePage ?? null,
        sourceQuestionNumber: payload.sourceQuestionNumber ?? null,
        examYear: payload.examYear ?? null,
        examSlot: payload.examSlot ?? null,
        questionType: payload.questionType,
        difficulty: payload.difficulty,
        prompt: payload.prompt,
        passage: payload.passage ?? null,
        contentFingerprint: fingerprint,
        isPublished: false,
        verificationStatus: "unreviewed",
      }).onConflictDoNothing({ target: questions.contentFingerprint }).returning({ id: questions.id });

      if (!inserted) return { id: null, duplicate: true };

      if (payload.options.length) {
        await tx.insert(questionOptions).values(payload.options.map((option, index) => ({
          questionId: inserted.id,
          optionKey: option.key,
          content: option.content,
          isCorrect: option.isCorrect ?? null,
          displayOrder: index + 1,
        })));
      }

      if (payload.solution) {
        await tx.insert(solutions).values({
          questionId: inserted.id,
          methodName: payload.solution.methodName ?? null,
          content: payload.solution.content,
          answerText: payload.solution.answerText ?? null,
          answerVerification: "unreviewed",
          isEditorial: false,
        });
      }

      return { id: inserted.id, duplicate: false };
    });

    return NextResponse.json({
      status: result.duplicate ? "duplicate" : "queued_for_review",
      questionId: result.id,
      published: false,
      verificationStatus: "unreviewed",
    }, { status: result.duplicate ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Question import failed. Check linked taxonomy and source IDs." }, { status: 500 });
  }
}
