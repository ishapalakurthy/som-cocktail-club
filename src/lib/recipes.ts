import "server-only";
import { sql } from "./db";
import type { PublicRecipe } from "@/app/recipes/RecipeCard";
import type { Ingredient } from "./spirits";
import { TIME_ZONE } from "./time";

export type RecipeRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  spirit: string;
  ingredients: Ingredient[];
  method: string;
  glass: string;
  garnish: string;
  created_by: string;
  event_id: string | null;
  past_event_name: string | null;
  past_event_date: Date | null;
  published: boolean;
  created_at: Date;
  updated_at: Date;
};

// A recipe plus the chapter it belongs to: the app event it was made for, or the past event typed in.
export type Recipe = RecipeRow & { chapter: string; chapterDate: Date; chapterLabel: string };

function withChapter(r: RecipeRow & { event_name: string | null; event_starts_at: Date | null }): Recipe {
  const { event_name, event_starts_at, ...rest } = r;
  if (event_name && event_starts_at) {
    return {
      ...rest,
      chapter: event_name,
      chapterDate: event_starts_at,
      chapterLabel: event_starts_at.toLocaleDateString("en-US", {
        timeZone: TIME_ZONE, month: "long", day: "numeric", year: "numeric",
      }),
    };
  }
  const date = r.past_event_date ?? r.created_at;
  return {
    ...rest,
    chapter: r.past_event_name || "Other recipes",
    chapterDate: date,
    // Past events only have a month, stored as the 1st (a plain date, so read it in UTC).
    chapterLabel: date.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" }),
  };
}

// A fresh fragment each time: postgres.js query objects shouldn't be reused across queries.
const select = () => sql`
  select r.*, e.name as event_name, e.starts_at as event_starts_at
  from recipes r left join events e on e.id = r.event_id`;

// Newest chapter first; within a chapter, in the order they were added.
export async function listRecipes({ publishedOnly }: { publishedOnly: boolean }) {
  const rows = await sql<(RecipeRow & { event_name: string | null; event_starts_at: Date | null })[]>`
    ${select()} ${publishedOnly ? sql`where r.published` : sql``}`;
  return rows
    .map(withChapter)
    .sort(
      (a, b) =>
        b.chapterDate.getTime() - a.chapterDate.getTime() ||
        a.chapter.localeCompare(b.chapter) ||
        a.created_at.getTime() - b.created_at.getTime(),
    );
}

export async function getRecipeBySlug(slug: string) {
  const [r] = await sql<(RecipeRow & { event_name: string | null; event_starts_at: Date | null })[]>`
    ${select()} where r.slug = ${slug}`;
  return r ? withChapter(r) : null;
}

export async function getRecipeById(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [r] = await sql<RecipeRow[]>`select * from recipes where id = ${id}`;
  return r ?? null;
}

export async function recipesForEvent(eventId: string) {
  return sql<RecipeRow[]>`select * from recipes where event_id = ${eventId} order by created_at`;
}

// Past-event names already used, so the form can suggest them and chapters don't split over typos.
export async function pastEventNames() {
  const rows = await sql<{ past_event_name: string }[]>`
    select distinct past_event_name from recipes where past_event_name is not null order by 1`;
  return rows.map((r) => r.past_event_name);
}

// "Smoke & Mirrors" -> "smoke-mirrors", with -2, -3... if it's taken.
export async function uniqueSlug(name: string, exceptId: string | null) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cocktail";
  const taken = new Set(
    (await sql<{ slug: string }[]>`
      select slug from recipes where (slug = ${base} or slug like ${base + "-%"}) and id <> ${exceptId ?? "00000000-0000-0000-0000-000000000000"}`
    ).map((r) => r.slug),
  );
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// Events a recipe can be attached to (including archived ones), newest first.
export async function eventChoices() {
  const rows = await sql<{ id: string; name: string; starts_at: Date }[]>`
    select id, name, starts_at from events order by starts_at desc`;
  return rows.map((e) => ({
    id: e.id,
    label: `${e.name} · ${e.starts_at.toLocaleDateString("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric", year: "numeric" })}`,
  }));
}

// Just what the public pages need, as plain data for the browser.
export function toPublic(r: Recipe): PublicRecipe {
  return {
    slug: r.slug,
    name: r.name,
    description: r.description,
    spirit: r.spirit,
    ingredients: r.ingredients,
    method: r.method,
    glass: r.glass,
    garnish: r.garnish,
    created_by: r.created_by,
    chapter: r.chapter,
    chapterLabel: r.chapterLabel,
  };
}
