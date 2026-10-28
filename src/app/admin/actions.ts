"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, requireAdmin, startSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { sendPromotedEmail } from "@/lib/email";
import {
  deleteSignup,
  DuplicateSignupError,
  getEventById,
  getSignup,
  promoteSignup,
  removeSignup,
  restoreSignup,
  setPaid,
} from "@/lib/signups";
import { fromLocalInput } from "@/lib/time";

export type FormState = { error?: string; ok?: string };

// ---------- Login ----------

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [admin] = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash from admins where email = ${email}`;
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return { error: "Wrong email or password." };
  }
  await startSession(admin.id);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ---------- Events ----------

export async function saveEvent(eventId: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const get = (k: string) => String(form.get(k) ?? "").trim();

  const name = get("name");
  const slug = get("slug").toLowerCase();
  const startsAt = get("starts_at");
  const opensAt = get("opens_at");
  const capFirst = Number(get("cap_first"));
  const capSecond = Number(get("cap_second"));
  const price = Number(get("price") || "0");

  if (!name) return { error: "Event name is required." };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Link name can only use lowercase letters, numbers and dashes (e.g. spooky-pre)." };
  }
  if (!startsAt || !opensAt) return { error: "Please set both the event time and the signup unlock time." };
  if (![capFirst, capSecond].every((n) => Number.isInteger(n) && n >= 0)) {
    return { error: "Capacities must be whole numbers (0 or more)." };
  }
  if (!(price >= 0)) return { error: "Price must be a number." };

  const values = {
    name,
    slug,
    description: get("description"),
    location: get("location"),
    starts_at: fromLocalInput(startsAt),
    opens_at: fromLocalInput(opensAt),
    price_cents: Math.round(price * 100),
    venmo_handle: get("venmo_handle").replace(/^@/, ""),
    zelle_info: get("zelle_info"),
    cap_first: capFirst,
    cap_second: capSecond,
  };

  let id = eventId;
  try {
    if (eventId) {
      await sql`update events set ${sql(values)} where id = ${eventId}`;
    } else {
      [{ id }] = await sql<{ id: string }[]>`insert into events ${sql(values)} returning id`;
    }
  } catch (err) {
    if ((err as { code?: string }).code === "23505") return { error: "Another event already uses that link name." };
    throw err;
  }
  revalidatePath("/admin");
  redirect(`/admin/events/${id}`);
}

export async function setArchived(eventId: string, archived: boolean) {
  await requireAdmin();
  await sql`update events set archived = ${archived} where id = ${eventId}`;
  revalidatePath("/admin");
}

// ---------- Roster ----------

export async function promote(signupId: string) {
  await requireAdmin();
  const s = await promoteSignup(signupId);
  if (s) {
    const event = await getEventById(s.event_id);
    if (event) await sendPromotedEmail(event, s);
  }
  revalidatePath("/admin/events/[id]", "page");
}

export async function remove(signupId: string) {
  const admin = await requireAdmin();
  await removeSignup(signupId, admin.email);
  revalidatePath("/admin/events/[id]", "page");
}

export async function restore(signupId: string): Promise<FormState> {
  await requireAdmin();
  try {
    await restoreSignup(signupId);
  } catch (err) {
    if (err instanceof DuplicateSignupError) return { error: "This person already has another active signup." };
    throw err;
  }
  revalidatePath("/admin/events/[id]", "page");
  return {};
}

export async function deleteForever(signupId: string) {
  await requireAdmin();
  await deleteSignup(signupId);
  revalidatePath("/admin/events/[id]", "page");
}

export async function markPaid(signupId: string, method: "venmo" | "zelle" | "other" | null) {
  await requireAdmin();
  if (!(await getSignup(signupId))) return;
  await setPaid(signupId, method);
  revalidatePath("/admin/events/[id]", "page");
}

// ---------- Board members ----------

export async function addBoardMember(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email.includes("@") || !name) return { error: "Name and email are required." };
  if (password.length < 8) return { error: "Temporary password must be at least 8 characters." };
  try {
    await sql`insert into admins (email, name, password_hash)
              values (${email}, ${name}, ${await bcrypt.hash(password, 10)})`;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") return { error: "That email is already a board member." };
    throw err;
  }
  revalidatePath("/admin/board");
  return { ok: `Added ${name}. Send them the temporary password privately.` };
}

export async function removeBoardMember(adminId: string) {
  const me = await requireAdmin();
  if (adminId === me.id) return;
  await sql`delete from admins where id = ${adminId}`;
  revalidatePath("/admin/board");
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  await sql`update admins set password_hash = ${await bcrypt.hash(password, 10)} where id = ${me.id}`;
  return { ok: "Password updated." };
}
