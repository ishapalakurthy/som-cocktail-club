import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/signups";
import { toLocalInput } from "@/lib/time";
import EventForm from "../../../../_components/EventForm";

export default async function EditEventPage(props: PageProps<"/admin/events/[id]/edit">) {
  const { id } = await props.params;
  const e = await getEventById(id);
  if (!e) notFound();
  return (
    <>
      <Link href={`/admin/events/${e.id}`} className="text-sm text-ink/55 hover:underline">← Back to roster</Link>
      <h1 className="display mb-4 mt-2 text-4xl font-semibold">Edit {e.name}</h1>
      <EventForm
        eventId={e.id}
        initial={{
          name: e.name,
          slug: e.slug,
          description: e.description,
          location: e.location,
          starts_at: toLocalInput(e.starts_at),
          opens_at: toLocalInput(e.opens_at),
          price: (e.price_cents / 100).toFixed(2),
          venmo_handle: e.venmo_handle,
          zelle_info: e.zelle_info,
          cap_first: String(e.cap_first),
          cap_second: String(e.cap_second),
        }}
      />
    </>
  );
}
