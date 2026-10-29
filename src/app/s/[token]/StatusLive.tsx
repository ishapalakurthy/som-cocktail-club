"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { formatDateTime, PAYMENT_WINDOW_MS } from "@/lib/time";
import { withdraw } from "./actions";

// Venmo and Zelle are matching menu lines; Venmo opens the app, Zelle copies the number.
const PAY_ROW = "flex w-full items-baseline justify-between gap-3 border-b border-line py-3 text-left hover:text-navy";

type Status = { status: "confirmed" | "waitlist" | "removed"; position: number | null; confirmedAt: string | null; paid: boolean; leftWaitlist: boolean };

export default function StatusLive(props: {
  token: string;
  groupLabel: string;
  firstName: string;
  initial: Status;
  priceCents: number;
  venmoHandle: string;
  zelleInfo: string;
  eventName: string;
  eventSlug: string;
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
          <div className="title mt-4 text-pine">You&apos;re in, {props.firstName}</div>
        </div>
      )}
      {s.status === "waitlist" && (
        <div className="py-2 text-center">
          <div className="eyebrow">Waitlist</div>
          <div className="title mt-4 text-gold-deep">No. {s.position}</div>
          <div className="mx-auto mt-2 max-w-sm text-sm">
            {props.groupLabel} is full. If a spot opens up and you&apos;re moved in, this page will update, so
            check back. Don&apos;t pay unless you get a spot.
          </div>
        </div>
      )}
      {s.status === "removed" &&
        (s.leftWaitlist ? (
          <div className="py-2 text-center">
            <div className="title">You&apos;ve left the waitlist</div>
            <div className="mt-2 text-sm">Thanks for letting us know. You can sign up again from the event page.</div>
          </div>
        ) : (
          <div className="py-2 text-center">
            <div className="title">No longer signed up</div>
            <div className="mt-2 text-sm">Your spot has been released. Message the board if this is a mistake.</div>
          </div>
        ))}
      <div className="rule" />

      {s.status === "confirmed" && (
        <section>
          <h2 className="heading text-center">Payment</h2>
          {s.paid ? (
            <p className="mt-2 text-center text-pine">Payment received. Thank you!</p>
          ) : (
            <>
              <p className="mx-auto mt-2 max-w-sm text-center text-sm">
                {props.priceCents > 0 && <>Please send <b>{formatPrice(props.priceCents)}</b> </>}
                {s.confirmedAt && <>by <b>{formatDateTime(new Date(new Date(s.confirmedAt).getTime() + PAYMENT_WINDOW_MS))}</b></>}
                , or your spot may go to the next person on the waitlist.
              </p>
              <div className="mt-5 border-t border-line">
                {venmoUrl && (
                  <a href={venmoUrl} target="_blank" rel="noreferrer" className={PAY_ROW}>
                    <span>Venmo</span>
                    <span className="font-bold">@{props.venmoHandle}</span>
                  </a>
                )}
                {props.zelleInfo && (
                  <button
                    type="button"
                    className={PAY_ROW}
                    onClick={async () => {
                      await navigator.clipboard.writeText(props.zelleInfo);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    <span>Zelle</span>
                    <span className="font-bold">{copied ? "Copied" : props.zelleInfo}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm">
        {s.status !== "removed" && !props.eventOver && (
          <button
            className="font-bold text-wine underline underline-offset-4 hover:text-ink"
            disabled={pending}
            onClick={() => {
              const msg =
                s.status === "confirmed"
                  ? "Give up your spot? You can't undo this. If it's within 5 hours of the event and nobody takes your place, you're still responsible for the ticket cost."
                  : "Leave the waitlist? You'll lose your place in line.";
              if (confirm(msg)) startTransition(async () => {
                  await withdraw(props.token);
                  setS({ ...s, status: "removed", leftWaitlist: s.status === "waitlist" });
                });
            }}
          >
            {pending ? "Removing…" : s.status === "confirmed" ? "Give up my spot" : "Leave the waitlist"}
          </button>
        )}
        <Link href={`/e/${props.eventSlug}`} className="text-navy underline underline-offset-4 hover:text-ink">
          See who&apos;s coming
        </Link>
      </div>
    </div>
  );
}
