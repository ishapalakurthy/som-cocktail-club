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
  const raw = await sql<{ name: string; group_key: GroupKey; status: string; partner_of_name: string | null }[]>`
    select s.name, s.group_key, s.status, p.name as partner_of_name
    from signups s left join signups p on p.id = s.partner_of
    where s.event_id = ${e.id} and s.status <> 'removed'
    order by s.created_at`;
  const rows = raw.map((r) => ({
    ...r,
    name: r.partner_of_name ? `${r.name} (${r.partner_of_name.trim().split(/\s+/)[0]}'s partner)` : r.name,
  }));
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

// What a student's private page shows, including their partner if they brought one.
export async function statusFor(s: SignupRow) {
  const p = await getPartner(s);
  return {
    status: s.status,
    position: await waitlistPosition(s),
    confirmedAt: s.confirmed_at?.toISOString() ?? null,
    paid: s.paid,
    leftWaitlist: leftWaitlist(s),
    partner: p && {
      name: p.name,
      status: p.status,
      position: await waitlistPosition(p),
      together: p.together,
      paid: p.paid,
    },
  };
}
export type SignupStatus = Awaited<ReturnType<typeof statusFor>>;

export type NewSignup = { name: string; email: string; category: string; group: GroupKey; dietary: string };
export type NewPartner = { name: string; dietary: string; together: boolean };

export class DuplicateSignupError extends Error {}

// First come, first served: the event row is locked so two people can't both take the last spot.
// A partner takes a second spot. Together pairs need two free spots or both wait; otherwise the
// student takes a spot first and the partner gets one only if another is free.
export async function createSignup(e: EventRow, input: NewSignup, partner?: NewPartner) {
  try {
    return await sql.begin(async (tx) => {
      await tx`select id from events where id = ${e.id} for update`;
      const [{ n }] = await tx<{ n: number }[]>`
        select count(*)::int as n from signups
        where event_id = ${e.id} and group_key = ${input.group} and status = 'confirmed'`;
      const cap = capacity(e, input.group);
      const meIn = partner?.together ? n + 2 <= cap : n < cap;
      const partnerIn = n + 2 <= cap;
      const insert = (name: string, dietary: string, confirmed: boolean, partnerOf: string | null) => tx<SignupRow[]>`
        insert into signups (event_id, token, name, email, category, group_key, dietary, status, confirmed_at, partner_of, together)
        values (${e.id}, ${randomBytes(18).toString("base64url")}, ${name}, ${input.email},
                ${input.category}, ${input.group}, ${dietary},
                ${confirmed ? "confirmed" : "waitlist"}, ${confirmed ? new Date() : null},
                ${partnerOf}, ${partner?.together ?? true})
        returning *`;
      const [s] = await insert(input.name, input.dietary, meIn, null);
      if (partner) await insert(partner.name, partner.dietary, partnerIn, s.id);
      return s;
    });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") throw new DuplicateSignupError();
    throw err;
  }
}

// The student's partner row, if they brought one (any status).
export async function getPartner(s: SignupRow) {
  const [p] = await sql<SignupRow[]>`select * from signups where partner_of = ${s.id} order by created_at desc limit 1`;
  return p ?? null;
}

// Ids of this signup and whoever it's paired with (student <-> partner).
async function pairIds(id: string) {
  const rows = await sql<{ id: string }[]>`
    with me as (select id, partner_of from signups where id = ${id})
    select id from signups
    where id in (select id from me) or partner_of in (select id from me) or id in (select partner_of from me)`;
  return rows.map((r) => r.id);
}

// Remove one person, or (withPair) them and whoever they're paired with.
export async function removeSignup(id: string, by: string, withPair = false) {
  const ids = withPair ? await pairIds(id) : [id];
  const rows = await sql<SignupRow[]>`
    update signups set status = 'removed', removed_at = now(), removed_by = ${by}
    where id in ${sql(ids)} and status <> 'removed' returning *`;
  return rows.find((r) => r.id === id) ?? rows[0] ?? null;
}

// Move someone from the waitlist into a confirmed spot. Their 24h payment window starts now.
// A together pair always moves up as a unit.
export async function promoteSignup(id: string) {
  const [me] = await sql<SignupRow[]>`select * from signups where id = ${id}`;
  if (!me) return null;
  const ids = me.together ? await pairIds(id) : [id];
  const rows = await sql<SignupRow[]>`
    update signups set status = 'confirmed', confirmed_at = now()
    where id in ${sql(ids)} and status = 'waitlist' returning *`;
  return rows.find((r) => r.id === id) ?? null;
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

// A pair pays together, so marking one marks whichever of the two are confirmed.
export async function setPaid(id: string, method: "venmo" | "zelle" | "other" | null) {
  const ids = await pairIds(id);
  await sql`
    update signups set paid = ${method !== null}, payment_method = ${method},
      paid_at = ${method ? new Date() : null}
    where id = ${id} or (id in ${sql(ids)} and status = 'confirmed')`;
}
