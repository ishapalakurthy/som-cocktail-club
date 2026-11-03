"use client";

import { useActionState, useState } from "react";
import { SPIRITS, type Ingredient } from "@/lib/spirits";
import { saveRecipe } from "../recipe-actions";

export type RecipeFormValues = {
  source: "event" | "past";
  event_id: string;
  past_event_name: string;
  past_event_month: string; // "2024-12"
  name: string;
  spirit: string;
  description: string;
  method: string;
  glass: string;
  garnish: string;
  created_by: string;
  published: boolean;
};

export default function RecipeForm({
  recipeId,
  initial,
  initialIngredients,
  events,
  pastNames,
  back,
}: {
  recipeId: string | null;
  initial: RecipeFormValues;
  initialIngredients: Ingredient[];
  events: { id: string; label: string }[];
  pastNames: string[];
  back: "event" | null;
}) {
  const [state, action, pending] = useActionState(saveRecipe.bind(null, recipeId), {});
  // After an error, refill with what was typed. Checkboxes only come back when ticked. The browser resets
  // dropdowns after a submit, so they're keyed on their value to be rebuilt with the typed choice.
  const v = { ...initial, ...state.values, published: state.values ? state.values.published === "on" : initial.published };
  const [source, setSource] = useState(initial.source);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialIngredients.length ? initialIngredients : [{ amount: "", item: "" }, { amount: "", item: "" }],
  );
  const setIngredient = (i: number, patch: Partial<Ingredient>) =>
    setIngredients((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <form action={action} className="max-w-2xl space-y-5">
      {back && <input type="hidden" name="back" value={back} />}

      <fieldset>
        <legend className="label">Where was it served? *</legend>
        <div className="space-y-3 text-sm">
          <label className="flex flex-wrap items-center gap-2 max-sm:py-1">
            <input
              type="radio" name="source" value="event" className="accent-navy max-sm:size-5"
              checked={source === "event"} onChange={() => setSource("event")}
            />
            One of our events
            <select
              name="event_id" className="input min-w-0 flex-1 sm:ml-2" defaultValue={v.event_id} key={`event-${v.event_id}`}
              disabled={source !== "event"} aria-label="Event"
            >
              <option value="">Choose an event…</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 max-sm:py-1">
            <input
              type="radio" name="source" value="past" className="accent-navy max-sm:size-5"
              checked={source === "past"} onChange={() => setSource("past")}
            />
            A past event that isn&apos;t in the app
          </label>
          {source === "past" && (
            <div className="grid gap-3 border-l-2 border-line pl-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <label className="label" htmlFor="past_event_name">Event name *</label>
                <input
                  id="past_event_name" name="past_event_name" className="input" list="past-event-names"
                  defaultValue={v.past_event_name} placeholder="Holiday Party"
                />
                <datalist id="past-event-names">
                  {pastNames.map((n) => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div>
                <label className="label" htmlFor="past_event_month">Month and year *</label>
                <input id="past_event_month" name="past_event_month" type="month" className="input" defaultValue={v.past_event_month} />
              </div>
            </div>
          )}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className="label" htmlFor="name">Cocktail name *</label>
          <input id="name" name="name" required className="input" defaultValue={v.name} />
        </div>
        <div>
          <label className="label" htmlFor="spirit">Base spirit *</label>
          <select id="spirit" name="spirit" required className="input" defaultValue={v.spirit} key={`spirit-${v.spirit}`}>
            <option value="">Choose…</option>
            {SPIRITS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">One-line description</label>
        <input id="description" name="description" className="input" defaultValue={v.description} placeholder="Mezcal, blood orange, a little heat." />
      </div>

      <fieldset>
        <legend className="label">Ingredients *</legend>
        <div className="space-y-2">
          {ingredients.map((x, i) => (
            <div key={i} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2">
              <input
                name="amount" className="input" placeholder="2 oz" aria-label={`Amount ${i + 1}`}
                value={x.amount} onChange={(e) => setIngredient(i, { amount: e.target.value })}
              />
              <input
                name="item" className="input" placeholder="Ingredient" aria-label={`Ingredient ${i + 1}`}
                value={x.item} onChange={(e) => setIngredient(i, { item: e.target.value })}
              />
              <button
                type="button" className="px-2 text-lg leading-none text-wine disabled:opacity-30"
                aria-label={`Remove ingredient ${i + 1}`} disabled={ingredients.length === 1}
                onClick={() => setIngredients((list) => list.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button" className="mt-2 text-sm font-bold text-navy hover:underline"
          onClick={() => setIngredients((list) => [...list, { amount: "", item: "" }])}
        >
          + Add ingredient
        </button>
      </fieldset>

      <div>
        <label className="label" htmlFor="method">Method <span className="font-normal text-ink/55">(one step per line)</span></label>
        <textarea id="method" name="method" rows={4} className="input" defaultValue={v.method} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="glass">Glass</label>
          <input id="glass" name="glass" className="input" defaultValue={v.glass} placeholder="Coupe" />
        </div>
        <div>
          <label className="label" htmlFor="garnish">Garnish</label>
          <input id="garnish" name="garnish" className="input" defaultValue={v.garnish} placeholder="Orange peel" />
        </div>
        <div>
          <label className="label" htmlFor="created_by">Created by</label>
          <input id="created_by" name="created_by" className="input" defaultValue={v.created_by} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-line-soft pt-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" className="accent-navy max-sm:size-5" defaultChecked={v.published} />
          <span><b>Published</b> <span className="text-ink/55">(unticked = draft, only leads can see it)</span></span>
        </label>
        <button className="btn-primary ml-auto" disabled={pending}>{pending ? "Saving…" : "Save cocktail"}</button>
      </div>
      {state.error && <p className="text-sm font-bold text-wine">{state.error}</p>}
    </form>
  );
}
