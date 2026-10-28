import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { sql } from "./db";

const COOKIE = "cc_admin";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export type Admin = { id: string; email: string; name: string };

export async function startSession(adminId: string) {
  const token = await new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function getAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    // Look the admin up each time so removing a board member logs them out immediately.
    const [admin] = await sql<Admin[]>`select id, email, name from admins where id = ${payload.sub!}`;
    return admin ?? null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
