import Link from "next/link";
import { sql, type EventRow } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata = { title: "Events · SOM Cocktail Club" };

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
        <h1 className="title">Events</h1>
        <Link href="/admin/events/new" className="btn-primary">New event</Link>
      </div>

      {/* Phones: one stacked block per event instead of the wide table. */}
      <div className="mt-6 sm:hidden">
        <div className="border-b border-line pb-2 text-sm text-ink/60">{showArchived ? "Archived" : "Upcoming"}</div>
        {events.length === 0 && <p className="py-6 text-ink/60">No events yet.</p>}
        {events.map((e) => (
          <Link key={e.id} href={`/admin/events/${e.id}`} className="block border-b border-line-soft py-4">
            <div className="heading">{e.name}</div>
            <div className="mt-1 text-sm text-ink/60">
              {formatDateTime(e.starts_at)} · {e.location}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <MobileCount label="1st years" taken={e.confirmed_first} cap={e.cap_first} />
              <MobileCount label="2nd years" taken={e.confirmed_second} cap={e.cap_second} />
              <div><span className="text-ink/60">Waitlist</span> <b className="tabular-nums">{e.waitlist}</b></div>
              <div>
                <span className="text-ink/60">Paid</span>{" "}
                <b className="tabular-nums">{e.paid}/{e.confirmed_first + e.confirmed_second}</b>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-line text-sm text-ink/60">
              <th className="pb-3 text-left font-normal">{showArchived ? "Archived" : "Upcoming"}</th>
              <th className="w-28 pb-3 text-right font-normal">1st years</th>
              <th className="w-32 pb-3 text-right font-normal">2nd years</th>
              <th className="w-24 pb-3 text-right font-normal">Waitlist</th>
              <th className="w-24 pb-3 text-right font-normal">Paid</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-ink/60">No events yet.</td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="relative border-b border-line-soft hover:bg-navy/[0.03]">
                <td className="py-5 pr-6">
                  {/* The link covers the whole row so any part of it opens the roster. */}
                  <Link href={`/admin/events/${e.id}`} className="heading after:absolute after:inset-0">
                    {e.name}
                  </Link>
                  <div className="mt-1 text-sm text-ink/60">
                    {formatDateTime(e.starts_at)} · {e.location}
                  </div>
                </td>
                <CountCell taken={e.confirmed_first} cap={e.cap_first} />
                <CountCell taken={e.confirmed_second} cap={e.cap_second} />
                <td className="py-5 text-right tabular-nums">{e.waitlist}</td>
                <td className="py-5 text-right tabular-nums">
                  {e.paid}/{e.confirmed_first + e.confirmed_second}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href={showArchived ? "/admin" : "/admin?archived=1"}
        className="mt-8 inline-block text-sm text-ink/60 underline underline-offset-4 hover:text-ink"
      >
        {showArchived ? "Back to upcoming events" : "View archived events"}
      </Link>
    </>
  );
}

function MobileCount({ label, taken, cap }: { label: string; taken: number; cap: number }) {
  return (
    <div>
      <span className="text-ink/60">{label}</span> <b className="tabular-nums">{taken}/{cap}</b>
      {taken >= cap && cap > 0 && (
        <span className="ml-1.5 rounded-sm bg-wine/10 px-1.5 py-0.5 text-xs text-wine">Full</span>
      )}
    </div>
  );
}

function CountCell({ taken, cap }: { taken: number; cap: number }) {
  return (
    <td className="py-5 text-right tabular-nums">
      {taken >= cap && cap > 0 && (
        <span className="mr-2 rounded-sm bg-wine/10 px-1.5 py-0.5 text-xs text-wine">Full</span>
      )}
      {taken}/{cap}
    </td>
  );
}
