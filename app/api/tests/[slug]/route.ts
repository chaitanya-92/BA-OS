import { asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { questionOptions, questions, testQuestions, testSections, tests } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugSchema = z.string().min(1).max(220).regex(/^[a-z0-9-]+$/);

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json({ error: "Invalid test address." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [test] = await db.select({
      id: tests.id,
      title: tests.title,
      slug: tests.slug,
      description: tests.description,
      kind: tests.kind,
      durationMinutes: tests.durationMinutes,
      instructions: tests.instructions,
    }).from(tests).where(eq(tests.slug, slug)).limit(1);

    if (!test) return NextResponse.json({ error: "Test not found." }, { status: 404 });

    const sections = await db.select({
      id: testSections.id,
      title: testSections.title,
      displayOrder: testSections.displayOrder,
      durationMinutes: testSections.durationMinutes,
      marksPerCorrect: testSections.marksPerCorrect,
      marksPerIncorrect: testSections.marksPerIncorrect,
    }).from(testSections)
      .where(eq(testSections.testId, test.id))
      .orderBy(asc(testSections.displayOrder));

    const hydratedSections = await Promise.all(sections.map(async (section) => {
      const rows = await db.select({
        id: questions.id,
        prompt: questions.prompt,
        passage: questions.passage,
        questionType: questions.questionType,
        difficulty: questions.difficulty,
        displayOrder: testQuestions.displayOrder,
      }).from(testQuestions)
        .innerJoin(questions, eq(testQuestions.questionId, questions.id))
        .where(eq(testQuestions.testSectionId, section.id))
        .orderBy(asc(testQuestions.displayOrder));

      const hydratedQuestions = await Promise.all(rows.map(async (question) => {
        const options = await db.select({
          id: questionOptions.id,
          optionKey: questionOptions.optionKey,
          content: questionOptions.content,
        }).from(questionOptions)
          .where(eq(questionOptions.questionId, question.id))
          .orderBy(asc(questionOptions.displayOrder));
        return { ...question, options };
      }));

      return { ...section, questions: hydratedQuestions };
    }));

    return NextResponse.json({
      ...test,
      sections: hydratedSections,
      questionCount: hydratedSections.reduce((total, section) => total + section.questions.length, 0),
    });
  } catch {
    return NextResponse.json({ error: "Test details are temporarily unavailable." }, { status: 503 });
  }
}
