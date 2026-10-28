import { getEventBySlug, getLiveRoster } from "@/lib/signups";

// Polled by the event page every few seconds to keep counts and the attendee list live.
export async function GET(_req: Request, ctx: RouteContext<"/api/events/[slug]/live">) {
  const { slug } = await ctx.params;
  const event = await getEventBySlug(slug);
  if (!event || event.archived) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(
    { roster: await getLiveRoster(event), serverNow: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
