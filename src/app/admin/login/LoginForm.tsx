"use client";

import { useActionState } from "react";
import { requestLoginLink } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(requestLoginLink, {});
  return (
    <form action={action} className="card mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="email">Your Yale email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@yale.edu" autoComplete="email" />
      </div>
      {state.error && <p className="text-sm text-rose-700">{state.error}</p>}
      {state.ok && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{state.ok}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Sending…" : "Email me a sign-in link"}</button>
      <p className="text-xs text-stone-500">Only emails on the board list can sign in.</p>
    </form>
  );
}
