import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getAdmin } from "@/lib/auth";
import { getRecipeBySlug, toPublic } from "@/lib/recipes";
import { MenuHeader } from "../../_components/Crest";
import RecipeCard from "../RecipeCard";

export async function generateMetadata(props: PageProps<"/recipes/[slug]">) {
  const r = await getRecipeBySlug((await props.params).slug);
  return { title: `${r?.published ? r.name : "Recipe"} · SOM Cocktail Club` };
}

// One recipe, for sharing a single drink. Drafts are only visible to signed-in leads.
export default async function RecipePage(props: PageProps<"/recipes/[slug]">) {
  await connection();
  const r = await getRecipeBySlug((await props.params).slug);
  if (!r || (!r.published && !(await getAdmin()))) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-6 sm:py-12">
      <div className="sheet">
        <Link href="/recipes" className="block">
          <MenuHeader subtitle="The Recipe Book" />
        </Link>
        {!r.published && (
          <p className="mt-4 text-center text-sm font-bold text-gold-deep">Draft: only leads can see this.</p>
        )}
        <div className="rule mt-6 pt-4 text-center">
          <div className="eyebrow">{r.chapterLabel}</div>
          <div className="mt-1 text-sm">{r.chapter}</div>
        </div>
        <RecipeCard r={toPublic(r)} open />
        <div className="rule pt-5 text-center text-sm">
          <Link href="/recipes" className="text-navy underline underline-offset-4 hover:text-ink">See the whole recipe book</Link>
        </div>
      </div>
    </main>
  );
}
