"use client";

import { useState } from "react";

export default function CopyLink({ url, className = "btn-primary" }: { url: string; className?: string }) {
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
      {copied ? "Copied! Paste it in Slack" : "Copy Slack link"}
    </button>
  );
}
