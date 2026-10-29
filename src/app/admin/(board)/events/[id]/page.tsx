import Link from "next/link";
import { notFound } from "next/navigation";
import { GROUPS, GROUP_KEYS, categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
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
  const slackUrl = `${process.env.APP_URL}/e/${event.slug}`;

  // Partners: each person's pairing label, who they're paired with, and the private link to share
  // (a partner's link is the student's page, which shows them both).
  const byId = new Map(all.map((x) => [x.id, x]));
  const pairs = new Map<string, Pair>(
    all.map((x) => {
      const student = x.partner_of ? byId.get(x.partner_of) : undefined;
      const partner = all.find((y) => y.partner_of === x.id);
      const other = student ?? partner;
      const mode = x.together ? "together" : "split OK";
      return [
        x.id,
        {
          label: student
            ? `${first(student.name)}'s partner${student.status === "removed" ? " (removed)" : ` · ${mode}`}`
            : partner
              ? `with ${partner.name}${partner.status === "removed" ? " (removed)" : ` · ${mode}`}`
              : null,
          other: other && other.status !== "removed" ? other : null,
          together: x.together,
          link: `${process.env.APP_URL}/s/${(student ?? x).token}`,
        },
      ];
    }),
  );
  const pairOf = (x: SignupRow) => pairs.get(x.id)!;
  // Together pairs are removed and moved up as one, so the confirm text names both.
  const removeMsg = (x: SignupRow, single: string) => {
    const o = pairOf(x).other;
    return o && x.together ? `Remove ${x.name} and ${o.name}? They signed up together.` : single;
  };
  const promoteMsg = (x: SignupRow) => {
    const o = pairOf(x).other;
    const both = o && x.together && o.status === "waitlist";
    const need = both ? 2 : 1;
    const who = both ? `${x.name} and ${o.name}` : x.name;
    return openSpots < need
      ? `${both ? "They need 2 spots and there " : "There "}${openSpots === 1 ? "is 1 open spot" : `are ${Math.max(openSpots, 0)} open spots`}. Move ${who} up anyway (over capacity)?`
      : `Move ${who} into confirmed ${both ? "spots" : "a confirmed spot"}? They'll have 24h to pay.`;
  };
  const moreActions = (
    <>
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
    </>
  );

  return (
    <>
      <AutoRefresh />
      <Link href="/admin" className="text-sm text-ink/55 hover:underline">← All events</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="title">{event.name}</h1>
          <div className="mt-1 font-medium">
            {formatDateTime(event.starts_at)} / {formatPrice(event.price_cents)}
          </div>
          <div className="text-sm text-ink/65">📍 {event.location}</div>
          <div className="mt-1 text-sm">
            {opensIn > 0 ? (
              <span className="text-gold-deep">Signups unlock {formatDateTime(event.opens_at)} (in {formatDuration(opensIn)})</span>
            ) : (
              <span className="text-pine">Signups opened {formatDateTime(event.opens_at)}</span>
            )}
          </div>
        </div>
        <div className="hidden flex-wrap gap-2 sm:flex">
          <CopyLink url={slackUrl} />
          {moreActions}
        </div>
      </div>

      {/* Phones: the main button plus a ⋯ menu for the rest. */}
      <div className="mt-4 flex gap-2 sm:hidden">
        <CopyLink url={slackUrl} className="btn-primary flex-1 py-3" />
        <details className="relative">
          <summary className="btn-secondary h-full cursor-pointer list-none px-4 text-lg leading-none [&::-webkit-details-marker]:hidden" aria-label="More actions">
            ⋯
          </summary>
          <div className="absolute right-0 z-20 mt-2 flex w-52 flex-col gap-2 rounded-sm border border-line bg-white p-2 shadow-lg [&>*]:w-full">
            {moreActions}
          </div>
        </details>
      </div>

      <div className="mt-6 flex gap-2 border-b border-line">
        {GROUP_KEYS.map((g) => {
          const c = of(g, "confirmed").length;
          const w = of(g, "waitlist").length;
          return (
            <Link
              key={g}
              href={`?group=${g}`}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold max-sm:flex-1 max-sm:text-center ${
                g === group ? "border-navy text-navy" : "border-transparent text-ink/55 hover:text-ink"
              }`}
            >
              <span className="hidden sm:inline">
                {GROUPS[g].label} <span className="ml-1 text-ink/55">{c}/{capacity(event, g)} · {w} waiting</span>
              </span>
              <span className="sm:hidden">
                {GROUPS[g].short}
                <span className="block text-xs font-normal text-ink/55">{c}/{capacity(event, g)} · {w} waiting</span>
              </span>
            </Link>
          );
        })}
      </div>

      {openSpots > 0 && waitlist.length > 0 && (
        <div className="mt-4 text-sm font-bold text-gold-deep">
          {openSpots} open {openSpots === 1 ? "spot" : "spots"}. Use <b>Move up</b> on the waitlist below to fill
          {openSpots === 1 ? " it" : " them"}.
        </div>
      )}
      {openSpots < 0 && (
        <div className="mt-4 text-sm font-bold text-wine">
          {-openSpots} over capacity.
        </div>
      )}

      <Section title={`Confirmed (${confirmed.length}/${cap})`} sub={`${confirmed.filter((s) => s.paid).length} paid`}>
        {confirmed.length === 0 ? (
          <Empty>No one yet.</Empty>
        ) : (
          <>
            <Table head={["#", "Name", "Type", "Dietary", "Signed up", "Payment", ""]}>
              {confirmed.map((s, i) => (
                <tr key={s.id} className="border-t border-line-soft align-top">
                  <Td className="text-ink/40">{i + 1}</Td>
                  <Person s={s} pair={pairOf(s)} />
                  <Td className="text-xs text-ink/65">{categoryLabel(s.category)}</Td>
                  <Td className="text-xs">{s.dietary}</Td>
                  <Td className="whitespace-nowrap text-xs text-ink/65">{formatTime(s.created_at)}</Td>
                  <Td><Payment s={s} now={now} /></Td>
                  <Td className="text-right">
                    <ActionButton action={remove.bind(null, s.id)} confirm={removeMsg(s, `Remove ${s.name}? Their spot will open up.`)}>
                      Remove
                    </ActionButton>
                  </Td>
                </tr>
              ))}
            </Table>
            <MobileList>
              {confirmed.map((s, i) => (
                <MobileCard key={s.id} s={s} pair={pairOf(s)} n={i + 1} right={<PaymentStatus s={s} now={now} />}>
                  {s.paid ? (
                    <ActionButton action={markPaid.bind(null, s.id, null)} className="mt-2 text-sm text-ink/55 underline">
                      Undo paid
                    </ActionButton>
                  ) : (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <ActionButton action={markPaid.bind(null, s.id, "venmo")} className={TAP}>Venmo</ActionButton>
                      <ActionButton action={markPaid.bind(null, s.id, "zelle")} className={TAP}>Zelle</ActionButton>
                      <ActionButton action={markPaid.bind(null, s.id, "other")} className={TAP}>Other</ActionButton>
                    </div>
                  )}
                  <div>
                    <ActionButton
                      action={remove.bind(null, s.id)}
                      confirm={removeMsg(s, `Remove ${s.name}? Their spot will open up.`)}
                      className="mt-3 text-sm font-bold text-wine"
                    >
                      Remove
                    </ActionButton>
                  </div>
                </MobileCard>
              ))}
            </MobileList>
          </>
        )}
      </Section>

      <Section title={`Waitlist (${waitlist.length})`}>
        {waitlist.length === 0 ? (
          <Empty>No one on the waitlist.</Empty>
        ) : (
          <>
            <Table head={["#", "Name", "Type", "Dietary", "Signed up", ""]}>
              {waitlist.map((s, i) => (
                <tr key={s.id} className="border-t border-line-soft align-top">
                  <Td className="text-ink/40">{i + 1}</Td>
                  <Person s={s} pair={pairOf(s)} />
                  <Td className="text-xs text-ink/65">{categoryLabel(s.category)}</Td>
                  <Td className="text-xs">{s.dietary}</Td>
                  <Td className="whitespace-nowrap text-xs text-ink/65">{formatTime(s.created_at)}</Td>
                  <Td className="space-x-1 whitespace-nowrap text-right">
                    <ActionButton
                      action={promote.bind(null, s.id)}
                      className="btn-primary btn-sm"
                      confirm={promoteMsg(s)}
                    >
                      Move up
                    </ActionButton>
                    <ActionButton action={remove.bind(null, s.id)} confirm={removeMsg(s, `Remove ${s.name} from the waitlist?`)}>
                      Remove
                    </ActionButton>
                  </Td>
                </tr>
              ))}
            </Table>
            <MobileList>
              {waitlist.map((s, i) => (
                <MobileCard key={s.id} s={s} pair={pairOf(s)} n={i + 1}>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ActionButton
                      action={promote.bind(null, s.id)}
                      className="btn-primary py-2.5"
                      confirm={promoteMsg(s)}
                    >
                      Move up
                    </ActionButton>
                    <ActionButton
                      action={remove.bind(null, s.id)}
                      confirm={removeMsg(s, `Remove ${s.name} from the waitlist?`)}
                      className={`${TAP} text-wine`}
                    >
                      Remove
                    </ActionButton>
                  </div>
                </MobileCard>
              ))}
            </MobileList>
          </>
        )}
      </Section>

      {removed.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-bold text-ink/55">Removed ({removed.length})</summary>
          <Table head={["Name", "Signed up", "Removed", "By", ""]}>
            {removed.map((s) => (
              <tr key={s.id} className="border-t border-line-soft align-top text-ink/55">
                <Person s={s} pair={pairOf(s)} />
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
          <MobileList>
            {removed.map((s) => (
              <MobileCard
                key={s.id}
                s={s}
                pair={pairOf(s)}
                note={`Removed ${s.removed_at ? formatTime(s.removed_at) : ""} by ${s.removed_by === "self" ? "themselves" : s.removed_by}`}
              >
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <ActionButton action={restore.bind(null, s.id)} confirm={`Put ${s.name} back on the waitlist in their original spot?`} className={TAP}>
                    Restore
                  </ActionButton>
                  <ActionButton action={deleteForever.bind(null, s.id)} confirm={`Permanently delete ${s.name}'s signup? This can't be undone.`} className={`${TAP} text-wine`}>
                    Delete
                  </ActionButton>
                </div>
              </MobileCard>
            ))}
          </MobileList>
        </details>
      )}
    </>
  );
}

function Payment({ s, now }: { s: SignupRow; now: number }) {
  if (s.paid) {
    return (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-xs font-bold text-pine">
          Paid · {s.payment_method === "venmo" ? "Venmo" : s.payment_method === "zelle" ? "Zelle" : "Other"}
        </span>
        <ActionButton action={markPaid.bind(null, s.id, null)} className="text-xs text-ink/40 hover:text-wine">
          undo
        </ActionButton>
      </div>
    );
  }
  const left = s.confirmed_at ? s.confirmed_at.getTime() + PAYMENT_WINDOW_MS - now : 0;
  return (
    <div className="space-y-1">
      <div className={`whitespace-nowrap text-xs font-bold ${left < 0 ? "text-wine" : "text-gold-deep"}`}>
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

// Phones get one card per person instead of a table row, so nothing scrolls sideways.
const TAP = "btn-secondary py-2.5";

function MobileList({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 border-t border-line sm:hidden">{children}</div>;
}

function MobileCard({ s, pair, n, right, note, children }: {
  s: SignupRow;
  pair: Pair;
  n?: number;
  right?: React.ReactNode;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line-soft py-3 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-bold">
          {n !== undefined && <span className="mr-1.5 font-normal text-ink/40">{n}</span>}
          {s.name}
        </div>
        {right}
      </div>
      <div className="break-all text-xs text-ink/55">{s.email}</div>
      {pair.label && <div className="mt-0.5 text-xs font-bold text-gold-deep">{pair.label}</div>}
      <div className="mt-0.5 text-xs text-ink/65">
        {note ?? `${categoryLabel(s.category)} · signed up ${formatTime(s.created_at)}`}
      </div>
      {s.dietary && <div className="mt-0.5 text-xs">Dietary: {s.dietary}</div>}
      <CopyLink url={pair.link} label="Copy their link" copiedLabel="Copied" className="mt-1 block text-xs text-navy underline" />
      {children}
    </div>
  );
}

function PaymentStatus({ s, now }: { s: SignupRow; now: number }) {
  if (s.paid) {
    return (
      <span className="shrink-0 text-xs font-bold text-pine">
        Paid · {s.payment_method === "venmo" ? "Venmo" : s.payment_method === "zelle" ? "Zelle" : "Other"}
      </span>
    );
  }
  const left = s.confirmed_at ? s.confirmed_at.getTime() + PAYMENT_WINDOW_MS - now : 0;
  return (
    <span className={`shrink-0 text-xs font-bold ${left < 0 ? "text-wine" : "text-gold-deep"}`}>
      {left < 0 ? `Overdue ${formatDuration(left)}` : `${formatDuration(left)} left`}
    </span>
  );
}

type Pair = { label: string | null; other: SignupRow | null; together: boolean; link: string };

function first(name: string) {
  return name.trim().split(/\s+/)[0];
}

function Person({ s, pair }: { s: SignupRow; pair: Pair }) {
  return (
    <Td>
      <div className="font-bold">{s.name}</div>
      <div className="text-xs text-ink/55">{s.email}</div>
      {pair.label && <div className="text-xs font-bold text-gold-deep">{pair.label}</div>}
      <CopyLink url={pair.link} label="Copy their link" copiedLabel="Copied" className="text-xs text-navy hover:underline" />
    </Td>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="heading">
        {title} {sub && <span className="ml-2 font-sans text-sm font-normal text-ink/55">{sub}</span>}
      </h2>
      {children}
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="mt-2 hidden overflow-x-auto border-y border-line sm:block">
      <table className="w-full text-sm">
        <thead className="bg-sheet text-left text-xs uppercase tracking-wide text-ink/55">
          <tr>{head.map((h, i) => <th key={i} className="px-3 py-2 font-bold">{h}</th>)}</tr>
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
  return <p className="mt-2 text-sm text-ink/40">{children}</p>;
}
