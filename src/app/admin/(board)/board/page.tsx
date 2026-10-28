import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { removeBoardMember } from "../../actions";
import ActionButton from "../../_components/ActionButton";
import AddBoardMember from "./AddBoardMember";
import ChangePassword from "./ChangePassword";
import ResetPasswordButton from "./ResetPasswordButton";

export const metadata = { title: "Leads · SOM Cocktail Club Board" };

type Member = { id: string; name: string; email: string; added_by: string | null; created_at: Date };

export default async function BoardPage() {
  const me = await requireAdmin();
  const members = await sql<Member[]>`select id, name, email, added_by, created_at from admins order by name`;

  return (
    <>
      <h1 className="title">Leads</h1>
      <p className="mt-1 text-sm text-ink/65">
        Everyone on this list has admin access: they sign in with their Yale email and password, manage events and
        rosters, and add or remove leads. No other email can sign in.
      </p>
      <div className="mt-8 max-w-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/55">
            <tr>
              <th className="py-2 pr-4 font-bold">Name</th>
              <th className="py-2 pr-4 font-bold">Yale email</th>
              <th className="py-2 pr-4 font-bold">Added</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-3 pr-4 font-bold">
                  {m.name} {m.id === me.id && <span className="text-xs font-normal text-ink/40">(you)</span>}
                </td>
                <td className="py-3 pr-4 text-ink/80">{m.email}</td>
                <td className="py-3 pr-4 text-xs text-ink/55">
                  {formatDateTime(m.created_at)}
                  {m.added_by && m.added_by !== "setup script" && <div>by {m.added_by}</div>}
                </td>
                <td className="space-x-4 whitespace-nowrap py-3 text-right">
                  {m.id !== me.id && <ResetPasswordButton id={m.id} name={m.name} />}
                  {m.id !== me.id && (
                    <ActionButton
                      className="text-sm text-wine hover:underline"
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
