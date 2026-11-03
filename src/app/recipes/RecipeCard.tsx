"use client";

import Link from "next/link";
import { useState } from "react";
import { spiritLabel, type Ingredient } from "@/lib/spirits";

// Plain data for the browser (no Dates), built on the server from a Recipe.
export type PublicRecipe = {
  slug: string;
  name: string;
  description: string;
  spirit: string;
  ingredients: Ingredient[];
  method: string;
  glass: string;
  garnish: string;
  created_by: string;
  chapter: string;
  chapterLabel: string;
};

// One menu entry. On phones it starts folded to name + description; `open` shows it all (single recipe page).
export default function RecipeCard({ r, open: alwaysOpen = false }: { r: PublicRecipe; open?: boolean }) {
  const [open, setOpen] = useState(alwaysOpen);
  const steps = r.method.split("\n").map((s) => s.trim()).filter(Boolean);
  const details = [r.glass, r.garnish, r.created_by && `Created by ${r.created_by}`].filter(Boolean);

  return (
    <article id={r.slug} className="py-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl font-semibold leading-tight">
          {alwaysOpen ? r.name : <Link href={`/recipes/${r.slug}`} className="hover:text-navy">{r.name}</Link>}
        </h3>
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.15em] text-gold-deep">{spiritLabel(r.spirit)}</span>
      </div>
      {r.description && <p className="mt-0.5 font-display text-lg italic text-ink/75">{r.description}</p>}

      <div className={open ? "" : "max-sm:hidden"}>
        <div className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <ul className="text-sm">
            {r.ingredients.map((x, i) => (
              <li key={i} className="flex items-baseline gap-2 border-b border-dotted border-line py-1">
                <span>{x.item}</span>
                <span className="ml-auto shrink-0 tabular-nums">{x.amount}</span>
              </li>
            ))}
          </ul>
          {steps.length > 0 && (
            <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed marker:text-gold-deep">
              {steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          )}
        </div>
        {details.length > 0 && <p className="mt-3 text-xs text-ink/60">{details.join(" · ")}</p>}
      </div>

      {!alwaysOpen && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-2 text-sm text-navy underline underline-offset-4 sm:hidden">
          {open ? "Hide recipe" : "Show recipe"}
        </button>
      )}
    </article>
  );
}
