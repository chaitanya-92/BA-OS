import { eq } from "drizzle-orm";
import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession,hashPassword,SESSION_COOKIE,sessionCookieOptions } from "@/lib/auth/session";
export const runtime="nodejs";
const schema=z.object({email:z.string().trim().email().max(320),password:z.string().min(10).max(128),displayName:z.string().trim().min(2).max(120)});
export async function POST(request:NextRequest){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter a valid email, name and password (at least 10 characters)."}, {status:400});const email=parsed.data.email.toLowerCase();try{const db=getDb();const [existing]=await db.select({id:users.id}).from(users).where(eq(users.email,email)).limit(1);if(existing)return NextResponse.json({error:"An account with this email already exists."},{status:409});const [user]=await db.insert(users).values({email,passwordHash:await hashPassword(parsed.data.password),displayName:parsed.data.displayName}).returning({id:users.id,email:users.email,displayName:users.displayName});const session=await createSession(user.id);const response=NextResponse.json({user});response.cookies.set(SESSION_COOKIE,session.token,sessionCookieOptions(session.expiresAt));return response;}catch{return NextResponse.json({error:"Account could not be created. Please try again."},{status:503});}}
