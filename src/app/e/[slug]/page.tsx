import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { formatPrice } from "@/lib/format";
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
        <h1 className="title mt-3 text-center">{event.name}</h1>
        <div className="mt-4 text-center font-medium">
          {formatDateTime(event.starts_at)} / {formatPrice(event.price_cents)}
        </div>
        <div className="mt-1 text-center text-ink/65">📍 {event.location}</div>
        {event.description && (
          <p className="mx-auto mt-5 max-w-md whitespace-pre-line text-center leading-relaxed">
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
