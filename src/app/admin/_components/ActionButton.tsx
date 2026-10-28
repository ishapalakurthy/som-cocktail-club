"use client";

import { useTransition } from "react";

// A button that runs a server action, optionally asking "are you sure?" first.
export default function ActionButton({
  action,
  children,
  confirm: confirmText,
  className = "btn-secondary btn-sm",
}: {
  action: () => Promise<unknown>;
  children: React.ReactNode;
  confirm?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        startTransition(async () => {
          const result = (await action()) as { error?: string } | undefined;
          if (result?.error) alert(result.error);
        });
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
