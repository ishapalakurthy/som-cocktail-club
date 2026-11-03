import Link from "next/link";
import { listRecipes, type Recipe } from "@/lib/recipes";
import { spiritLabel } from "@/lib/spirits";
import ActionButton from "../../_components/ActionButton";
import CopyLink from "../../_components/CopyLink";
import { deleteRecipe, setPublished } from "../../recipe-actions";

export const metadata = { title: "Recipes · SOM Cocktail Club" };

export default async function RecipesAdminPage() {
  const recipes = await listRecipes({ publishedOnly: false });
  // Group into chapters (already sorted newest chapter first).
  const chapters: { key: string; title: string; label: string; recipes: Recipe[] }[] = [];
  for (const r of recipes) {
    const key = `${r.chapter}|${r.chapterLabel}`;
    const last = chapters.at(-1);
    if (last?.key === key) last.recipes.push(r);
    else chapters.push({ key, title: r.chapter, label: r.chapterLabel, recipes: [r] });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="title">Recipes</h1>
        <Link href="/admin/recipes/new" className="btn-primary">Add a cocktail</Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <Link href="/recipes" target="_blank" className="text-navy underline underline-offset-4">View recipe book</Link>
        <CopyLink
          url={`${process.env.APP_URL}/recipes`}
          label="Copy recipe book link"
          copiedLabel="Copied"
          className="text-navy underline underline-offset-4"
        />
      </div>

      {chapters.length === 0 && (
        <p className="mt-10 text-ink/60">
          No recipes yet. Add drinks from an event&apos;s page after it happens, or add past recipes here.
        </p>
      )}
      {chapters.map((c) => (
        <section key={c.key} className="mt-10">
          <div className="eyebrow">{c.label}</div>
          <h2 className="heading">{c.title}</h2>
          <div className="mt-3 border-t border-line">
            {c.recipes.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-soft py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/recipes/${r.id}/edit`} className="font-bold hover:underline">{r.name}</Link>
                  {!r.published && (
                    <span className="ml-2 rounded-sm bg-gold/15 px-1.5 py-0.5 text-xs font-bold text-gold-deep">Draft</span>
                  )}
                  <div className="text-xs text-ink/55">
                    {spiritLabel(r.spirit)}
                    {r.created_by && <> · by {r.created_by}</>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/recipes/${r.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                  <ActionButton action={setPublished.bind(null, r.id, !r.published)}>
                    {r.published ? "Unpublish" : "Publish"}
                  </ActionButton>
                  <ActionButton
                    action={deleteRecipe.bind(null, r.id)}
                    confirm={`Delete ${r.name}? This can't be undone.`}
                    className="btn-secondary btn-sm text-wine"
                  >
                    Delete
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
