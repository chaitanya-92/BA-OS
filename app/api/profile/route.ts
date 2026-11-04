import { eq } from "drizzle-orm";
import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
export const runtime="nodejs";export const dynamic="force-dynamic";
const schema=z.object({displayName:z.string().trim().min(2).max(120),bio:z.string().trim().max(500).nullable(),targetExam:z.string().trim().max(80).nullable(),targetYear:z.number().int().min(2026).max(2035).nullable()});
export async function PATCH(request:NextRequest){const user=await getSessionUser();if(!user)return NextResponse.json({error:"Sign in required."},{status:401});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Check the profile fields."},{status:400});const [updated]=await getDb().update(users).set({...parsed.data,updatedAt:new Date()}).where(eq(users.id,user.id)).returning({id:users.id,email:users.email,displayName:users.displayName,bio:users.bio,targetExam:users.targetExam,targetYear:users.targetYear});return NextResponse.json({user:updated});}
