import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { GROUPS } from "@/lib/categories";
import { getEventById, getSignupByToken, waitlistPosition } from "@/lib/signups";
import { requestTime } from "@/lib/time";
import { emailEnabled } from "@/lib/email";
import { MenuHeader } from "../../_components/Crest";
import StatusLive from "./StatusLive";

export const metadata = { title: "Your spot · SOM Cocktail Club" };

export default async function StatusPage(props: PageProps<"/s/[token]">) {
  await connection();
  const { token } = await props.params;
  const { new: isNew } = await props.searchParams;
  const signup = await getSignupByToken(token);
  if (!signup) notFound();
  const event = (await getEventById(signup.event_id))!;

  return (
    <main className="mx-auto w-full max-w-xl px-3 py-6 sm:py-12">
      <div className="sheet">
        <Link href={`/e/${event.slug}`} className="block">
          <MenuHeader />
        </Link>
        <h1 className="display mt-3 text-center text-3xl">{event.name}</h1>
        {isNew && (
          <p className="mx-auto mt-4 max-w-sm text-center text-sm">
            Thanks for signing up!{" "}
            {emailEnabled ? (
              <>We also emailed this page&apos;s link to <b>{signup.email}</b> so you can come back to it.</>
            ) : (
              <><b>Bookmark this page</b>: it&apos;s your private link to check your spot or give it up.</>
            )}
          </p>
        )}

        <StatusLive
          token={token}
          groupLabel={GROUPS[signup.group_key].label}
          firstName={signup.name.trim().split(/\s+/)[0]}
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
        <Link href={`/e/${event.slug}`} className="mt-8 block text-center text-sm text-navy underline-offset-4 hover:underline">
          See who&apos;s coming
        </Link>
      </div>
    </main>
  );
}
