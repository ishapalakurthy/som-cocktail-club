import Link from "next/link";
import { notFound } from "next/navigation";
import { GROUPS, GROUP_KEYS, categoryLabel } from "@/lib/categories";
import { sql, type GroupKey, type SignupRow } from "@/lib/db";
import { capacity, getEventById } from "@/lib/signups";
import { formatDateTime, formatDuration, formatTime, PAYMENT_WINDOW_MS, requestTime } from "@/lib/time";
import { deleteForever, markPaid, promote, remove, restore, setArchived } from "../../../actions";
import ActionButton from "../../../_components/ActionButton";
import AutoRefresh from "../../../_components/AutoRefresh";
import CopyLink from "../../../_components/CopyLink";

export default async function RosterPage(props: PageProps<"/admin/events/[id]">) {
  const { id } = await props.params;
  const event = await getEventById(id);
  if (!event) notFound();
  const groupParam = (await props.searchParams).group;
  const group: GroupKey = groupParam === "second" ? "second" : "first";

  const all = await sql<SignupRow[]>`select * from signups where event_id = ${event.id} order by created_at`;
  const of = (g: GroupKey, status: string) => all.filter((s) => s.group_key === g && s.status === status);
  const confirmed = of(group, "confirmed");
  const waitlist = of(group, "waitlist");
  const removed = of(group, "removed");
  const cap = capacity(event, group);
  const openSpots = cap - confirmed.length;
  const now = requestTime();
  const opensIn = event.opens_at.getTime() - now;

  return (
    <>
      <AutoRefresh />
      <Link href="/admin" className="text-sm text-stone-500 hover:underline">← All events</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <div className="text-sm text-stone-600">
            {formatDateTime(event.starts_at)}
            {event.location && ` · ${event.location}`}
          </div>
          <div className="mt-1 text-sm">
            {opensIn > 0 ? (
              <span className="text-amber-700">🔒 Signups unlock {formatDateTime(event.opens_at)} (in {formatDuration(opensIn)})</span>
            ) : (
              <span className="text-emerald-700">🟢 Signups opened {formatDateTime(event.opens_at)}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyLink url={`${process.env.APP_URL}/e/${event.slug}`} />
          <Link href={`/e/${event.slug}`} target="_blank" className="btn-secondary">View public page</Link>
          <Link href={`/admin/events/${event.id}/edit`} className="btn-secondary">Edit</Link>
          <a href={`/admin/events/${event.id}/export`} className="btn-secondary">Download CSV</a>
          <ActionButton
            action={setArchived.bind(null, event.id, !event.archived)}
            className="btn-secondary"
            confirm={event.archived ? undefined : "Archive this event? It will be hidden from students and the events list."}
          >
            {event.archived ? "Unarchive" : "Archive"}
          </ActionButton>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-b border-stone-200">
        {GROUP_KEYS.map((g) => {
          const c = of(g, "confirmed").length;
          const w = of(g, "waitlist").length;
          return (
            <Link
              key={g}
              href={`?group=${g}`}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                g === group ? "border-rose-700 text-rose-800" : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {GROUPS[g].label} <span className="ml-1 text-stone-500">{c}/{capacity(event, g)} · {w} waiting</span>
            </Link>
          );
        })}
      </div>

      {openSpots > 0 && waitlist.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {openSpots} open {openSpots === 1 ? "spot" : "spots"}. Use <b>Move up</b> on the waitlist below to fill
          {openSpots === 1 ? " it" : " them"}.
        </div>
      )}
      {openSpots < 0 && (
        <div className="mt-4 rounded-lg border border-stone-300 bg-stone-50 p-3 text-sm text-stone-700">
          {-openSpots} over capacity.
        </div>
      )}

      <Section title={`Confirmed (${confirmed.length}/${cap})`} sub={`${confirmed.filter((s) => s.paid).length} paid`}>
        {confirmed.length === 0 ? (
          <Empty>No one yet.</Empty>
        ) : (
          <Table head={["#", "Name", "Type", "Dietary", "Signed up", "Payment", ""]}>
            {confirmed.map((s, i) => (
              <tr key={s.id} className="border-t border-stone-100 align-top">
                <Td className="text-stone-400">{i + 1}</Td>
                <Person s={s} />
                <Td className="text-xs text-stone-600">{categoryLabel(s.category)}</Td>
                <Td className="text-xs">{s.dietary}</Td>
                <Td className="whitespace-nowrap text-xs text-stone-600">{formatTime(s.created_at)}</Td>
                <Td><Payment s={s} now={now} /></Td>
                <Td className="text-right">
                  <ActionButton action={remove.bind(null, s.id)} confirm={`Remove ${s.name}? Their spot will open up.`}>
                    Remove
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title={`Waitlist (${waitlist.length})`}>
        {waitlist.length === 0 ? (
          <Empty>No one on the waitlist.</Empty>
        ) : (
          <Table head={["#", "Name", "Type", "Dietary", "Signed up", ""]}>
            {waitlist.map((s, i) => (
              <tr key={s.id} className="border-t border-stone-100 align-top">
                <Td className="text-stone-400">{i + 1}</Td>
                <Person s={s} />
                <Td className="text-xs text-stone-600">{categoryLabel(s.category)}</Td>
                <Td className="text-xs">{s.dietary}</Td>
                <Td className="whitespace-nowrap text-xs text-stone-600">{formatTime(s.created_at)}</Td>
                <Td className="space-x-1 whitespace-nowrap text-right">
                  <ActionButton
                    action={promote.bind(null, s.id)}
                    className="btn-primary btn-sm"
                    confirm={
                      openSpots <= 0
                        ? `There are no open spots. Move ${s.name} up anyway (over capacity)?`
                        : `Move ${s.name} into a confirmed spot? They'll have 24h to pay.`
                    }
                  >
                    Move up
                  </ActionButton>
                  <ActionButton action={remove.bind(null, s.id)} confirm={`Remove ${s.name} from the waitlist?`}>
                    Remove
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {removed.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium text-stone-500">Removed ({removed.length})</summary>
          <Table head={["Name", "Signed up", "Removed", "By", ""]}>
            {removed.map((s) => (
              <tr key={s.id} className="border-t border-stone-100 align-top text-stone-500">
                <Person s={s} />
                <Td className="text-xs">{formatTime(s.created_at)}</Td>
                <Td className="text-xs">{s.removed_at && formatTime(s.removed_at)}</Td>
                <Td className="text-xs">{s.removed_by === "self" ? "Themselves" : s.removed_by}</Td>
                <Td className="space-x-1 whitespace-nowrap text-right">
                  <ActionButton action={restore.bind(null, s.id)} confirm={`Put ${s.name} back on the waitlist in their original spot?`}>
                    Restore to waitlist
                  </ActionButton>
                  <ActionButton action={deleteForever.bind(null, s.id)} confirm={`Permanently delete ${s.name}'s signup? This can't be undone.`}>
                    Delete
                  </ActionButton>
                </Td>
              </tr>
            ))}
          </Table>
        </details>
      )}
    </>
  );
}

function Payment({ s, now }: { s: SignupRow; now: number }) {
  if (s.paid) {
    return (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
          ✓ Paid · {s.payment_method === "venmo" ? "Venmo" : s.payment_method === "zelle" ? "Zelle" : "Other"}
        </span>
        <ActionButton action={markPaid.bind(null, s.id, null)} className="text-xs text-stone-400 hover:text-rose-700">
          undo
        </ActionButton>
      </div>
    );
  }
  const left = s.confirmed_at ? s.confirmed_at.getTime() + PAYMENT_WINDOW_MS - now : 0;
  return (
    <div className="space-y-1">
      <div className={`whitespace-nowrap text-xs font-medium ${left < 0 ? "text-rose-700" : "text-amber-700"}`}>
        {left < 0 ? `Overdue by ${formatDuration(left)}` : `Unpaid · ${formatDuration(left)} left`}
      </div>
      <div className="flex gap-1">
        <ActionButton action={markPaid.bind(null, s.id, "venmo")}>Venmo</ActionButton>
        <ActionButton action={markPaid.bind(null, s.id, "zelle")}>Zelle</ActionButton>
        <ActionButton action={markPaid.bind(null, s.id, "other")}>Other</ActionButton>
      </div>
    </div>
  );
}

function Person({ s }: { s: SignupRow }) {
  return (
    <Td>
      <div className="font-medium">{s.name}</div>
      <div className="text-xs text-stone-500">{s.email}</div>
    </Td>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">
        {title} {sub && <span className="ml-2 text-sm font-normal text-stone-500">{sub}</span>}
      </h2>
      {children}
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm text-stone-400">{children}</p>;
}
