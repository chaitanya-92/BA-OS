#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { exams, examSections, questions, subjects, topics } from "../lib/db/schema";
config({ path: ".env.local" });

type BankQuestion = {
  topic: string; difficulty: "easy" | "moderate" | "difficult" | "unrated";
  origin: "original_practice" | "pyq_pattern_practice";
  sourceQuestionNumber: string; prompt: string;
  options: { key: string; content: string }[];
  answerKey: string | null; sourceProvidedSolution: string | null;
  validation: string; fingerprint: string;
};
type Bank = { questions: BankQuestion[] };

async function main() {
  const file = process.argv[2] ?? "data/imports/cat-arithmetic-320-original.json";
  const base = process.env.MBA_OS_BASE_URL?.replace(/\/$/, "");
  const token = process.env.ADMIN_IMPORT_TOKEN ?? "";
  if (!base || !token) throw new Error("Set MBA_OS_BASE_URL and ADMIN_IMPORT_TOKEN before importing.");
  const adminToken: string = token;
  const db = getDb();
  const [cat] = await db.select({ id: exams.id }).from(exams).where(eq(exams.slug, "cat")).limit(1);
  const [qa] = cat ? await db.select({ id: examSections.id }).from(examSections).where(and(eq(examSections.examId, cat.id), eq(examSections.slug, "qa"))).limit(1) : [];
  const [quant] = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.slug, "quantitative-aptitude")).limit(1);
  if (!cat || !qa || !quant) throw new Error("CAT taxonomy is missing. Run npm run db:bootstrap first.");
  const topicRows = await db.select({ id: topics.id, slug: topics.slug }).from(topics).where(eq(topics.subjectId, quant.id));
  const topicBySlug = new Map(topicRows.map((topic) => [topic.slug, topic.id]));
  const slugify = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const sourceReference = "CAT Arithmetic 320 Questions & Solutions Workbook — original practice material";
  const existingQuestions = await db.select({ id: questions.id, metadata: questions.metadata })
    .from(questions).where(eq(questions.sourceReference, sourceReference));
  let backfilled = 0;
  for (const existing of existingQuestions) {
    const topicName = typeof existing.metadata.topic === "string" ? existing.metadata.topic : "";
    const topicId = topicBySlug.get(slugify(topicName)) ?? null;
    await db.update(questions).set({
      examId: cat.id, examSectionId: qa.id, subjectId: quant.id, topicId,
      updatedAt: new Date(),
    }).where(eq(questions.id, existing.id));
    backfilled++;
  }
  const bank = JSON.parse(await readFile(file, "utf8")) as Bank;
  if (!Array.isArray(bank.questions) || bank.questions.length === 0) throw new Error("No questions found in import file.");

  const concurrency = 4;
  let cursor = 0, imported = 0, duplicates = 0, failed = 0;
  const errors: string[] = [];

  async function worker() {
    while (cursor < bank.questions.length) {
      const q = bank.questions[cursor++];
      const options = q.options.map((option) => ({
        key: option.key, content: option.content,
        isCorrect: q.answerKey ? option.key === q.answerKey : null,
      }));
      const payload = {
        examId: cat.id, examSectionId: qa.id, subjectId: quant.id,
        topicId: topicBySlug.get(slugify(q.topic)) ?? null,
        questionType: "mcq_single", difficulty: q.difficulty, prompt: q.prompt, options,
        sourceReference,
        sourceQuestionNumber: q.sourceQuestionNumber,
        metadata: { topic: q.topic, origin: q.origin, sourceFile: "CAT_Arithmetic_320_Questions_and_Solutions_Workbook.docx",
          sourceFingerprint: q.fingerprint, sourceValidation: q.validation, importedAs: "unpublished_review_queue" },
        ...(q.sourceProvidedSolution ? { solution: { methodName: "Source-provided worked solution", content: q.sourceProvidedSolution,
          answerText: q.answerKey ?? "Source solution requires review; no safe answer key mapped." } } : {}),
      };
      try {
        const response = await fetch(base + "/api/admin/questions", {
          method: "POST", headers: { "content-type": "application/json", "x-admin-import-token": adminToken },
          body: JSON.stringify(payload),
        });
        const result = await response.json() as { status?: string; error?: string };
        if (!response.ok) throw new Error(result.error ?? "HTTP " + response.status);
        if (result.status === "duplicate") duplicates++; else imported++;
      } catch (error) {
        failed++; errors.push(q.topic + " / " + q.sourceQuestionNumber + ": " + (error instanceof Error ? error.message : String(error)));
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  await db.$client.end?.();
  console.log(JSON.stringify({ source: file, total: bank.questions.length, imported, duplicates, failed, taxonomy: { exam: "CAT", section: "QA", subject: "Quantitative Aptitude", mappedTopics: topicRows.length, existingQuestionsBackfilled: backfilled }, errors: errors.slice(0, 30) }, null, 2));
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
