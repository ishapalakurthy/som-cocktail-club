"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDateTime, PAYMENT_WINDOW_MS } from "@/lib/time";
import { withdraw } from "./actions";

type Status = { status: "confirmed" | "waitlist" | "removed"; position: number | null; confirmedAt: string | null; paid: boolean };

export default function StatusLive(props: {
  token: string;
  groupLabel: string;
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
          <div className="display mt-1 text-5xl text-pine">You&apos;re in</div>
          <div className="mt-2 text-sm text-ink/70">You have a spot ({props.groupLabel}).</div>
        </div>
      )}
      {s.status === "waitlist" && (
        <div className="py-2 text-center">
          <div className="eyebrow">Waitlist</div>
          <div className="display mt-1 text-5xl text-gold-deep">No. {s.position}</div>
          <div className="mx-auto mt-2 max-w-sm text-sm text-ink/70">
            {props.groupLabel} is full. If a spot opens up and you&apos;re moved in, this page will update, so
            check back. Don&apos;t pay unless you get a spot.
          </div>
        </div>
      )}
      {s.status === "removed" && (
        <div className="py-2 text-center">
          <div className="display text-4xl text-ink/70">No longer signed up</div>
          <div className="mt-2 text-sm text-ink/60">Your spot has been released. Message the board if this is a mistake.</div>
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
              <p className="mt-2 text-sm text-ink/80">
                {props.priceCents > 0 && <>Please send <b>${price}</b> </>}
                {s.confirmedAt && <>by <b>{formatDateTime(new Date(new Date(s.confirmedAt).getTime() + PAYMENT_WINDOW_MS))}</b></>}
                , or your spot may go to the next person on the waitlist. It can take a little while for the board to mark it paid.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                {venmoUrl && (
                  <a href={venmoUrl} target="_blank" rel="noreferrer" className="btn-primary">
                    Pay @{props.venmoHandle} on Venmo
                  </a>
                )}
                {props.zelleInfo && <span className="text-sm text-ink/80">or Zelle <b>{props.zelleInfo}</b></span>}
              </div>
            </>
          )}
        </div>
      )}

      {s.status !== "removed" && !props.eventOver && (
        <div className="pt-2 text-center">
          <button
            className="text-sm text-ink/50 underline underline-offset-4 hover:text-wine"
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
