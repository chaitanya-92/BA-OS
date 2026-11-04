import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { exams, examSections, subjects, topics } from "../lib/db/schema";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required in .env.local");

const client = postgres(connectionString, { max: 1, prepare: false });
const db = drizzle(client);

const examCatalog = [
  { name: "CAT", slug: "cat", description: "Common Admission Test", sections: ["VARC", "DILR", "QA"] },
  { name: "XAT", slug: "xat", description: "Xavier Aptitude Test", sections: ["VALR", "Decision Making", "QA & DI", "General Knowledge"] },
  { name: "SNAP", slug: "snap", description: "Symbiosis National Aptitude Test", sections: ["General English", "Analytical & Logical Reasoning", "Quantitative, DI & Data Sufficiency"] },
  { name: "NMAT", slug: "nmat", description: "NMAT by GMAC", sections: ["Language Skills", "Quantitative Skills", "Logical Reasoning"] },
  { name: "CMAT", slug: "cmat", description: "Common Management Admission Test", sections: ["Quantitative Techniques & DI", "Logical Reasoning", "Language Comprehension", "General Awareness", "Innovation & Entrepreneurship"] },
] as const;

const subjectCatalog = [
  {
    name: "Quantitative Aptitude",
    slug: "quantitative-aptitude",
    description: "Arithmetic, algebra, geometry and number systems.",
    topics: [
      "Arithmetic", "Percentages", "Ratio & Proportion", "Averages", "Mixtures & Alligation",
      "Profit, Loss & Discount", "Simple & Compound Interest", "Time, Speed & Distance",
      "Time & Work", "Number System", "Algebra", "Linear & Quadratic Equations",
      "Inequalities", "Functions & Graphs", "Logarithms", "Progressions",
      "Geometry", "Mensuration", "Number System", "Permutation & Combination", "Probability", "Sets & Venn Diagrams", "Binomial Theorem",
    ],
  },
  {
    name: "Data Interpretation & Logical Reasoning",
    slug: "dilr",
    description: "Data interpretation, arrangements and analytical reasoning.",
    topics: [
      "Tables", "Bar & Line Charts", "Caselets", "Data Distribution", "Arrangements",
      "Games & Tournaments", "Scheduling", "Selection & Distribution", "Routes & Networks",
      "Venn Diagrams", "Ranking", "Grouping",
    ],
  },
  {
    name: "Verbal Ability & Reading Comprehension",
    slug: "varc",
    description: "Reading comprehension and verbal ability.",
    topics: [
      "Reading Comprehension", "Para Jumbles", "Para Summary", "Odd Sentence Out",
      "Sentence Completion", "Critical Reasoning",
    ],
  },
] as const;

async function main() {
  await db.transaction(async (tx) => {
    for (const exam of examCatalog) {
      const [savedExam] = await tx.insert(exams).values({
        name: exam.name,
        slug: exam.slug,
        description: exam.description,
      }).onConflictDoUpdate({
        target: exams.slug,
        set: { name: exam.name, description: exam.description, status: "active" },
      }).returning({ id: exams.id });

      for (const [index, section] of exam.sections.entries()) {
        const slug = section.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        await tx.insert(examSections).values({
          examId: savedExam.id,
          name: section,
          slug,
          displayOrder: index + 1,
        }).onConflictDoUpdate({
          target: [examSections.examId, examSections.slug],
          set: { name: section, displayOrder: index + 1 },
        });
      }
    }

    for (const [subjectIndex, subject] of subjectCatalog.entries()) {
      const [savedSubject] = await tx.insert(subjects).values({
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        displayOrder: subjectIndex + 1,
      }).onConflictDoUpdate({
        target: subjects.slug,
        set: { name: subject.name, description: subject.description, displayOrder: subjectIndex + 1 },
      }).returning({ id: subjects.id });

      for (const [topicIndex, topicName] of subject.topics.entries()) {
        const slug = topicName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        await tx.insert(topics).values({
          subjectId: savedSubject.id,
          name: topicName,
          slug,
          displayOrder: topicIndex + 1,
        }).onConflictDoUpdate({
          target: [topics.subjectId, topics.slug],
          set: { name: topicName, displayOrder: topicIndex + 1 },
        });
      }
    }
  });

  const counts = {
    exams: examCatalog.length,
    subjects: subjectCatalog.length,
    topics: subjectCatalog.reduce((total, subject) => total + subject.topics.length, 0),
  };
  process.stdout.write(`MBA OS taxonomy seeded: ${JSON.stringify(counts)}\n`);
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`Database seed failed: ${error instanceof Error ? error.message : "Unknown error"}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
