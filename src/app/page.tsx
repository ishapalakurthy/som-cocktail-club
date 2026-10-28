import Link from "next/link";
import { connection } from "next/server";
import { sql, type EventRow } from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { MenuHeader } from "./_components/Crest";

export default async function Home() {
  await connection();
  const events = await sql<EventRow[]>`
    select * from events where not archived and starts_at > now() - interval '1 day'
    order by starts_at`;

  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-6 sm:py-12">
      <div className="sheet">
        <MenuHeader />
        <h1 className="display mt-4 text-center text-5xl">Upcoming events</h1>
        <div className="rule mt-8" />
        {events.length === 0 && <p className="py-8 text-center text-ink/60">No upcoming events yet. Check back soon.</p>}
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/e/${e.slug}`}
            className="flex items-baseline gap-3 border-b border-dashed border-gold py-4 hover:text-navy"
          >
            <span className="display text-2xl">{e.name}</span>
            <span className="flex-1 translate-y-[-4px] border-b border-dotted border-gold/70" />
            <span className="text-sm text-ink/70">{formatDateTime(e.starts_at)}</span>
          </Link>
        ))}
        <Link href="/admin" className="mt-10 block text-center text-xs text-ink/40 hover:text-ink/70">
          Board login
        </Link>
      </div>
    </main>
  );
}
