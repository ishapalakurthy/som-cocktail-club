import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { removeBoardMember } from "../../actions";
import ActionButton from "../../_components/ActionButton";
import BoardForms from "./BoardForms";

export const metadata = { title: "Board members · Cocktail Club Board" };

export default async function BoardPage() {
  const me = await requireAdmin();
  const admins = await sql<{ id: string; name: string; email: string }[]>`
    select id, name, email from admins order by name`;

  return (
    <>
      <h1 className="text-2xl font-bold">Board members</h1>
      <p className="mt-1 text-sm text-stone-600">Everyone here can create events and manage rosters.</p>
      <div className="mt-4 max-w-2xl divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {admins.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium">{a.name} {a.id === me.id && <span className="text-xs text-stone-400">(you)</span>}</div>
              <div className="text-sm text-stone-500">{a.email}</div>
            </div>
            {a.id !== me.id && (
              <ActionButton action={removeBoardMember.bind(null, a.id)} confirm={`Remove ${a.name}'s board access?`}>
                Remove
              </ActionButton>
            )}
          </div>
        ))}
      </div>
      <BoardForms />
    </>
  );
}
