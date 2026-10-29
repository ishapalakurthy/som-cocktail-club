import "server-only";
import { randomBytes } from "node:crypto";
import { sql, type EventRow, type GroupKey, type SignupRow } from "./db";
import { GROUP_KEYS } from "./categories";

export async function getEventBySlug(slug: string) {
  const [e] = await sql<EventRow[]>`select * from events where slug = ${slug}`;
  return e ?? null;
}

export async function getEventById(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [e] = await sql<EventRow[]>`select * from events where id = ${id}`;
  return e ?? null;
}

export function capacity(e: EventRow, group: GroupKey) {
  return group === "first" ? e.cap_first : e.cap_second;
}

// What everyone can see: names only, in signup order.
export type LiveGroup = { cap: number; confirmed: string[]; waitlist: string[] };
export type LiveRoster = Record<GroupKey, LiveGroup>;

export async function getLiveRoster(e: EventRow): Promise<LiveRoster> {
  const rows = await sql<{ name: string; group_key: GroupKey; status: string }[]>`
    select name, group_key, status from signups
    where event_id = ${e.id} and status <> 'removed'
    order by created_at`;
  const roster = {} as LiveRoster;
  for (const g of GROUP_KEYS) {
    roster[g] = {
      cap: capacity(e, g),
      confirmed: rows.filter((r) => r.group_key === g && r.status === "confirmed").map((r) => r.name),
      waitlist: rows.filter((r) => r.group_key === g && r.status === "waitlist").map((r) => r.name),
    };
  }
  return roster;
}

export async function getSignupByToken(token: string) {
  const [s] = await sql<SignupRow[]>`select * from signups where token = ${token}`;
  return s ?? null;
}

export async function getSignup(id: string) {
  const [s] = await sql<SignupRow[]>`select * from signups where id = ${id}`;
  return s ?? null;
}

// 1-based place in the waitlist for this person's group, or null if not waitlisted.
export async function waitlistPosition(s: SignupRow) {
  if (s.status !== "waitlist") return null;
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from signups
    where event_id = ${s.event_id} and group_key = ${s.group_key}
      and status = 'waitlist'
      -- compare in SQL: JS Dates drop the microseconds that separate near-simultaneous signups
      and created_at <= (select created_at from signups where id = ${s.id})`;
  return n;
}

// They took themselves off the waitlist (as opposed to giving up a confirmed spot or being removed by a lead).
export function leftWaitlist(s: SignupRow) {
  return s.status === "removed" && s.removed_by === "self" && !s.confirmed_at;
}

export type NewSignup = { name: string; email: string; category: string; group: GroupKey; dietary: string };

export class DuplicateSignupError extends Error {}

// First come, first served: the event row is locked so two people can't both take the last spot.
export async function createSignup(e: EventRow, input: NewSignup) {
  try {
    return await sql.begin(async (tx) => {
      await tx`select id from events where id = ${e.id} for update`;
      const [{ n }] = await tx<{ n: number }[]>`
        select count(*)::int as n from signups
        where event_id = ${e.id} and group_key = ${input.group} and status = 'confirmed'`;
      const confirmed = n < capacity(e, input.group);
      const [s] = await tx<SignupRow[]>`
        insert into signups (event_id, token, name, email, category, group_key, dietary, status, confirmed_at)
        values (${e.id}, ${randomBytes(18).toString("base64url")}, ${input.name}, ${input.email},
                ${input.category}, ${input.group}, ${input.dietary},
                ${confirmed ? "confirmed" : "waitlist"}, ${confirmed ? new Date() : null})
        returning *`;
      return s;
    });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new DuplicateSignupError();
    throw err;
  }
}

export async function removeSignup(id: string, by: string) {
  const [s] = await sql<SignupRow[]>`
    update signups set status = 'removed', removed_at = now(), removed_by = ${by}
    where id = ${id} and status <> 'removed' returning *`;
  return s ?? null;
}

// Move someone from the waitlist into a confirmed spot. Their 24h payment window starts now.
export async function promoteSignup(id: string) {
  const [s] = await sql<SignupRow[]>`
    update signups set status = 'confirmed', confirmed_at = now()
    where id = ${id} and status = 'waitlist' returning *`;
  return s ?? null;
}

// Put a removed person back on the waitlist in their original signup position.
export async function restoreSignup(id: string) {
  try {
    const [s] = await sql<SignupRow[]>`
      update signups set status = 'waitlist', removed_at = null, removed_by = null, confirmed_at = null
      where id = ${id} and status = 'removed' returning *`;
    return s ?? null;
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new DuplicateSignupError();
    throw err;
  }
}

export async function deleteSignup(id: string) {
  await sql`delete from signups where id = ${id} and status = 'removed'`;
}

export async function setPaid(id: string, method: "venmo" | "zelle" | "other" | null) {
  await sql`
    update signups set paid = ${method !== null}, payment_method = ${method},
      paid_at = ${method ? new Date() : null}
    where id = ${id}`;
}
