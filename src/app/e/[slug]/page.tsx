import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getEventBySlug, getLiveRoster } from "@/lib/signups";
import { formatDateTime, requestTime } from "@/lib/time";
import EventLive from "./EventLive";

export async function generateMetadata(props: PageProps<"/e/[slug]">) {
  const { slug } = await props.params;
  const event = await getEventBySlug(slug);
  return { title: event ? `${event.name} · Cocktail Club` : "Cocktail Club" };
}

export default async function EventPage(props: PageProps<"/e/[slug]">) {
  await connection();
  const { slug } = await props.params;
  const event = await getEventBySlug(slug);
  if (!event || event.archived) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="text-sm font-medium text-rose-700">🍸 Cocktail Club</p>
      <h1 className="mt-1 text-3xl font-bold">{event.name}</h1>
      <div className="mt-2 space-y-0.5 text-stone-700">
        <div>📅 {formatDateTime(event.starts_at)}</div>
        {event.location && <div>📍 {event.location}</div>}
        {event.price_cents > 0 && <div>💵 ${(event.price_cents / 100).toFixed(2)} · due within 24 hours of getting a spot</div>}
      </div>
      {event.description && <p className="mt-4 whitespace-pre-line text-stone-700">{event.description}</p>}

      <EventLive
        slug={event.slug}
        opensAt={event.opens_at.getTime()}
        startsAt={event.starts_at.getTime()}
        initialRoster={await getLiveRoster(event)}
        serverNow={requestTime()}
      />
    </main>
  );
}
