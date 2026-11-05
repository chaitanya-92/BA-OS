import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { contentEntries, questions, studyResources, tests } from "../lib/db/schema";

config({ path: ".env.local" });

async function countRows(query: PromiseLike<{ count: number }[]>) {
  const [row] = await query;
  return Number(row?.count ?? 0);
}

async function main() {
  const db = getDb();
  const report = {
    learningResources: {
      publishedContentEntries: await countRows(db.select({ count: sql<number>`count(*)::int` }).from(contentEntries).where(eq(contentEntries.status, "published"))),
      drafts: await countRows(db.select({ count: sql<number>`count(*)::int` }).from(contentEntries).where(eq(contentEntries.status, "draft"))),
      publishedStudyResources: await countRows(db.select({ count: sql<number>`count(*)::int` }).from(studyResources).where(eq(studyResources.isPublished, true))),
    },
    questionBank: {
      published: await countRows(db.select({ count: sql<number>`count(*)::int` }).from(questions).where(eq(questions.isPublished, true))),
      pendingReview: await countRows(db.select({ count: sql<number>`count(*)::int` }).from(questions).where(eq(questions.isPublished, false))),
    },
    tests: {
      published: await countRows(db.select({ count: sql<number>`count(*)::int` }).from(tests).where(eq(tests.isPublished, true))),
      drafts: await countRows(db.select({ count: sql<number>`count(*)::int` }).from(tests).where(eq(tests.isPublished, false))),
    },
  };
  console.log(JSON.stringify(report, null, 2));
  await db.$client.end();
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
