import { sql } from "@/lib/db";

// Supabase's free plan pauses a project after 7 days without database activity. Vercel calls this
// once a day (see vercel.json) and it runs one tiny read so the project never looks idle.
// Read-only and returns nothing private, so it's safe for anyone to call.
export async function GET() {
  const [{ events }] = await sql<{ events: number }[]>`select count(*)::int as events from events`;
  return Response.json({ ok: true, events, at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
