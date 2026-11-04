import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  attempts,
  attemptResponses,
  questionOptions,
  questions,
  solutions,
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
    answerText: z.string().max(200).default(""),
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
    if (sectionIds.length === 0) return NextResponse.json({ error: "This test has no configured sections." }, { status: 409 });
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
    if (questionIds.length === 0) return NextResponse.json({ error: "This test has no assigned questions." }, { status: 409 });
    if (new Set(questionIds).size !== questionIds.length) return NextResponse.json({ error: "A question is assigned more than once in this test." }, { status: 409 });
    const publishedRows = questionIds.length ? await db.select({
      id: questions.id,
      questionType: questions.questionType,
    }).from(questions).where(and(inArray(questions.id, questionIds), eq(questions.isPublished, true))) : [];
    const publishedSet = new Set(publishedRows.map((row) => row.id));
    if (publishedSet.size !== questionIds.length) {
      return NextResponse.json({ error: "This test contains unavailable questions." }, { status: 409 });
    }

    const submittedStart = new Date(parsed.data.startedAt);
    if (submittedStart.getTime() > Date.now() + 60_000) return NextResponse.json({ error: "Invalid attempt start time." }, { status: 400 });
    const trustedTimeSpent = Math.min(test.durationMinutes * 60, Math.max(0, Math.floor((Date.now() - submittedStart.getTime()) / 1000)));
    const sectionMap = new Map(sections.map((section) => [section.id, section]));
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let score = 0;

    const questionTypeMap = new Map(publishedRows.map((row) => [row.id, row.questionType]));
    const graded = await Promise.all(assigned.map(async (assignment) => {
      const response = uniqueResponses.get(assignment.questionId);
      const selected = response?.selectedOptionIds ?? [];
      const answerText = response?.answerText?.trim() ?? "";
      const questionType = questionTypeMap.get(assignment.questionId);
      if (!response || (selected.length === 0 && !answerText)) {
        unansweredCount += 1;
        return { assignment, response, isCorrect: false, isAnswered: false };
      }

      let isCorrect = false;
      if (questionType === "mcq_single" || questionType === "mcq_multiple" || selected.length > 0) {
        const allOptions = await db.select({ id: questionOptions.id, isCorrect: questionOptions.isCorrect })
          .from(questionOptions)
          .where(eq(questionOptions.questionId, assignment.questionId));
        const allowed = new Set(allOptions.map((option) => option.id));
        if (selected.some((id) => !allowed.has(id))) throw new Error("A selected option does not belong to its question.");
        const expected = new Set(allOptions.filter((option) => option.isCorrect).map((option) => option.id));
        const actual = new Set(selected);
        isCorrect = expected.size > 0 && expected.size === actual.size && [...expected].every((id) => actual.has(id));
      } else {
        const verifiedAnswers = await db.select({ answerText: solutions.answerText })
          .from(solutions)
          .where(and(
            eq(solutions.questionId, assignment.questionId),
            inArray(solutions.answerVerification, ["verified", "independently_checked"]),
          ));
        const expected = verifiedAnswers.map((item) => item.answerText?.replace(/\\s+/g, "").toLowerCase()).filter(Boolean);
        if (!expected.length) throw new Error("A published non-MCQ question is missing a verified answer key.");
        const actual = answerText.replace(/\\s+/g, "").toLowerCase();
        isCorrect = expected.includes(actual);
      }

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
        timeSpentSeconds: trustedTimeSpent,
      }).returning({ id: attempts.id });

      if (graded.length) {
        await tx.insert(attemptResponses).values(graded.map(({ assignment, response }) => ({
          attemptId: created.id,
          questionId: assignment.questionId,
          selectedOptionIds: response?.selectedOptionIds ?? [],
          answerText: response?.answerText ?? null,
          isMarkedForReview: response?.isMarkedForReview ?? false,
          isVisited: response?.isVisited ?? false,
          timeSpentSeconds: response?.timeSpentSeconds ?? 0,
          answeredAt: (response?.selectedOptionIds.length ?? 0) > 0 || Boolean(response?.answerText?.trim()) ? new Date() : null,
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
      timeSpentSeconds: trustedTimeSpent,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Submission could not be saved. Please try again." }, { status: 503 });
  }
}
