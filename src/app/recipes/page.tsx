import Link from "next/link";
import { connection } from "next/server";
import { listRecipes, toPublic } from "@/lib/recipes";
import { MenuHeader } from "../_components/Crest";
import RecipeBook from "./RecipeBook";

export const metadata = { title: "The Recipe Book · SOM Cocktail Club" };

export default async function RecipeBookPage() {
  await connection();
  const recipes = await listRecipes({ publishedOnly: true });

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:py-12">
      <div className="sheet">
        <Link href="/" className="block">
          <MenuHeader />
        </Link>
        <h1 className="title mt-3 text-center">The Recipe Book</h1>
        <p className="mt-2 text-center">Every drink we&apos;ve poured, event by event.</p>
        <RecipeBook recipes={recipes.map(toPublic)} />
      </div>
    </main>
  );
}
