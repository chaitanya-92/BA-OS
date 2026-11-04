import { eq } from "drizzle-orm";
import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession,SESSION_COOKIE,sessionCookieOptions,verifyPassword } from "@/lib/auth/session";
export const runtime="nodejs";
const schema=z.object({email:z.string().trim().email().max(320),password:z.string().min(1).max(128)});
export async function POST(request:NextRequest){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter your email and password."},{status:400});try{const [user]=await getDb().select({id:users.id,email:users.email,displayName:users.displayName,passwordHash:users.passwordHash,isActive:users.isActive}).from(users).where(eq(users.email,parsed.data.email.toLowerCase())).limit(1);if(!user||!user.isActive||!(await verifyPassword(parsed.data.password,user.passwordHash)))return NextResponse.json({error:"Email or password is incorrect."},{status:401});const session=await createSession(user.id);const response=NextResponse.json({user:{id:user.id,email:user.email,displayName:user.displayName}});response.cookies.set(SESSION_COOKIE,session.token,sessionCookieOptions(session.expiresAt));return response;}catch{return NextResponse.json({error:"Sign in is temporarily unavailable."},{status:503});}}
