"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getRecipeById, uniqueSlug } from "@/lib/recipes";
import { getEventById } from "@/lib/signups";
import { SPIRITS, type Ingredient } from "@/lib/spirits";
import type { FormState } from "./actions";

export async function saveRecipe(recipeId: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const result = await validateAndSave(recipeId, form);
  // Ingredients live in the form's own state, so only the single fields need refilling.
  const values = Object.fromEntries(
    [...form].filter(([k]) => !k.startsWith("$") && k !== "amount" && k !== "item").map(([k, v]) => [k, String(v)]),
  );
  return { ...result, values };
}

async function validateAndSave(recipeId: string | null, form: FormData): Promise<FormState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const name = get("name");
  if (!name) return { error: "Give the cocktail a name." };
  const spirit = get("spirit");
  if (!SPIRITS.some((s) => s.key === spirit)) return { error: "Choose a base spirit." };

  const amounts = form.getAll("amount").map(String);
  const ingredients: Ingredient[] = form
    .getAll("item")
    .map((item, i) => ({ amount: (amounts[i] ?? "").trim(), item: String(item).trim() }))
    .filter((x) => x.item);
  if (ingredients.length === 0) return { error: "Add at least one ingredient." };

  // Where it was served: one of our events, or a past event that isn't in the app.
  let eventId: string | null = null;
  let pastName: string | null = null;
  let pastDate: string | null = null;
  if (get("source") === "past") {
    pastName = get("past_event_name");
    const month = get("past_event_month"); // "2024-12"
    if (!pastName) return { error: "Enter the past event's name." };
    if (!/^\d{4}-\d{2}$/.test(month)) return { error: "Enter the month and year of the past event." };
    pastDate = `${month}-01`;
  } else {
    const event = await getEventById(get("event_id"));
    if (!event) return { error: "Choose which event it was served at." };
    eventId = event.id;
  }

  const fields = {
    name,
    description: get("description"),
    spirit,
    method: get("method"),
    glass: get("glass"),
    garnish: get("garnish"),
    created_by: get("created_by"),
    event_id: eventId,
    past_event_name: pastName,
    past_event_date: pastDate,
    published: form.get("published") === "on",
  };

  if (recipeId) {
    if (!(await getRecipeById(recipeId))) return { error: "That recipe no longer exists." };
    await sql`
      update recipes set ${sql(fields)}, ingredients = ${sql.json(ingredients)}, updated_at = now()
      where id = ${recipeId}`;
  } else {
    const slug = await uniqueSlug(name, null);
    await sql`
      insert into recipes (slug, name, description, spirit, ingredients, method, glass, garnish, created_by,
                           event_id, past_event_name, past_event_date, published)
      values (${slug}, ${fields.name}, ${fields.description}, ${fields.spirit}, ${sql.json(ingredients)},
              ${fields.method}, ${fields.glass}, ${fields.garnish}, ${fields.created_by},
              ${fields.event_id}, ${fields.past_event_name}, ${fields.past_event_date}, ${fields.published})`;
  }
  revalidatePath("/recipes", "layout");
  redirect(eventId && get("back") === "event" ? `/admin/events/${eventId}` : "/admin/recipes");
}

export async function setPublished(recipeId: string, published: boolean) {
  await requireAdmin();
  await sql`update recipes set published = ${published}, updated_at = now() where id = ${recipeId}`;
  revalidatePath("/admin/recipes");
  revalidatePath("/recipes", "layout");
}

export async function deleteRecipe(recipeId: string) {
  await requireAdmin();
  await sql`delete from recipes where id = ${recipeId}`;
  revalidatePath("/admin/recipes");
  revalidatePath("/recipes", "layout");
}
