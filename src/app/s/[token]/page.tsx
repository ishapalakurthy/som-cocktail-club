import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { GROUPS, categoryLabel } from "@/lib/categories";
import { getEventById, getSignupByToken, waitlistPosition } from "@/lib/signups";
import { formatDateTime, requestTime } from "@/lib/time";
import { emailEnabled } from "@/lib/email";
import StatusLive from "./StatusLive";

export const metadata = { title: "Your spot · Cocktail Club" };

export default async function StatusPage(props: PageProps<"/s/[token]">) {
  await connection();
  const { token } = await props.params;
  const { new: isNew } = await props.searchParams;
  const signup = await getSignupByToken(token);
  if (!signup) notFound();
  const event = (await getEventById(signup.event_id))!;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href={`/e/${event.slug}`} className="text-sm font-medium text-rose-700 hover:underline">
        ← {event.name}
      </Link>
      {isNew && (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
          Thanks for signing up!{" "}
          {emailEnabled ? (
            <>We also emailed this page&apos;s link to <b>{signup.email}</b> so you can come back to it.</>
          ) : (
            <><b>Bookmark this page</b>: it&apos;s your private link to check your spot or give it up.</>
          )}
        </p>
      )}
      <div className="mt-4 text-sm text-stone-600">
        {signup.name} · {categoryLabel(signup.category)} · {formatDateTime(event.starts_at)}
      </div>

      <StatusLive
        token={token}
        groupLabel={GROUPS[signup.group_key].label}
        initial={{
          status: signup.status,
          position: await waitlistPosition(signup),
          confirmedAt: signup.confirmed_at?.toISOString() ?? null,
          paid: signup.paid,
        }}
        priceCents={event.price_cents}
        venmoHandle={event.venmo_handle.replace(/^@/, "")}
        zelleInfo={event.zelle_info}
        eventName={event.name}
        eventOver={event.starts_at.getTime() < requestTime()}
      />
    </main>
  );
}
