import { and, asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import {
  attempts,
  attemptResponses,
  questionOptions,
  questions,
  solutions,
  testQuestions,
  testSections,
} from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid attempt id." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [attempt] = await db.select({
      id: attempts.id,
      testId: attempts.testId,
      userId: attempts.userId,
      status: attempts.status,
      startedAt: attempts.startedAt,
      submittedAt: attempts.submittedAt,
      score: attempts.score,
      correctCount: attempts.correctCount,
      incorrectCount: attempts.incorrectCount,
      unansweredCount: attempts.unansweredCount,
      timeSpentSeconds: attempts.timeSpentSeconds,
    }).from(attempts).where(eq(attempts.id, id)).limit(1);

    if (!attempt || attempt.userId !== user.id || (attempt.status !== "submitted" && attempt.status !== "auto_submitted")) {
      return NextResponse.json({ error: "Completed attempt not found." }, { status: 404 });
    }

    const rows = await db.select({
      questionId: questions.id,
      prompt: questions.prompt,
      passage: questions.passage,
      questionType: questions.questionType,
      sectionTitle: testSections.title,
      selectedOptionIds: attemptResponses.selectedOptionIds,
      answerText: attemptResponses.answerText,
      isMarkedForReview: attemptResponses.isMarkedForReview,
    }).from(attemptResponses)
      .innerJoin(questions, eq(attemptResponses.questionId, questions.id))
      .innerJoin(testQuestions, eq(testQuestions.questionId, questions.id))
      .innerJoin(testSections, eq(testQuestions.testSectionId, testSections.id))
      .where(and(eq(attemptResponses.attemptId, id), eq(testSections.testId, attempt.testId)))
      .orderBy(asc(testSections.displayOrder), asc(testQuestions.displayOrder));

    const reviewed = await Promise.all(rows.map(async (row) => {
      const [options, explanations] = await Promise.all([
        db.select({
          id: questionOptions.id,
          optionKey: questionOptions.optionKey,
          content: questionOptions.content,
          isCorrect: questionOptions.isCorrect,
        }).from(questionOptions)
          .where(eq(questionOptions.questionId, row.questionId))
          .orderBy(asc(questionOptions.displayOrder)),
        db.select({
          methodName: solutions.methodName,
          content: solutions.content,
          answerText: solutions.answerText,
        }).from(solutions)
          .where(and(
            eq(solutions.questionId, row.questionId),
            inArray(solutions.answerVerification, ["verified", "independently_checked"]),
          )).orderBy(asc(solutions.createdAt)),
      ]);
      const selected = new Set(row.selectedOptionIds);
      const correct = options.filter((option) => option.isCorrect === true);
      const answered = selected.size > 0 || Boolean(row.answerText?.trim());
      const normalise = (value: string) => value.replace(/\\s+/g, "").toLowerCase();
      const isCorrect = !answered ? null :
        row.questionType === "mcq_single" || row.questionType === "mcq_multiple" || options.length > 0
          ? correct.length > 0 && correct.length === selected.size && correct.every((option) => selected.has(option.id))
          : explanations.some((solution) => solution.answerText && normalise(solution.answerText) === normalise(row.answerText ?? ""));
      return {
        ...row,
        options,
        solutions: explanations,
        isCorrect,
        correctAnswer: correct.map((option) => option.optionKey).concat(
          row.questionType !== "mcq_single" && row.questionType !== "mcq_multiple"
            ? explanations.map((solution) => solution.answerText).filter((value): value is string => Boolean(value))
            : [],
        ),
      };
    }));

    return NextResponse.json({ attempt, questions: reviewed });
  } catch {
    return NextResponse.json({ error: "Attempt review is temporarily unavailable." }, { status: 503 });
  }
}
