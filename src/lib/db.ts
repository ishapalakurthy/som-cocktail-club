import "server-only";
import postgres from "postgres";

// Reuse one connection pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false, // required for Supabase's connection pooler
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export type GroupKey = "first" | "second";
export type Status = "confirmed" | "waitlist" | "removed";

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  starts_at: Date;
  opens_at: Date;
  price_cents: number;
  venmo_handle: string;
  zelle_info: string;
  cap_first: number;
  cap_second: number;
  archived: boolean;
  created_at: Date;
};

export type SignupRow = {
  id: string;
  event_id: string;
  token: string;
  name: string;
  email: string;
  category: string;
  group_key: GroupKey;
  dietary: string;
  status: Status;
  created_at: Date;
  confirmed_at: Date | null;
  paid: boolean;
  payment_method: "venmo" | "zelle" | "other" | null;
  paid_at: Date | null;
  removed_at: Date | null;
  removed_by: string | null;
  partner_of: string | null; // set on a partner's row: the student who brought them
  together: boolean; // pair only gets in (or waits) as a unit
};
