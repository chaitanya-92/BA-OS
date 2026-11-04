import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { tests } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select({
      id: tests.id,
      title: tests.title,
      slug: tests.slug,
      description: tests.description,
      kind: tests.kind,
      durationMinutes: tests.durationMinutes,
      createdAt: tests.createdAt,
    }).from(tests).where(eq(tests.isPublished, true)).orderBy(asc(tests.title));

    return NextResponse.json({ items: rows });
  } catch {
    return NextResponse.json({ error: "Test catalogue is temporarily unavailable." }, { status: 503 });
  }
}
