import { config } from "dotenv";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../lib/db";
import { exams, examSections, questions, subjects, topics, tests, testQuestions, testSections } from "../lib/db/schema";

config({ path: ".env.local" });

type QuestionRow = { id: string; topicId: string | null; topicName: string | null; subjectId: string | null; sectionId: string | null; sectionName: string | null };

async function main() {
  const db = getDb();
  const [cat] = await db.select({ id: exams.id }).from(exams).where(eq(exams.slug, "cat")).limit(1);
  if (!cat) throw new Error("CAT taxonomy not found. Run npm run db:bootstrap first.");

  const rows = await db.select({
    id: questions.id,
    topicId: questions.topicId,
    topicName: topics.name,
    subjectId: questions.subjectId,
    sectionId: questions.examSectionId,
    sectionName: examSections.name,
  }).from(questions)
    .leftJoin(topics, eq(questions.topicId, topics.id))
    .leftJoin(examSections, eq(questions.examSectionId, examSections.id))
    .where(and(eq(questions.isPublished, true), eq(questions.examId, cat.id)))
    .orderBy(asc(questions.createdAt)) as QuestionRow[];

  const created: string[] = [];
  const skipped: string[] = [];

  async function createTest(input: {
    title: string; slug: string; description: string; kind: "full_mock" | "sectional" | "topic_practice" | "diagnostic";
    durationMinutes: number; sections: { title: string; durationMinutes: number; questionIds: string[] }[];
  }) {
    const uniqueIds = input.sections.flatMap(section => section.questionIds);
    if (!uniqueIds.length || new Set(uniqueIds).size !== uniqueIds.length) return;
    const result = await db.transaction(async tx => {
      const [existing] = await tx.select({ id: tests.id }).from(tests).where(eq(tests.slug, input.slug)).limit(1);
      if (existing) return "exists" as const;
      const valid = await tx.select({ id: questions.id }).from(questions)
        .where(and(inArray(questions.id, uniqueIds), eq(questions.isPublished, true)));
      if (valid.length !== uniqueIds.length) throw new Error(`Question validation failed for ${input.slug}`);
      const [test] = await tx.insert(tests).values({
        examId: cat.id, title: input.title, slug: input.slug, description: input.description,
        kind: input.kind, durationMinutes: input.durationMinutes,
        instructions: "Answer independently. Each section follows its displayed marking scheme. Review unanswered and marked questions before submitting.",
        isPublished: true,
      }).returning({ id: tests.id });
      for (const [index, section] of input.sections.entries()) {
        const [saved] = await tx.insert(testSections).values({
          testId: test.id, title: section.title, displayOrder: index + 1,
          durationMinutes: section.durationMinutes, marksPerCorrect: 3, marksPerIncorrect: -1,
        }).returning({ id: testSections.id });
        await tx.insert(testQuestions).values(section.questionIds.map((questionId, order) => ({
          testSectionId: saved.id, questionId, displayOrder: order + 1,
        })));
      }
      return "created" as const;
    });
    (result === "created" ? created : skipped).push(input.title);
  }

  const byTopic = new Map<string, QuestionRow[]>();
  for (const row of rows) if (row.topicId && row.topicName) {
    const group = byTopic.get(row.topicId) ?? [];
    group.push(row); byTopic.set(row.topicId, group);
  }
  for (const group of byTopic.values()) {
    if (group.length < 5) continue;
    const title = `CAT Quant — ${group[0].topicName} Practice`;
    const slug = `cat-quant-${group[0].topicName!.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-practice`;
    const ids = group.slice(0, 20).map(row => row.id);
    await createTest({
      title, slug, description: `Topic-level practice using ${ids.length} published, reviewed questions from the CAT question bank.`,
      kind: "topic_practice", durationMinutes: Math.max(15, Math.ceil(ids.length * 1.5)),
      sections: [{ title: group[0].topicName!, durationMinutes: Math.max(15, Math.ceil(ids.length * 1.5)), questionIds: ids }],
    });
  }

  const qa = rows.filter(row => row.sectionName === "QA");
  if (qa.length >= 20) {
    const ids = qa.slice(0, 22).map(row => row.id);
    await createTest({
      title: "CAT Quantitative Aptitude — Sectional Test 01", slug: "cat-quant-sectional-01",
      description: "A timed Quantitative Aptitude sectional built from published, reviewed CAT practice questions.",
      kind: "sectional", durationMinutes: 40,
      sections: [{ title: "Quantitative Aptitude", durationMinutes: 40, questionIds: ids }],
    });
  }

  const varc = rows.filter(row => row.sectionName === "VARC").slice(0, 24);
  const dilr = rows.filter(row => row.sectionName === "DILR").slice(0, 20);
  const quant = qa.slice(0, 22);
  if (varc.length === 24 && dilr.length === 20 && quant.length === 22) {
    await createTest({
      title: "CAT Full-Length Mock 01", slug: "cat-full-length-mock-01",
      description: "A 66-question, 120-minute CAT-format mock assembled only from published, reviewed questions.",
      kind: "full_mock", durationMinutes: 120,
      sections: [
        { title: "VARC", durationMinutes: 40, questionIds: varc.map(row => row.id) },
        { title: "DILR", durationMinutes: 40, questionIds: dilr.map(row => row.id) },
        { title: "Quantitative Aptitude", durationMinutes: 40, questionIds: quant.map(row => row.id) },
      ],
    });
  }

  const counts = {
    publishedQuestions: rows.length,
    topicsWithQuestions: byTopic.size,
    eligibleTopics: [...byTopic.values()].filter(group => group.length >= 5).length,
    quantQuestions: qa.length,
    varcQuestions: rows.filter(row => row.sectionName === "VARC").length,
    dilrQuestions: rows.filter(row => row.sectionName === "DILR").length,
    createdTests: created,
    alreadyExisted: skipped,
    note: "Only published questions are used. A full CAT mock is created only when all three section quotas are met.",
  };
  console.log(JSON.stringify(counts, null, 2));
  await db.$client.end();
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
