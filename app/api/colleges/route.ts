import { asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { collegePrograms, colleges } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select({
      id: colleges.id,
      name: colleges.name,
      slug: colleges.slug,
      city: colleges.city,
      state: colleges.state,
      website: colleges.website,
      collegeType: colleges.collegeType,
      description: colleges.description,
      verifiedAt: colleges.verifiedAt,
      sourceReference: colleges.sourceReference,
    }).from(colleges).where(eq(colleges.status, "active")).orderBy(asc(colleges.name)).limit(200);

    const ids = rows.map((college) => college.id);
    const programs = ids.length ? await db.select({
      id: collegePrograms.id,
      collegeId: collegePrograms.collegeId,
      name: collegePrograms.name,
      degree: collegePrograms.degree,
      specialization: collegePrograms.specialization,
      feeMin: collegePrograms.feeMin,
      feeMax: collegePrograms.feeMax,
      averagePackage: collegePrograms.averagePackage,
      medianPackage: collegePrograms.medianPackage,
      placementYear: collegePrograms.placementYear,
      sourceReference: collegePrograms.sourceReference,
    }).from(collegePrograms).where(eq(collegePrograms.isPublished, true)) : [];

    return NextResponse.json({
      items: rows.map((college) => ({
        ...college,
        programs: programs.filter((program) => program.collegeId === college.id),
      })),
    });
  } catch {
    return NextResponse.json({ error: "College directory is temporarily unavailable." }, { status: 503 });
  }
}
