"use client";

import { useActionState } from "react";
import { changePassword } from "../../actions";

export default function ChangePassword() {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <form action={action} className="card mt-6 max-w-3xl">
      <h2 className="font-semibold">Change your password</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <input name="password" type="password" placeholder="New password (8+ characters)" required minLength={8} className="input max-w-72" autoComplete="new-password" />
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Update password"}</button>
      </div>
      {state.error && <p className="mt-2 text-sm text-rose-700">{state.error}</p>}
      {state.ok && <p className="mt-2 text-sm text-emerald-700">{state.ok}</p>}
    </form>
  );
}
