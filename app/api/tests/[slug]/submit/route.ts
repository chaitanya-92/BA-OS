import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  attempts,
  attemptResponses,
  questionOptions,
  questions,
  testQuestions,
  testSections,
  tests,
} from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submitSchema = z.object({
  startedAt: z.string().datetime(),
  timeSpentSeconds: z.number().int().min(0).max(24 * 60 * 60),
  responses: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOptionIds: z.array(z.string().uuid()).max(8),
    isMarkedForReview: z.boolean().default(false),
    isVisited: z.boolean().default(true),
    timeSpentSeconds: z.number().int().min(0).max(24 * 60 * 60).default(0),
  })).max(300),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const db = getDb();
    const [test] = await db.select({
      id: tests.id,
      durationMinutes: tests.durationMinutes,
    }).from(tests).where(and(eq(tests.slug, slug), eq(tests.isPublished, true))).limit(1);
    if (!test) return NextResponse.json({ error: "Test not found." }, { status: 404 });

    const sections = await db.select({
      id: testSections.id,
      marksPerCorrect: testSections.marksPerCorrect,
      marksPerIncorrect: testSections.marksPerIncorrect,
    }).from(testSections).where(eq(testSections.testId, test.id));

    const sectionIds = sections.map((section) => section.id);
    const assigned = sectionIds.length ? await db.select({
      questionId: testQuestions.questionId,
      sectionId: testQuestions.testSectionId,
      marksOverride: testQuestions.marksOverride,
      negativeMarksOverride: testQuestions.negativeMarksOverride,
    }).from(testQuestions).where(inArray(testQuestions.testSectionId, sectionIds)) : [];

    const assignedMap = new Map(assigned.map((row) => [row.questionId, row]));
    const uniqueResponses = new Map(parsed.data.responses.map((response) => [response.questionId, response]));
    if ([...uniqueResponses.keys()].some((id) => !assignedMap.has(id))) {
      return NextResponse.json({ error: "Submission contains a question outside this test." }, { status: 400 });
    }

    const questionIds = assigned.map((row) => row.questionId);
    const publishedRows = questionIds.length ? await db.select({
      id: questions.id,
      questionType: questions.questionType,
    }).from(questions).where(and(inArray(questions.id, questionIds), eq(questions.isPublished, true))) : [];
    const publishedSet = new Set(publishedRows.map((row) => row.id));
    if (publishedSet.size !== questionIds.length) {
      return NextResponse.json({ error: "This test contains unavailable questions." }, { status: 409 });
    }

    const sectionMap = new Map(sections.map((section) => [section.id, section]));
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let score = 0;

    const graded = await Promise.all(assigned.map(async (assignment) => {
      const response = uniqueResponses.get(assignment.questionId);
      const selected = response?.selectedOptionIds ?? [];
      if (!response || selected.length === 0) {
        unansweredCount += 1;
        return { assignment, response, isCorrect: false, isAnswered: false };
      }
      const correctOptions = await db.select({ id: questionOptions.id })
        .from(questionOptions)
        .where(and(eq(questionOptions.questionId, assignment.questionId), eq(questionOptions.isCorrect, true)));
      const expected = new Set(correctOptions.map((option) => option.id));
      const actual = new Set(selected);
      const isCorrect = expected.size > 0 && expected.size === actual.size && [...expected].every((id) => actual.has(id));
      const section = sectionMap.get(assignment.sectionId);
      if (isCorrect) {
        correctCount += 1;
        score += assignment.marksOverride ?? section?.marksPerCorrect ?? 0;
      } else {
        incorrectCount += 1;
        score += assignment.negativeMarksOverride ?? section?.marksPerIncorrect ?? 0;
      }
      return { assignment, response, isCorrect, isAnswered: true };
    }));

    const attempt = await db.transaction(async (tx) => {
      const [created] = await tx.insert(attempts).values({
        testId: test.id,
        status: "submitted",
        startedAt: new Date(parsed.data.startedAt),
        submittedAt: new Date(),
        score,
        correctCount,
        incorrectCount,
        unansweredCount,
        timeSpentSeconds: parsed.data.timeSpentSeconds,
      }).returning({ id: attempts.id });

      if (graded.length) {
        await tx.insert(attemptResponses).values(graded.map(({ assignment, response }) => ({
          attemptId: created.id,
          questionId: assignment.questionId,
          selectedOptionIds: response?.selectedOptionIds ?? [],
          answerText: null,
          isMarkedForReview: response?.isMarkedForReview ?? false,
          isVisited: response?.isVisited ?? false,
          timeSpentSeconds: response?.timeSpentSeconds ?? 0,
          answeredAt: response?.selectedOptionIds.length ? new Date() : null,
        })));
      }
      return created;
    });

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalQuestions: assigned.length,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Submission could not be saved. Please try again." }, { status: 503 });
  }
}
