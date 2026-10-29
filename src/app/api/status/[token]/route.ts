import { getSignupByToken, statusFor } from "@/lib/signups";

// Polled by a student's status page so they see the moment they move off the waitlist.
export async function GET(_req: Request, ctx: RouteContext<"/api/status/[token]">) {
  const { token } = await ctx.params;
  const s = await getSignupByToken(token);
  if (!s) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(await statusFor(s), { headers: { "Cache-Control": "no-store" } });
}
