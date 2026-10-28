import Link from "next/link";
import { connection } from "next/server";
import { sql, type EventRow } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export default async function Home() {
  await connection();
  const events = await sql<EventRow[]>`
    select * from events where not archived and starts_at > now() - interval '1 day'
    order by starts_at`;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">🍸 Cocktail Club</h1>
      <p className="mt-1 text-stone-600">Upcoming events</p>
      <div className="mt-6 space-y-3">
        {events.length === 0 && <p className="text-stone-500">No upcoming events yet. Check back soon!</p>}
        {events.map((e) => (
          <Link key={e.id} href={`/e/${e.slug}`} className="card block hover:border-rose-300">
            <div className="font-semibold">{e.name}</div>
            <div className="text-sm text-stone-600">{formatDateTime(e.starts_at)}</div>
          </Link>
        ))}
      </div>
      <Link href="/admin" className="mt-10 block text-xs text-stone-400 hover:text-stone-600">
        Board login
      </Link>
    </main>
  );
}
