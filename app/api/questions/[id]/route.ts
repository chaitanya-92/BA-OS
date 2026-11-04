import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { questionOptions, questions, solutions } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid question id." }, { status: 400 });
  }

  try {
    const [question] = await db
      .select({
        id: questions.id,
        examYear: questions.examYear,
        examSlot: questions.examSlot,
        questionType: questions.questionType,
        difficulty: questions.difficulty,
        prompt: questions.prompt,
        verificationStatus: questions.verificationStatus,
        createdAt: questions.createdAt,
        isPublished: questions.isPublished,
      })
      .from(questions)
      .where(eq(questions.id, id))
      .limit(1);

    if (!question || !question.isPublished) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const [options, explanationRows] = await Promise.all([
      db.select({
        id: questionOptions.id,
        optionKey: questionOptions.optionKey,
        content: questionOptions.content,
        isCorrect: questionOptions.isCorrect,
      }).from(questionOptions)
        .where(eq(questionOptions.questionId, id))
        .orderBy(asc(questionOptions.displayOrder)),
      db.select({
        methodName: solutions.methodName,
        content: solutions.content,
        answerText: solutions.answerText,
        answerVerification: solutions.answerVerification,
      }).from(solutions)
        .where(eq(solutions.questionId, id))
        .orderBy(asc(solutions.createdAt)),
    ]);

    const { isPublished: _isPublished, ...publicQuestion } = question;
    return NextResponse.json({ ...publicQuestion, options, solutions: explanationRows });
  } catch {
    return NextResponse.json(
      { error: "Question details are temporarily unavailable." },
      { status: 503 },
    );
  }
}
