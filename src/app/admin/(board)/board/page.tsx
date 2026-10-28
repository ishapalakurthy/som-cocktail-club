import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { removeBoardMember } from "../../actions";
import ActionButton from "../../_components/ActionButton";
import AddBoardMember from "./AddBoardMember";
import ChangePassword from "./ChangePassword";
import ResetPasswordButton from "./ResetPasswordButton";

export const metadata = { title: "Board members · Cocktail Club Board" };

type Member = { id: string; name: string; email: string; added_by: string | null; created_at: Date };

export default async function BoardPage() {
  const me = await requireAdmin();
  const members = await sql<Member[]>`select id, name, email, added_by, created_at from admins order by name`;

  return (
    <>
      <h1 className="text-2xl font-bold">Board members</h1>
      <p className="mt-1 text-sm text-stone-600">
        Everyone on this list has admin access: they sign in with their Yale email and password, manage events and
        rosters, and add or remove board members. No other email can sign in.
      </p>
      <div className="mt-4 max-w-3xl overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Yale email</th>
              <th className="px-4 py-2 font-medium">Added</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-medium">
                  {m.name} {m.id === me.id && <span className="text-xs font-normal text-stone-400">(you)</span>}
                </td>
                <td className="px-4 py-3 text-stone-700">{m.email}</td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {formatDateTime(m.created_at)}
                  {m.added_by && <div>by {m.added_by}</div>}
                </td>
                <td className="space-x-1 whitespace-nowrap px-4 py-3 text-right">
                  {m.id !== me.id && <ResetPasswordButton id={m.id} name={m.name} />}
                  {m.id !== me.id && (
                    <ActionButton
                      action={removeBoardMember.bind(null, m.id)}
                      confirm={`Remove ${m.name} from the board? They'll lose admin access immediately.`}
                    >
                      Remove
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddBoardMember />
      <ChangePassword />
    </>
  );
}
