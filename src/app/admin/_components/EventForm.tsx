"use client";

import { useActionState, useState } from "react";
import { GROUPS } from "@/lib/categories";
import { saveEvent } from "../actions";

export type EventFormValues = {
  name: string;
  slug: string;
  description: string;
  location: string;
  starts_at: string;
  opens_at: string;
  price: string;
  venmo_handle: string;
  zelle_info: string;
  cap_first: string;
  cap_second: string;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function EventForm({ eventId, initial }: { eventId: string | null; initial: EventFormValues }) {
  const [state, action, pending] = useActionState(saveEvent.bind(null, eventId), {});
  // After an error, refill the form with what was typed.
  const v = { ...initial, ...state.values };
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(eventId));

  return (
    <form action={action} className="card max-w-2xl space-y-4">
      <div>
        <label className="label" htmlFor="name">Event name *</label>
        <input
          id="name" name="name" required className="input" value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div>
        <label className="label" htmlFor="slug">Link name *</label>
        <div className="flex items-center gap-1 text-sm text-stone-500">
          <span>…/e/</span>
          <input
            id="slug" name="slug" required className="input" value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="starts_at">Event starts *</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required className="input" defaultValue={v.starts_at} />
        </div>
        <div>
          <label className="label" htmlFor="opens_at">Signups unlock at *</label>
          <input id="opens_at" name="opens_at" type="datetime-local" required className="input" defaultValue={v.opens_at} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-stone-500">Times are New Haven time. Before the unlock time, students see a countdown instead of the form.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="cap_first">{GROUPS.first.label} spots *</label>
          <input id="cap_first" name="cap_first" type="number" min={0} required className="input" defaultValue={v.cap_first} />
        </div>
        <div>
          <label className="label" htmlFor="cap_second">{GROUPS.second.label} spots *</label>
          <input id="cap_second" name="cap_second" type="number" min={0} required className="input" defaultValue={v.cap_second} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="location">Location *</label>
        <input id="location" name="location" required className="input" defaultValue={v.location} placeholder="Shown to everyone with the link" />
      </div>
      <div>
        <label className="label" htmlFor="description">Description *</label>
        <textarea id="description" name="description" rows={5} required className="input" defaultValue={v.description} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="price">Price ($) *</label>
          <input id="price" name="price" type="number" min={0} step="0.01" required className="input" defaultValue={v.price} />
        </div>
        <div>
          <label className="label" htmlFor="venmo_handle">Venmo username *</label>
          <input id="venmo_handle" name="venmo_handle" required className="input" defaultValue={v.venmo_handle} placeholder="@your-venmo" />
        </div>
        <div>
          <label className="label" htmlFor="zelle_info">Zelle phone/email *</label>
          <input id="zelle_info" name="zelle_info" required className="input" defaultValue={v.zelle_info} />
        </div>
      </div>
      {state.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : eventId ? "Save changes" : "Create event"}</button>
    </form>
  );
}
