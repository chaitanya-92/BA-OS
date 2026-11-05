#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";

type BankQuestion = {
  topic: string; difficulty: "easy" | "moderate" | "difficult" | "unrated";
  origin: "original_practice" | "pyq_pattern_practice";
  sourceQuestionNumber: string; prompt: string;
  options: { key: string; content: string }[];
  answerKey: string | null; sourceProvidedSolution: string | null;
  validation: string; fingerprint: string;
};
type Bank = { questions: BankQuestion[] };
const file = process.argv[2] ?? "data/imports/cat-arithmetic-320-original.json";
const base = process.env.MBA_OS_BASE_URL?.replace(/\/$/, "");
const token = process.env.ADMIN_IMPORT_TOKEN;
if (!base || !token) throw new Error("Set MBA_OS_BASE_URL and ADMIN_IMPORT_TOKEN before importing.");
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
      questionType: "mcq_single", difficulty: q.difficulty, prompt: q.prompt, options,
      sourceReference: "CAT Arithmetic 320 Questions & Solutions Workbook — original practice material",
      sourceQuestionNumber: q.sourceQuestionNumber,
      metadata: { topic: q.topic, origin: q.origin, sourceFile: "CAT_Arithmetic_320_Questions_and_Solutions_Workbook.docx",
        sourceFingerprint: q.fingerprint, sourceValidation: q.validation, importedAs: "unpublished_review_queue" },
      ...(q.sourceProvidedSolution ? { solution: { methodName: "Source-provided worked solution", content: q.sourceProvidedSolution,
        answerText: q.answerKey ?? "Source solution requires review; no safe answer key mapped." } } : {}),
    };
    try {
      const response = await fetch(base + "/api/admin/questions", {
        method: "POST", headers: { "content-type": "application/json", "x-admin-import-token": token },
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
console.log(JSON.stringify({ source: file, total: bank.questions.length, imported, duplicates, failed, errors: errors.slice(0, 30) }, null, 2));
if (failed) process.exitCode = 1;
