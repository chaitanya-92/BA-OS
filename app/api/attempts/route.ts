import { desc,eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { attempts,tests } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
export const dynamic="force-dynamic";
export async function GET(){const user=await getSessionUser();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});try{const items=await getDb().select({id:attempts.id,testId:attempts.testId,testTitle:tests.title,status:attempts.status,score:attempts.score,correctCount:attempts.correctCount,incorrectCount:attempts.incorrectCount,unansweredCount:attempts.unansweredCount,timeSpentSeconds:attempts.timeSpentSeconds,startedAt:attempts.startedAt,submittedAt:attempts.submittedAt}).from(attempts).innerJoin(tests,eq(attempts.testId,tests.id)).where(eq(attempts.userId,user.id)).orderBy(desc(attempts.startedAt)).limit(100);return NextResponse.json({items});}catch{return NextResponse.json({error:"Attempt history unavailable."},{status:503});}}
