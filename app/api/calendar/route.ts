import { and, asc, eq, gte, lte, or, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { admissionEvents, colleges, exams } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const parsed = rangeSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid calendar range." }, { status: 400 });

  try {
    const conditions = [
      eq(admissionEvents.isPublished, true),
      ...(parsed.data.from ? [or(gte(admissionEvents.startsAt, new Date(parsed.data.from)), isNull(admissionEvents.startsAt))!] : []),
      ...(parsed.data.to ? [or(lte(admissionEvents.startsAt, new Date(parsed.data.to)), isNull(admissionEvents.startsAt))!] : []),
    ];
    const items = await getDb().select({
      id: admissionEvents.id,
      title: admissionEvents.title,
      eventType: admissionEvents.eventType,
      startsAt: admissionEvents.startsAt,
      endsAt: admissionEvents.endsAt,
      status: admissionEvents.status,
      officialUrl: admissionEvents.officialUrl,
      sourceReference: admissionEvents.sourceReference,
      lastVerifiedAt: admissionEvents.lastVerifiedAt,
      examName: exams.name,
      collegeName: colleges.name,
    }).from(admissionEvents)
      .leftJoin(exams, eq(admissionEvents.examId, exams.id))
      .leftJoin(colleges, eq(admissionEvents.collegeId, colleges.id))
      .where(and(...conditions))
      .orderBy(asc(admissionEvents.startsAt))
      .limit(200);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Admission calendar is temporarily unavailable." }, { status: 503 });
  }
}
