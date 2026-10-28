"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endSession, requireAdmin, startSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { sendBoardWelcome, sendLoginLink, sendPromotedEmail } from "@/lib/email";
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

// ---------- Sign in (emailed one-time links) ----------

const LINK_TTL_MINUTES = 15;
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function requestLoginLink(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email.endsWith("@yale.edu")) return { error: "Please use your @yale.edu email." };
  const [admin] = await sql<{ id: string; name: string }[]>`select id, name from admins where email = ${email}`;
  if (!admin) return { error: "That email isn't on the board list. Ask a current board member to add you." };

  // Don't let anyone spam a board member's inbox.
  const [recent] = await sql`
    select 1 from admin_login_tokens
    where admin_id = ${admin.id} and created_at > now() - interval '1 minute'`;
  if (!recent) {
    const token = randomBytes(32).toString("base64url");
    await sql`
      insert into admin_login_tokens (token_hash, admin_id, expires_at)
      values (${hashToken(token)}, ${admin.id}, now() + make_interval(mins => ${LINK_TTL_MINUTES}))`;
    await sendLoginLink(email, admin.name, `${process.env.APP_URL}/admin/login/verify?token=${token}`);
  }
  return { ok: `Check ${email} for a sign-in link. It expires in ${LINK_TTL_MINUTES} minutes.` };
}

// Called from the "Sign in" button on the link's page (not on page load, so email
// security scanners that pre-open links can't use up the one-time link).
export async function signInWithToken(token: string): Promise<FormState> {
  const [row] = await sql<{ admin_id: string }[]>`
    update admin_login_tokens set used_at = now()
    where token_hash = ${hashToken(token)} and used_at is null and expires_at > now()
    returning admin_id`;
  if (!row) return { error: "This sign-in link has expired or was already used. Request a new one." };
  await startSession(row.admin_id);
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

// ---------- Board members (only signed-in board members can change the list) ----------

export async function addBoardMember(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Please enter their name." };
  if (!/^[^\s@]+@yale\.edu$/.test(email)) return { error: "Board members must use a @yale.edu email." };
  try {
    await sql`insert into admins (email, name, added_by) values (${email}, ${name}, ${me.email})`;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") return { error: "That email is already on the board." };
    throw err;
  }
  await sendBoardWelcome(email, name, me.name);
  revalidatePath("/admin/board");
  return { ok: `Added ${name}. They can now sign in with ${email}.` };
}

export async function removeBoardMember(adminId: string): Promise<FormState> {
  const me = await requireAdmin();
  if (adminId === me.id) return { error: "You can't remove yourself. Ask another board member to do it." };
  await sql`delete from admins where id = ${adminId}`;
  revalidatePath("/admin/board");
  return {};
}
