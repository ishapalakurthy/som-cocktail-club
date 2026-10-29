import { getSignupByToken, leftWaitlist, waitlistPosition } from "@/lib/signups";

// Polled by a student's status page so they see the moment they move off the waitlist.
export async function GET(_req: Request, ctx: RouteContext<"/api/status/[token]">) {
  const { token } = await ctx.params;
  const s = await getSignupByToken(token);
  if (!s) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(
    {
      status: s.status,
      position: await waitlistPosition(s),
      confirmedAt: s.confirmed_at,
      paid: s.paid,
      leftWaitlist: leftWaitlist(s),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
