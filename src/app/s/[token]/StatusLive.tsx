"use client";

import { useEffect, useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { formatDateTime, PAYMENT_WINDOW_MS } from "@/lib/time";
import { withdraw } from "./actions";

// Venmo and Zelle are shown as matching tiles; Venmo opens the app, Zelle copies the number.
const PAY_TILE =
  "flex flex-col items-center rounded-md border border-navy/30 bg-cream px-4 py-3 text-center text-ink transition hover:border-navy hover:bg-paper";

type Status = { status: "confirmed" | "waitlist" | "removed"; position: number | null; confirmedAt: string | null; paid: boolean };

export default function StatusLive(props: {
  token: string;
  groupLabel: string;
  firstName: string;
  initial: Status;
  priceCents: number;
  venmoHandle: string;
  zelleInfo: string;
  eventName: string;
  eventOver: boolean;
}) {
  const [s, setS] = useState(props.initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${props.token}`, { cache: "no-store" });
        if (res.ok) setS(await res.json());
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [props.token]);

  const price = (props.priceCents / 100).toFixed(2);
  const [copied, setCopied] = useState(false);
  const venmoUrl = props.venmoHandle
    ? `https://venmo.com/?txn=pay&recipients=${encodeURIComponent(props.venmoHandle)}` +
      (props.priceCents > 0 ? `&amount=${price}` : "") +
      `&note=${encodeURIComponent(props.eventName)}`
    : null;

  return (
    <div className="mt-6 space-y-5">
      <div className="rule" />
      {s.status === "confirmed" && (
        <div className="py-2 text-center">
          <div className="eyebrow text-pine">Confirmed</div>
          <div className="display mt-1 text-5xl text-pine">You&apos;re in, {props.firstName}</div>
        </div>
      )}
      {s.status === "waitlist" && (
        <div className="py-2 text-center">
          <div className="eyebrow">Waitlist</div>
          <div className="display mt-1 text-5xl text-gold-deep">No. {s.position}</div>
          <div className="mx-auto mt-2 max-w-sm text-sm">
            {props.groupLabel} is full. If a spot opens up and you&apos;re moved in, this page will update, so
            check back. Don&apos;t pay unless you get a spot.
          </div>
        </div>
      )}
      {s.status === "removed" && (
        <div className="py-2 text-center">
          <div className="display text-4xl">No longer signed up</div>
          <div className="mt-2 text-sm">Your spot has been released. Message the board if this is a mistake.</div>
        </div>
      )}
      <div className="rule" />

      {s.status === "confirmed" && (
        <div className="card">
          <h2 className="eyebrow">Payment</h2>
          {s.paid ? (
            <p className="display mt-2 text-2xl text-pine">Payment received. Thank you!</p>
          ) : (
            <>
              <p className="mt-2 text-sm">
                {props.priceCents > 0 && <>Please send <b>{formatPrice(props.priceCents)}</b> </>}
                {s.confirmedAt && <>by <b>{formatDateTime(new Date(new Date(s.confirmedAt).getTime() + PAYMENT_WINDOW_MS))}</b></>}
                , or your spot may go to the next person on the waitlist.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {venmoUrl && (
                  <a href={venmoUrl} target="_blank" rel="noreferrer" className={PAY_TILE}>
                    <span className="eyebrow text-navy">Venmo</span>
                    <span className="mt-1 text-lg font-bold">@{props.venmoHandle}</span>
                  </a>
                )}
                {props.zelleInfo && (
                  <button
                    type="button"
                    className={PAY_TILE}
                    onClick={async () => {
                      await navigator.clipboard.writeText(props.zelleInfo);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    <span className="eyebrow text-navy">{copied ? "Copied" : "Zelle"}</span>
                    <span className="mt-1 text-lg font-bold">{props.zelleInfo}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {s.status !== "removed" && !props.eventOver && (
        <div className="pt-2 text-center">
          <button
            className="text-sm text-ink underline underline-offset-4 hover:text-wine"
            disabled={pending}
            onClick={() => {
              const msg =
                s.status === "confirmed"
                  ? "Give up your spot? You can't undo this. If it's within 5 hours of the event and nobody takes your place, you're still responsible for the ticket cost."
                  : "Leave the waitlist? You can't undo this.";
              if (confirm(msg)) startTransition(async () => {
                  await withdraw(props.token);
                  setS({ ...s, status: "removed" });
                });
            }}
          >
            {pending ? "Removing…" : s.status === "confirmed" ? "I can't make it, give up my spot" : "Leave the waitlist"}
          </button>
        </div>
      )}
    </div>
  );
}
