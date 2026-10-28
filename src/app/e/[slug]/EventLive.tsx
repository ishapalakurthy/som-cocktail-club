"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CATEGORIES, GROUPS, GROUP_KEYS } from "@/lib/categories";
import type { LiveRoster } from "@/lib/signups";
import { formatDateTime, formatDuration } from "@/lib/time";
import { signUp } from "./actions";

const POLL_MS = 3000;

export default function EventLive(props: {
  slug: string;
  opensAt: number;
  startsAt: number;
  initialRoster: LiveRoster;
  serverNow: number;
}) {
  const [roster, setRoster] = useState(props.initialRoster);
  // Use the server's clock so a wrong laptop clock can't open the form early.
  const clockSkew = useRef(0);
  const [now, setNow] = useState(props.serverNow);

  useEffect(() => {
    clockSkew.current = props.serverNow - Date.now();
    const tick = setInterval(() => setNow(Date.now() + clockSkew.current), 250);
    return () => clearInterval(tick);
  }, [props.serverNow]);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/events/${props.slug}/live`, { cache: "no-store" });
        if (res.ok && !stop) {
          const data = await res.json();
          setRoster(data.roster);
          clockSkew.current = data.serverNow - Date.now();
        }
      } catch {}
    };
    const id = setInterval(poll, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [props.slug]);

  const currentNow = now;
  const isOpen = currentNow >= props.opensAt && currentNow <= props.startsAt;
  const notYet = currentNow < props.opensAt;

  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {GROUP_KEYS.map((g) => {
          const r = roster[g];
          const left = Math.max(0, r.cap - r.confirmed.length);
          return (
            <div key={g} className="card">
              <div className="text-sm font-medium text-stone-600">{GROUPS[g].label}</div>
              <div className="mt-1 text-2xl font-bold">
                {left > 0 ? (
                  <span className="text-emerald-700">{left} {left === 1 ? "spot" : "spots"} left</span>
                ) : (
                  <span className="text-rose-700">Full</span>
                )}
              </div>
              <div className="text-sm text-stone-500">
                {r.confirmed.length}/{r.cap} taken · {r.waitlist.length} on waitlist
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live, updates automatically
      </p>

      <section className="card mt-6">
        {notYet ? (
          <div className="py-6 text-center">
            <div className="text-sm text-stone-600">Signups open {formatDateTime(props.opensAt)}</div>
            <div className="mt-2 font-mono text-4xl font-bold tabular-nums">
              {formatCountdown(props.opensAt - currentNow)}
            </div>
            <div className="mt-2 text-xs text-stone-500">The form will appear here automatically. No need to refresh.</div>
          </div>
        ) : isOpen ? (
          <SignupForm slug={props.slug} />
        ) : (
          <p className="py-4 text-center text-stone-600">Signups for this event are closed.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Who&apos;s coming</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {GROUP_KEYS.map((g) => (
            <div key={g} className="card">
              <div className="font-medium">{GROUPS[g].label}</div>
              <NameList names={roster[g].confirmed} empty="No one yet" />
              {roster[g].waitlist.length > 0 && (
                <>
                  <div className="mt-4 text-sm font-medium text-stone-500">Waitlist</div>
                  <NameList names={roster[g].waitlist} />
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NameList({ names, empty }: { names: string[]; empty?: string }) {
  if (names.length === 0) return <p className="mt-2 text-sm text-stone-400">{empty}</p>;
  return (
    <ol className="mt-2 list-decimal space-y-0.5 pl-6 text-sm">
      {names.map((n, i) => (
        <li key={i}>{n}</li>
      ))}
    </ol>
  );
}

function formatCountdown(ms: number) {
  if (ms > 24 * 3600 * 1000) return formatDuration(ms);
  const s = Math.max(0, Math.ceil(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${hh > 0 ? `${hh}:` : ""}${String(mm).padStart(hh > 0 ? 2 : 1, "0")}:${String(ss).padStart(2, "0")}`;
}

function SignupForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(signUp.bind(null, slug), {});

  return (
    <form action={action} className="space-y-4">
      <h2 className="text-xl font-semibold">Sign up</h2>
      <div>
        <label className="label" htmlFor="name">Your name *</label>
        <input id="name" name="name" required className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">Yale email * <span className="font-normal text-stone-500">(partners: use your partner&apos;s email)</span></label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@yale.edu" autoComplete="email" />
      </div>
      <fieldset>
        <legend className="label">Which best describes you? *</legend>
        <div className="space-y-1.5">
          {CATEGORIES.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm">
              <input type="radio" name="category" value={c.key} required className="accent-rose-700" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="dietary">Dietary restrictions</label>
        <input id="dietary" name="dietary" className="input" />
      </div>
      <fieldset className="space-y-1.5 rounded-lg bg-stone-50 p-3 text-sm">
        <legend className="label">By signing up, you acknowledge: *</legend>
        <Ack name="ack1">I will check this page to confirm whether I have received a spot at the event.</Ack>
        <Ack name="ack2">If I get a spot, I will Venmo / Zelle within 24 hours.</Ack>
        <Ack name="ack3">If I do not pay within that time period, my seat may be given to another person.</Ack>
      </fieldset>
      {state.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}
      <button className="btn-primary w-full py-3 text-base" disabled={pending}>
        {pending ? "Signing you up…" : "Sign up"}
      </button>
    </form>
  );
}

function Ack({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2">
      <input type="checkbox" name={name} required className="mt-0.5 accent-rose-700" />
      <span>{children}</span>
    </label>
  );
}
