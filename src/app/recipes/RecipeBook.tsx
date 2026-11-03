"use client";

import { useState } from "react";
import { SPIRITS } from "@/lib/spirits";
import RecipeCard, { type PublicRecipe } from "./RecipeCard";

export default function RecipeBook({ recipes }: { recipes: PublicRecipe[] }) {
  const [spirit, setSpirit] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Only offer filters for spirits that actually appear in the book.
  const spirits = SPIRITS.filter((s) => recipes.some((r) => r.spirit === s.key));
  const shown = spirit ? recipes.filter((r) => r.spirit === spirit) : recipes;
  // Recipes arrive sorted by chapter; group neighbours. Empty chapters simply don't appear.
  const chapters: { key: string; title: string; label: string; recipes: PublicRecipe[] }[] = [];
  for (const r of shown) {
    const key = `${r.chapter}|${r.chapterLabel}`;
    const last = chapters.at(-1);
    if (last?.key === key) last.recipes.push(r);
    else chapters.push({ key, title: r.chapter, label: r.chapterLabel, recipes: [r] });
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition ${
      active ? "border-navy bg-navy text-cream" : "border-line text-ink hover:border-navy/50"
    }`;

  return (
    <>
      <div className="mt-4 text-center">
        <button
          type="button"
          className="text-sm text-navy underline underline-offset-4 hover:text-ink"
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href.split("#")[0]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      {spirits.length > 1 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" className={chip(spirit === null)} onClick={() => setSpirit(null)}>All</button>
          {spirits.map((s) => (
            <button key={s.key} type="button" className={chip(spirit === s.key)} onClick={() => setSpirit(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {recipes.length === 0 && <p className="rule mt-8 pt-8 text-center text-ink/60">No recipes yet. Check back after our next event.</p>}

      {chapters.map((c) => (
        <section key={c.key} className="rule mt-8 pt-6">
          <div className="eyebrow text-center">{c.label}</div>
          <h2 className="heading mt-1 text-center">{c.title}</h2>
          <div className="mt-2 divide-y divide-line-soft">
            {c.recipes.map((r) => <RecipeCard key={r.slug} r={r} />)}
          </div>
        </section>
      ))}
    </>
  );
}
