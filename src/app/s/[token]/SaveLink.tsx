"use client";

import { useState } from "react";

// Without email, this page's link is the only way back, so make it easy to save.
export default function SaveLink({ token, prominent }: { token: string; prominent: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/s/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!prominent) {
    return (
      <div className="mt-4 text-center text-sm">
        <button type="button" onClick={copy} className="text-navy underline underline-offset-4 hover:text-ink">
          {copied ? "Copied" : "Copy my link"}
        </button>
      </div>
    );
  }
  return (
    <div className="mx-auto mt-4 max-w-sm text-center text-sm">
      <p>
        <b>Save this link.</b> It&apos;s the only way to come back to check your spot or give it up. Copy it into
        your notes or send it to yourself.
      </p>
      <button type="button" onClick={copy} className="btn-secondary mt-3">
        {copied ? "Copied" : "Copy my link"}
      </button>
    </div>
  );
}
