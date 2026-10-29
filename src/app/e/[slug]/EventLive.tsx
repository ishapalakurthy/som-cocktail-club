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
      <section className="mt-8">
        <div className="rule" />
        {GROUP_KEYS.map((g) => {
          const r = roster[g];
          const left = Math.max(0, r.cap - r.confirmed.length);
          return (
            <div key={g} className="flex items-baseline gap-3 border-b border-line py-3">
              <div className="flex-1">{GROUPS[g].label}</div>
              {left > 0 ? (
                <span className="font-bold text-pine">{left} {left === 1 ? "spot" : "spots"} left</span>
              ) : (
                <span className="font-bold text-wine">Full</span>
              )}
            </div>
          );
        })}
      </section>

      <section className={isOpen && !notYet ? "mt-8" : "card mt-8"}>
        {notYet ? (
          <div className="py-6 text-center">
            <div className="eyebrow">Signups open</div>
            <div className="mt-1 text-sm text-ink/70">{formatDateTime(props.opensAt)}</div>
            <div className="title mt-3 tabular-nums text-navy">
              {formatCountdown(props.opensAt - currentNow)}
            </div>
          </div>
        ) : isOpen ? (
          <SignupForm slug={props.slug} />
        ) : (
          <p className="heading py-4 text-center">Signups for this event are closed.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="heading text-center">Who&apos;s Coming</h2>
        <div className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {GROUP_KEYS.map((g) => (
            <div key={g}>
              <div className="eyebrow border-b border-line pb-2">{GROUPS[g].short}</div>
              <NameList names={roster[g].confirmed} empty="No one yet" />
              {roster[g].waitlist.length > 0 && (
                <>
                  <div className="eyebrow mt-5 border-b border-line pb-2 text-ink/50">Waitlist</div>
                  <NameList names={roster[g].waitlist} muted />
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NameList({ names, empty, muted }: { names: string[]; empty?: string; muted?: boolean }) {
  if (names.length === 0) return <p className="mt-2 text-sm italic text-ink/40">{empty}</p>;
  return (
    <ol className={`mt-2 space-y-1 ${muted ? "text-ink/55" : ""}`}>
      {names.map((n, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-5 text-right tabular-nums text-gold-deep">{i + 1}</span>
          <span>{n}</span>
        </li>
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
  const v = state.values ?? {};
  const [withPartner, setWithPartner] = useState(v.with_partner === "on");

  return (
    <form action={action} className="space-y-4 rounded-sm border border-line bg-white p-5 shadow-sm sm:p-7">
      <h2 className="heading text-center">Reserve Your Spot</h2>
      <div>
        <label className="label" htmlFor="name">Your name *</label>
        <input id="name" name="name" required className="input" defaultValue={v.name} autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">Yale email * <span className="font-normal text-ink/55">(partners: use your partner&apos;s email)</span></label>
        <input id="email" name="email" type="email" required className="input" defaultValue={v.email} placeholder="you@yale.edu" autoComplete="email" />
      </div>
      <fieldset>
        <legend className="label">Which best describes you? *</legend>
        <div className="space-y-1.5">
          {CATEGORIES.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm max-sm:gap-3 max-sm:py-1">
              <input type="radio" name="category" value={c.key} required className="accent-navy max-sm:size-5" defaultChecked={v.category === c.key} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="dietary">Dietary restrictions</label>
        <input id="dietary" name="dietary" className="input" defaultValue={v.dietary} />
      </div>
      <label className="flex items-center gap-2 text-sm font-bold max-sm:gap-3 max-sm:py-1">
        <input
          type="checkbox" name="with_partner" className="accent-navy max-sm:size-5"
          checked={withPartner} onChange={(e) => setWithPartner(e.target.checked)}
        />
        I&apos;m bringing my partner (takes a second spot)
      </label>
      {withPartner && (
        <div className="space-y-4 border-l-2 border-line pl-4">
          <div>
            <label className="label" htmlFor="partner_name">Partner&apos;s name *</label>
            <input id="partner_name" name="partner_name" required className="input" defaultValue={v.partner_name} />
          </div>
          <div>
            <label className="label" htmlFor="partner_dietary">Partner&apos;s dietary restrictions</label>
            <input id="partner_dietary" name="partner_dietary" className="input" defaultValue={v.partner_dietary} />
          </div>
          <label className="flex items-start gap-2 text-sm max-sm:gap-3 max-sm:py-1">
            <input
              type="checkbox" name="together" className="mt-0.5 shrink-0 accent-navy max-sm:size-5"
              defaultChecked={v.with_partner === "on" ? v.together === "on" : true}
            />
            <span>
              Only sign us up if we both get in. Untick this if you&apos;d take a spot alone and have your partner
              wait on the waitlist.
            </span>
          </label>
        </div>
      )}
      <fieldset className="space-y-1.5 text-sm">
        <legend className="label">By signing up, you acknowledge: *</legend>
        <Ack name="ack1" checked={v.ack1 === "on"}>I will check this page to confirm whether I have received a spot at the event.</Ack>
        <Ack name="ack2" checked={v.ack2 === "on"}>If I get a spot, I will Venmo / Zelle within 24 hours.</Ack>
        <Ack name="ack3" checked={v.ack3 === "on"}>If I do not pay within that time period, my seat may be given to another person.</Ack>
      </fieldset>
      {state.error && <p className="text-sm font-bold text-wine">{state.error}</p>}
      <button className="btn-primary w-full py-3" disabled={pending}>
        {pending ? "Reserving…" : "Reserve my spot"}
      </button>
    </form>
  );
}

function Ack({ name, checked, children }: { name: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2 max-sm:gap-3 max-sm:py-1">
      <input type="checkbox" name={name} required className="mt-0.5 shrink-0 accent-navy max-sm:size-5" defaultChecked={checked} />
      <span>{children}</span>
    </label>
  );
}
