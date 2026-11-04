import { NextRequest,NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { destroyCurrentSession,SESSION_COOKIE } from "@/lib/auth/session";
export const runtime="nodejs";
export async function POST(request:NextRequest){try{await destroyCurrentSession(request.cookies.get(SESSION_COOKIE)?.value);}catch{}const response=NextResponse.json({ok:true});response.cookies.set(SESSION_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});return response;}
