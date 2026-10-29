"use client";

import { useState } from "react";

export default function CopyLink({
  url,
  className = "btn-primary",
  label = "Copy Slack link",
  copiedLabel = "Copied! Paste it in Slack",
}: {
  url: string;
  className?: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
