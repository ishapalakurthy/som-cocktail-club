import Link from "next/link";
import { notFound } from "next/navigation";
import { eventChoices, getRecipeById, pastEventNames } from "@/lib/recipes";
import RecipeForm from "../../../../_components/RecipeForm";

export const metadata = { title: "Edit cocktail · SOM Cocktail Club" };

export default async function EditRecipePage(props: PageProps<"/admin/recipes/[id]/edit">) {
  const { id } = await props.params;
  const r = await getRecipeById(id);
  if (!r) notFound();

  return (
    <>
      <Link href="/admin/recipes" className="text-sm text-ink/55 hover:underline">← All recipes</Link>
      <h1 className="title mb-6 mt-2">Edit {r.name}</h1>
      <RecipeForm
        recipeId={r.id}
        initial={{
          source: r.event_id ? "event" : "past",
          event_id: r.event_id ?? "",
          past_event_name: r.past_event_name ?? "",
          past_event_month: r.past_event_date ? r.past_event_date.toISOString().slice(0, 7) : "",
          name: r.name,
          spirit: r.spirit,
          description: r.description,
          method: r.method,
          glass: r.glass,
          garnish: r.garnish,
          created_by: r.created_by,
          published: r.published,
        }}
        initialIngredients={r.ingredients}
        events={await eventChoices()}
        pastNames={await pastEventNames()}
        back={null}
      />
    </>
  );
}
