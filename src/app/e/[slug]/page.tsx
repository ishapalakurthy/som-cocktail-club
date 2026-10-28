import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getEventBySlug, getLiveRoster } from "@/lib/signups";
import { formatDateTime, requestTime } from "@/lib/time";
import { MenuHeader } from "../../_components/Crest";
import EventLive from "./EventLive";

export async function generateMetadata(props: PageProps<"/e/[slug]">) {
  const { slug } = await props.params;
  const event = await getEventBySlug(slug);
  return { title: event ? `${event.name} · SOM Cocktail Club` : "SOM Cocktail Club" };
}

export default async function EventPage(props: PageProps<"/e/[slug]">) {
  await connection();
  const { slug } = await props.params;
  const event = await getEventBySlug(slug);
  if (!event || event.archived) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-6 sm:py-12">
      <div className="sheet">
        <Link href="/" className="block">
          <MenuHeader />
        </Link>
        <h1 className="display mt-4 text-center text-5xl leading-tight">{event.name}</h1>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-ink/75">
          <span>{formatDateTime(event.starts_at)}</span>
          <span className="text-gold">◆</span>
          <span>{event.location}</span>
          <span className="text-gold">◆</span>
          <span>${(event.price_cents / 100).toFixed(2)}, due within 24h of getting a spot</span>
        </div>
        {event.description && (
          <p className="display mx-auto mt-5 max-w-md whitespace-pre-line text-center text-lg italic text-ink/80">
            {event.description}
          </p>
        )}

        <EventLive
          slug={event.slug}
          opensAt={event.opens_at.getTime()}
          startsAt={event.starts_at.getTime()}
          initialRoster={await getLiveRoster(event)}
          serverNow={requestTime()}
        />
      </div>
    </main>
  );
}
