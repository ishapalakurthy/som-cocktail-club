import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { GROUPS } from "@/lib/categories";
import { getEventById, getSignupByToken, statusFor } from "@/lib/signups";
import { requestTime } from "@/lib/time";
import { emailEnabled } from "@/lib/email";
import { MenuHeader } from "../../_components/Crest";
import SaveLink from "./SaveLink";
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
        <h1 className="heading mt-3 text-center">{event.name}</h1>
        {isNew && emailEnabled && (
          <p className="mx-auto mt-4 max-w-sm text-center text-sm">
            Thanks for signing up! We also emailed this page&apos;s link to <b>{signup.email}</b>.
          </p>
        )}
        {isNew && !emailEnabled && <SaveLink token={token} prominent />}

        <StatusLive
          token={token}
          groupLabel={GROUPS[signup.group_key].label}
          firstName={signup.name.trim().split(/\s+/)[0]}
          initial={await statusFor(signup)}
          priceCents={event.price_cents}
          venmoHandle={event.venmo_handle.replace(/^@/, "")}
          zelleInfo={event.zelle_info}
          eventName={event.name}
          eventSlug={event.slug}
          eventOver={event.starts_at.getTime() < requestTime()}
        />
        {!isNew && <SaveLink token={token} prominent={false} />}
      </div>
    </main>
  );
}
