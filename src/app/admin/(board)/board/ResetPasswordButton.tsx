"use client";

import { useTransition } from "react";
import { resetBoardPassword } from "../../actions";

// For when a board member forgets their password.
export default function ResetPasswordButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="btn-secondary btn-sm"
      disabled={pending}
      onClick={() => {
        const password = window.prompt(`New temporary password for ${name} (8+ characters):`);
        if (!password) return;
        startTransition(async () => {
          const result = await resetBoardPassword(id, password);
          alert(result.error ?? `Password reset. Send it to ${name} privately.`);
        });
      }}
    >
      {pending ? "…" : "Reset password"}
    </button>
  );
}
