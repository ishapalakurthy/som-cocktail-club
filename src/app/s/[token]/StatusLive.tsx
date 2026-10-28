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
    <div className="mt-4 space-y-4">
      {s.status === "confirmed" && (
        <div className="card border-emerald-300 bg-emerald-50">
          <div className="text-3xl font-bold text-emerald-800">✅ You&apos;re in!</div>
          <div className="mt-1 text-emerald-900">You have a spot ({props.groupLabel}).</div>
        </div>
      )}
      {s.status === "waitlist" && (
        <div className="card border-amber-300 bg-amber-50">
          <div className="text-3xl font-bold text-amber-800">⏳ Waitlist #{s.position}</div>
          <div className="mt-1 text-amber-900">
            {props.groupLabel} is full. If a spot opens up and you&apos;re moved in, this page will update, so
            check back. Don&apos;t pay unless you get a spot.
          </div>
        </div>
      )}
      {s.status === "removed" && (
        <div className="card">
          <div className="text-2xl font-bold text-stone-700">You&apos;re no longer signed up</div>
          <div className="mt-1 text-stone-600">Your spot has been released. Message the board if this is a mistake.</div>
        </div>
      )}

      {s.status === "confirmed" && (
        <div className="card">
          <h2 className="font-semibold">Payment</h2>
          {s.paid ? (
            <p className="mt-1 text-emerald-800">💸 Payment received. Thank you!</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-stone-700">
                {props.priceCents > 0 && <>Please send <b>${price}</b> </>}
                {s.confirmedAt && <>by <b>{formatDateTime(new Date(new Date(s.confirmedAt).getTime() + PAYMENT_WINDOW_MS))}</b></>}
                , or your spot may go to the next person on the waitlist. It can take a little while for the board to mark it paid.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {venmoUrl && (
                  <a href={venmoUrl} target="_blank" rel="noreferrer" className="btn-primary">
                    Pay @{props.venmoHandle} on Venmo
                  </a>
                )}
              </div>
              {props.zelleInfo && <p className="mt-3 text-sm text-stone-700">Zelle: <b>{props.zelleInfo}</b></p>}
            </>
          )}
        </div>
      )}

      {s.status !== "removed" && !props.eventOver && (
        <div className="pt-2 text-center">
          <button
            className="text-sm text-stone-500 underline hover:text-rose-700"
            disabled={pending}
            onClick={() => {
              const msg =
                s.status === "confirmed"
                  ? "Give up your spot? You can't undo this. If it's within 48 hours of the event and nobody takes your place, you're still responsible for the ticket cost."
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
