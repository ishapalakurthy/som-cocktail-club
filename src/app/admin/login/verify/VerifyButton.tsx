"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithToken } from "../../actions";

export default function VerifyButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState(signInWithToken.bind(null, token), {});
  return (
    <form action={action} className="card mt-6 space-y-3">
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in to the board"}</button>
      {state.error && (
        <p className="text-sm text-rose-700">
          {state.error} <Link href="/admin/login" className="underline">Get a new link</Link>
        </p>
      )}
    </form>
  );
}
