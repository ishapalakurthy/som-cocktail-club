import { getAdmin } from "@/lib/auth";
import { GROUPS, categoryLabel } from "@/lib/categories";
import { sql, type SignupRow } from "@/lib/db";
import { getEventById } from "@/lib/signups";
import { formatTime } from "@/lib/time";

export async function GET(_req: Request, ctx: RouteContext<"/admin/events/[id]/export">) {
  if (!(await getAdmin())) return new Response("Not logged in", { status: 401 });
  const { id } = await ctx.params;
  const event = await getEventById(id);
  if (!event) return new Response("Not found", { status: 404 });

  const rows = await sql<SignupRow[]>`
    select * from signups where event_id = ${event.id}
    order by group_key, array_position(array['confirmed','waitlist','removed'], status), created_at`;

  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["Group", "Status", "Name", "Email", "Type", "Dietary", "Signed up", "Paid", "Paid via"].map(cell).join(","),
    ...rows.map((s) =>
      [
        GROUPS[s.group_key].label,
        s.status,
        s.name,
        s.email,
        categoryLabel(s.category),
        s.dietary,
        formatTime(s.created_at),
        s.paid ? "yes" : "no",
        s.payment_method ?? "",
      ]
        .map(cell)
        .join(","),
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-signups.csv"`,
    },
  });
}
