import Link from "next/link";
import { sql, type EventRow } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Events · Cocktail Club Board" };

type Row = EventRow & { confirmed_first: number; confirmed_second: number; waitlist: number; paid: number };

export default async function AdminHome(props: PageProps<"/admin">) {
  const showArchived = (await props.searchParams).archived === "1";
  const events = await sql<Row[]>`
    select e.*,
      count(*) filter (where s.status = 'confirmed' and s.group_key = 'first')::int  as confirmed_first,
      count(*) filter (where s.status = 'confirmed' and s.group_key = 'second')::int as confirmed_second,
      count(*) filter (where s.status = 'waitlist')::int as waitlist,
      count(*) filter (where s.status = 'confirmed' and s.paid)::int as paid
    from events e left join signups s on s.event_id = e.id
    where e.archived = ${showArchived}
    group by e.id
    order by e.starts_at desc`;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="title">{showArchived ? "Archived events" : "Events"}</h1>
        <Link href="/admin/events/new" className="btn-primary">+ New event</Link>
      </div>
      <div className="mt-6 border-t border-dashed border-gold">
        {events.length === 0 && <p className="py-4 text-ink/55">No events yet.</p>}
        {events.map((e) => {
          const confirmed = e.confirmed_first + e.confirmed_second;
          return (
            <Link key={e.id} href={`/admin/events/${e.id}`} className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-dashed border-gold py-4 hover:text-navy">
              <div className="min-w-56 flex-1">
                <div className="heading">{e.name}</div>
                <div className="text-sm font-medium">{formatDateTime(e.starts_at)}</div>
                <div className="text-sm text-ink/65">📍 {e.location}</div>
              </div>
              <Stat label="1st Years" value={`${e.confirmed_first}/${e.cap_first}`} />
              <Stat label="2nd Years" value={`${e.confirmed_second}/${e.cap_second}`} />
              <Stat label="Waitlist" value={e.waitlist} />
              <Stat label="Paid" value={`${e.paid}/${confirmed}`} />
            </Link>
          );
        })}
      </div>
      <Link href={showArchived ? "/admin" : "/admin?archived=1"} className="mt-8 inline-block text-sm text-ink/55 hover:underline">
        {showArchived ? "← Back to events" : "View archived events"}
      </Link>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="heading tabular-nums">{value}</div>
      <div className="text-xs text-ink/55">{label}</div>
    </div>
  );
}
