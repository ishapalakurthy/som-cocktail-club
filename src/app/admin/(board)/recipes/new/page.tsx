import Link from "next/link";
import { eventChoices, pastEventNames } from "@/lib/recipes";
import RecipeForm from "../../../_components/RecipeForm";

export const metadata = { title: "Add a cocktail · SOM Cocktail Club" };

export default async function NewRecipePage(props: PageProps<"/admin/recipes/new">) {
  // Coming from an event's roster: that event is preselected and saving goes back there.
  const { event } = await props.searchParams;
  const events = await eventChoices();
  const fromEvent = typeof event === "string" && events.some((e) => e.id === event) ? event : null;

  return (
    <>
      <Link href={fromEvent ? `/admin/events/${fromEvent}` : "/admin/recipes"} className="text-sm text-ink/55 hover:underline">
        ← {fromEvent ? "Back to roster" : "All recipes"}
      </Link>
      <h1 className="title mb-6 mt-2">Add a cocktail</h1>
      <RecipeForm
        recipeId={null}
        initial={{
          source: events.length === 0 ? "past" : "event",
          event_id: fromEvent ?? "",
          past_event_name: "",
          past_event_month: "",
          name: "",
          spirit: "",
          description: "",
          method: "",
          glass: "",
          garnish: "",
          created_by: "",
          published: false,
        }}
        initialIngredients={[]}
        events={events}
        pastNames={await pastEventNames()}
        back={fromEvent ? "event" : null}
      />
    </>
  );
}
