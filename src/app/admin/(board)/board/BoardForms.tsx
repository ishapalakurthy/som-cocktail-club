"use client";

import { useActionState } from "react";
import { addBoardMember, changePassword } from "../../actions";

export default function BoardForms() {
  const [addState, addAction, adding] = useActionState(addBoardMember, {});
  const [pwState, pwAction, changing] = useActionState(changePassword, {});
  return (
    <div className="mt-8 grid max-w-2xl gap-6 sm:grid-cols-2">
      <form action={addAction} className="card space-y-3">
        <h2 className="font-semibold">Add a board member</h2>
        <input name="name" placeholder="Name" required className="input" />
        <input name="email" type="email" placeholder="Email" required className="input" />
        <input name="password" placeholder="Temporary password (8+ chars)" required minLength={8} className="input" />
        {addState.error && <p className="text-sm text-rose-700">{addState.error}</p>}
        {addState.ok && <p className="text-sm text-emerald-700">{addState.ok}</p>}
        <button className="btn-primary" disabled={adding}>Add</button>
      </form>
      <form action={pwAction} className="card space-y-3">
        <h2 className="font-semibold">Change your password</h2>
        <input name="password" type="password" placeholder="New password (8+ chars)" required minLength={8} className="input" autoComplete="new-password" />
        {pwState.error && <p className="text-sm text-rose-700">{pwState.error}</p>}
        {pwState.ok && <p className="text-sm text-emerald-700">{pwState.ok}</p>}
        <button className="btn-primary" disabled={changing}>Update password</button>
      </form>
    </div>
  );
}
