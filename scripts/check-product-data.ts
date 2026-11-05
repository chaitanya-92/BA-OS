import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { contentEntries, questions, studyResources, tests } from "../lib/db/schema";

config({ path: ".env.local" });

async function count(table: typeof contentEntries | typeof questions | typeof studyResources | typeof tests, where?: ReturnType<typeof eq>) {
  const db = getDb();
  const query = db.select({ count: sql<number>`count(*)::int` }).from(table);
  const [row] = where ? await query.where(where) : await query;
  return Number(row?.count ?? 0);
}

async function main() {
  const db = getDb();
  const report = {
    learningResources: {
      publishedContentEntries: await count(contentEntries, eq(contentEntries.status, "published")),
      drafts: await count(contentEntries, eq(contentEntries.status, "draft")),
      publishedStudyResources: await count(studyResources, eq(studyResources.isPublished, true)),
    },
    questionBank: {
      published: await count(questions, eq(questions.isPublished, true)),
      pendingReview: await count(questions, eq(questions.isPublished, false)),
    },
    tests: {
      published: await count(tests, eq(tests.isPublished, true)),
      drafts: await count(tests, eq(tests.isPublished, false)),
    },
  };
  console.log(JSON.stringify(report, null, 2));
  await db.$client.end();
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
