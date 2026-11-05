#!/usr/bin/env tsx
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import {
  exams,
  examSections,
  questionOptions,
  questions,
  solutions,
  sources,
  subjects,
  topics,
} from "../lib/db/schema";

config({ path: ".env.local" });

type BankQuestion = {
  topic: string;
  difficulty: "easy" | "moderate" | "difficult" | "unrated";
  origin: "original_practice" | "pyq_pattern_practice";
  sourceQuestionNumber: string;
  prompt: string;
  options: { key: string; content: string }[];
  answerKey: string | null;
  sourceProvidedSolution: string | null;
  validation: string;
  fingerprint: string;
};
type Bank = { questions: BankQuestion[] };

async function main() {
  const file = process.argv[2] ?? "data/imports/cat-arithmetic-320-original.json";
  const db = getDb();

  try {
    const [cat] = await db.select({ id: exams.id })
      .from(exams).where(eq(exams.slug, "cat")).limit(1);
    const [qa] = cat
      ? await db.select({ id: examSections.id }).from(examSections)
          .where(and(eq(examSections.examId, cat.id), eq(examSections.slug, "qa"))).limit(1)
      : [];
    const [quant] = await db.select({ id: subjects.id })
      .from(subjects).where(eq(subjects.slug, "quantitative-aptitude")).limit(1);

    if (!cat || !qa || !quant) {
      throw new Error("CAT taxonomy is missing. Run npm run db:bootstrap first.");
    }

    const topicRows = await db.select({ id: topics.id, slug: topics.slug })
      .from(topics).where(eq(topics.subjectId, quant.id));
    const topicBySlug = new Map(topicRows.map((topic) => [topic.slug, topic.id]));
    const slugify = (value: string) => {
      const normalized = value.toLowerCase().replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (normalized === "profit-and-loss" || normalized === "profit-loss") {
        return "profit-loss-and-discount";
      }
      return normalized;
    };

    const sourceReference = "CAT Arithmetic 320 Questions & Solutions Workbook — original practice material";
    let [source] = await db.select({ id: sources.id }).from(sources)
      .where(eq(sources.name, sourceReference)).limit(1);
    if (!source) {
      [source] = await db.insert(sources).values({
        name: sourceReference,
        kind: "original_practice",
        rightsNote: "Original practice material supplied for the user's study library; not represented as official CAT previous-year questions.",
        notes: "Imported into the unpublished question review queue. Review question wording and answer keys before publication.",
      }).returning({ id: sources.id });
    }

    // Backfill taxonomy for an earlier import of this same workbook.
    const existingQuestions = await db.select({
      id: questions.id,
      metadata: questions.metadata,
    }).from(questions).where(eq(questions.sourceReference, sourceReference));
    let backfilled = 0;
    for (const existing of existingQuestions) {
      const topicName = typeof existing.metadata.topic === "string" ? existing.metadata.topic : "";
      const topicId = topicBySlug.get(slugify(topicName)) ?? null;
      await db.update(questions).set({
        examId: cat.id,
        examSectionId: qa.id,
        subjectId: quant.id,
        topicId,
        updatedAt: new Date(),
      }).where(eq(questions.id, existing.id));
      backfilled++;
    }

    const bank = JSON.parse(await readFile(file, "utf8")) as Bank;
    if (!Array.isArray(bank.questions) || bank.questions.length === 0) {
      throw new Error("No questions found in import file.");
    }

    let cursor = 0;
    let imported = 0;
    let duplicates = 0;
    let failed = 0;
    const errors: string[] = [];
    const concurrency = 4;

    async function worker() {
      while (cursor < bank.questions.length) {
        const q = bank.questions[cursor++];
        const topicId = topicBySlug.get(slugify(q.topic)) ?? null;
        const fingerprint = createHash("sha256")
          .update([
            cat.id,
            "unknown-year",
            "unknown-slot",
            sourceReference,
            q.prompt.replace(/\s+/g, " ").trim().toLowerCase(),
          ].join("|"))
          .digest("hex");

        try {
          const outcome = await db.transaction(async (tx) => {
            const [inserted] = await tx.insert(questions).values({
              examId: cat.id,
              examSectionId: qa.id,
              subjectId: quant.id,
              topicId,
              sourceId: source.id,
              sourceReference,
              sourceQuestionNumber: q.sourceQuestionNumber,
              questionType: "mcq_single",
              difficulty: q.difficulty,
              prompt: q.prompt,
              contentFingerprint: fingerprint,
              isPublished: false,
              verificationStatus: "unreviewed",
              metadata: {
                topic: q.topic,
                origin: q.origin,
                sourceFile: "CAT_Arithmetic_320_Questions_and_Solutions_Workbook.docx",
                sourceFingerprint: q.fingerprint,
                sourceValidation: q.validation,
                importedAs: "unpublished_review_queue",
              },
            }).onConflictDoNothing({ target: questions.contentFingerprint })
              .returning({ id: questions.id });

            if (!inserted) return "duplicate" as const;

            if (q.options.length) {
              await tx.insert(questionOptions).values(q.options.map((option, index) => ({
                questionId: inserted.id,
                optionKey: option.key,
                content: option.content,
                isCorrect: q.answerKey ? option.key === q.answerKey : null,
                displayOrder: index + 1,
              })));
            }

            if (q.sourceProvidedSolution) {
              await tx.insert(solutions).values({
                questionId: inserted.id,
                methodName: "Source-provided worked solution",
                content: q.sourceProvidedSolution,
                answerText: q.answerKey ?? "Source solution requires review; no answer key was mapped.",
                answerVerification: "unreviewed",
                isEditorial: false,
              });
            }
            return "imported" as const;
          });

          if (outcome === "duplicate") duplicates++;
          else imported++;
        } catch (error) {
          failed++;
          errors.push(
            q.topic + " / " + q.sourceQuestionNumber + ": " +
            (error instanceof Error ? error.message : String(error)),
          );
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    console.log(JSON.stringify({
      source: file,
      total: bank.questions.length,
      imported,
      duplicates,
      failed,
      status: "Imported questions are drafts and require review before students can see them.",
      taxonomy: {
        exam: "CAT",
        section: "QA",
        subject: "Quantitative Aptitude",
        mappedTopics: topicRows.length,
        existingQuestionsBackfilled: backfilled,
      },
      errors: errors.slice(0, 30),
    }, null, 2));

    if (failed) process.exitCode = 1;
  } finally {
    await db.$client.end?.();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
