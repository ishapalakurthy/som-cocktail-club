"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-fetches the page's server data every few seconds so new signups appear live.
export default function AutoRefresh({ ms = 4000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, ms);
    return () => clearInterval(id);
  }, [router, ms]);
  return null;
}
