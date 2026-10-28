"use client";

import { useActionState } from "react";
import { addBoardMember } from "../../actions";

export default function AddBoardMember() {
  const [state, action, pending] = useActionState(addBoardMember, {});
  return (
    <form action={action} className="card mt-6 max-w-3xl">
      <h2 className="font-semibold">Add a board member</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <input name="name" placeholder="Name" required className="input max-w-56" />
        <input name="email" type="email" placeholder="first.last@yale.edu" required className="input max-w-64" />
        <input name="password" placeholder="Temporary password" required minLength={8} className="input max-w-52" />
        <button className="btn-primary" disabled={pending}>{pending ? "Adding…" : "Add to board"}</button>
      </div>
      {state.error && <p className="mt-2 text-sm text-rose-700">{state.error}</p>}
      {state.ok && <p className="mt-2 text-sm text-emerald-700">{state.ok}</p>}
      <p className="mt-2 text-xs text-stone-500">Send them the temporary password privately (e.g. a Slack DM). They can change it on this page after signing in.</p>
    </form>
  );
}
