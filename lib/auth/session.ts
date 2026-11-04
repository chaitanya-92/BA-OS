import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
const scrypt=promisify(scryptCallback);
export const SESSION_COOKIE="mba_os_session";
export const SESSION_TTL_DAYS=30;
export type SessionUser={id:string;email:string;displayName:string;avatarUrl:string|null;bio:string|null;targetExam:string|null;targetYear:number|null;role:string};
export function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function hashPassword(password:string){const salt=randomBytes(16).toString("hex");const derived=await scrypt(password,salt,64) as Buffer;return salt+":"+derived.toString("hex");}
export async function verifyPassword(password:string,stored:string){const [salt,hash]=stored.split(":");if(!salt||!hash)return false;const derived=await scrypt(password,salt,64) as Buffer;const expected=Buffer.from(hash,"hex");return expected.length===derived.length&&timingSafeEqual(expected,derived);}
export async function createSession(userId:string){const token=randomBytes(32).toString("hex");const expiresAt=new Date(Date.now()+SESSION_TTL_DAYS*86400000);await getDb().insert(sessions).values({userId,tokenHash:hashToken(token),expiresAt});return {token,expiresAt};}
export async function getSessionUser():Promise<SessionUser|null>{const store=await cookies();const token=store.get(SESSION_COOKIE)?.value;if(!token||token.length!==64)return null;const [row]=await getDb().select({id:users.id,email:users.email,displayName:users.displayName,avatarUrl:users.avatarUrl,bio:users.bio,targetExam:users.targetExam,targetYear:users.targetYear,role:users.role}).from(sessions).innerJoin(users,eq(sessions.userId,users.id)).where(and(eq(sessions.tokenHash,hashToken(token)),gt(sessions.expiresAt,new Date()),eq(users.isActive,true))).limit(1);return row??null;}
export function sessionCookieOptions(expiresAt:Date){return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",expires:expiresAt};}
export async function destroyCurrentSession(token:string|undefined){if(token&&token.length===64)await getDb().delete(sessions).where(eq(sessions.tokenHash,hashToken(token)));}
