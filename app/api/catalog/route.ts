import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { examSections, exams, subjects, topics } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [examRows, sectionRows, subjectRows, topicRows] = await Promise.all([
      db.select({ id: exams.id, name: exams.name, slug: exams.slug })
        .from(exams).where(eq(exams.status, "active")).orderBy(asc(exams.name)),
      db.select({ id: examSections.id, examId: examSections.examId, name: examSections.name, slug: examSections.slug })
        .from(examSections).orderBy(asc(examSections.displayOrder)),
      db.select({ id: subjects.id, name: subjects.name, slug: subjects.slug })
        .from(subjects).orderBy(asc(subjects.displayOrder)),
      db.select({ id: topics.id, subjectId: topics.subjectId, name: topics.name, slug: topics.slug })
        .from(topics).orderBy(asc(topics.displayOrder)),
    ]);
    return NextResponse.json({ exams: examRows, sections: sectionRows, subjects: subjectRows, topics: topicRows });
  } catch {
    return NextResponse.json({ error: "Exam catalogue is temporarily unavailable." }, { status: 503 });
  }
}
