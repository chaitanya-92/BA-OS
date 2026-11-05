import { and, asc, eq, inArray } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { questions, testQuestions, testSections, tests } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(request: NextRequest) {
  const expected = process.env.ADMIN_IMPORT_TOKEN;
  const received = request.headers.get("x-admin-import-token");
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

const sectionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  durationMinutes: z.number().int().positive().max(300).nullable().optional(),
  marksPerCorrect: z.number().int().min(0).max(20).default(3),
  marksPerIncorrect: z.number().int().min(-20).max(0).default(-1),
  questionIds: z.array(z.string().uuid()).min(1).max(100),
});

const createSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().min(3).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).nullable().optional(),
  instructions: z.string().trim().max(5000).nullable().optional(),
  examId: z.string().uuid().nullable().optional(),
  kind: z.enum(["full_mock", "sectional", "topic_practice", "diagnostic"]),
  durationMinutes: z.number().int().positive().max(600),
  sections: z.array(sectionSchema).min(1).max(10),
}).superRefine((value, ctx) => {
  const ids = value.sections.flatMap((section) => section.questionIds);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", message: "A question can appear only once in a test.", path: ["sections"] });
  }
});

export async function GET(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const db = getDb();
    const rows = await db.select({
      id: tests.id, title: tests.title, slug: tests.slug, kind: tests.kind,
      durationMinutes: tests.durationMinutes, isPublished: tests.isPublished,
      createdAt: tests.createdAt,
    }).from(tests).orderBy(asc(tests.createdAt));
    const items = await Promise.all(rows.map(async (test) => {
      const sections = await db.select({ id: testSections.id, title: testSections.title })
        .from(testSections).where(eq(testSections.testId, test.id)).orderBy(asc(testSections.displayOrder));
      const links = sections.length ? await db.select({ questionId: testQuestions.questionId })
        .from(testQuestions).where(inArray(testQuestions.testSectionId, sections.map((section) => section.id))) : [];
      return { ...test, sectionCount: sections.length, questionCount: links.length };
    }));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Test administration data is unavailable. Check database migrations and connection." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid test configuration.", details: parsed.error.flatten() }, { status: 400 });
  const payload = parsed.data;
  try {
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const ids = payload.sections.flatMap((section) => section.questionIds);
      const validQuestions = await tx.select({ id: questions.id }).from(questions)
        .where(and(inArray(questions.id, ids), eq(questions.isPublished, true)));
      if (validQuestions.length !== ids.length) {
        throw new Error("Every assigned question must exist and be published before adding it to a test.");
      }
      const [test] = await tx.insert(tests).values({
        title: payload.title, slug: payload.slug, description: payload.description ?? null,
        instructions: payload.instructions ?? null, examId: payload.examId ?? null,
        kind: payload.kind, durationMinutes: payload.durationMinutes, isPublished: false,
      }).returning({ id: tests.id });
      for (const [sectionIndex, section] of payload.sections.entries()) {
        const [savedSection] = await tx.insert(testSections).values({
          testId: test.id, title: section.title, displayOrder: sectionIndex + 1,
          durationMinutes: section.durationMinutes ?? null,
          marksPerCorrect: section.marksPerCorrect, marksPerIncorrect: section.marksPerIncorrect,
        }).returning({ id: testSections.id });
        await tx.insert(testQuestions).values(section.questionIds.map((questionId, index) => ({
          testSectionId: savedSection.id, questionId, displayOrder: index + 1,
        })));
      }
      return { id: test.id, questionCount: ids.length };
    });
    return NextResponse.json({ status: "draft_created", ...result, published: false }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test creation failed.";
    const safeMessage = message.includes("must exist and be published") ? message : "Test creation failed. Check for a duplicate slug and valid database schema.";
    return NextResponse.json({ error: safeMessage }, { status: 409 });
  }
}

const publishSchema = z.object({ id: z.string().uuid(), action: z.enum(["publish", "unpublish"]) });

export async function PATCH(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const parsed = publishSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid publishing action." }, { status: 400 });
  try {
    const db = getDb();
    const [test] = await db.select({ id: tests.id }).from(tests).where(eq(tests.id, parsed.data.id)).limit(1);
    if (!test) return NextResponse.json({ error: "Test not found." }, { status: 404 });
    if (parsed.data.action === "publish") {
      const sections = await db.select({ id: testSections.id }).from(testSections).where(eq(testSections.testId, test.id));
      if (!sections.length) return NextResponse.json({ error: "Add at least one section before publishing." }, { status: 422 });
      const links = await db.select({ questionId: testQuestions.questionId }).from(testQuestions)
        .where(inArray(testQuestions.testSectionId, sections.map((section) => section.id)));
      if (!links.length) return NextResponse.json({ error: "Add reviewed questions to the test before publishing." }, { status: 422 });
      const ids = links.map((link) => link.questionId);
      const published = await db.select({ id: questions.id }).from(questions)
        .where(and(inArray(questions.id, ids), eq(questions.isPublished, true)));
      if (published.length !== ids.length) return NextResponse.json({ error: "Every assigned question must exist and be published before this test can go live." }, { status: 422 });
    }
    await db.update(tests).set({ isPublished: parsed.data.action === "publish", updatedAt: new Date() }).where(eq(tests.id, test.id));
    return NextResponse.json({ status: parsed.data.action === "publish" ? "published" : "unpublished" });
  } catch {
    return NextResponse.json({ error: "Test publishing could not be saved." }, { status: 503 });
  }
}
