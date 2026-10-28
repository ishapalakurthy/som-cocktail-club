"use server";

import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { emailEnabled, sendSignupEmail } from "@/lib/email";
import { createSignup, DuplicateSignupError, getEventBySlug, waitlistPosition } from "@/lib/signups";

export type SignupState = { error?: string };

export async function signUp(slug: string, _prev: SignupState, form: FormData): Promise<SignupState> {
  const event = await getEventBySlug(slug);
  if (!event || event.archived) return { error: "This event no longer exists." };

  const now = Date.now();
  if (now < event.opens_at.getTime()) return { error: "Signups aren't open yet." };
  if (now > event.starts_at.getTime()) return { error: "Signups for this event are closed." };

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const category = CATEGORIES.find((c) => c.key === form.get("category"));
  const dietary = String(form.get("dietary") ?? "").trim();

  if (!name) return { error: "Please enter your name." };
  if (!/^[^\s@]+@yale\.edu$/.test(email)) return { error: "Please use a @yale.edu email address." };
  if (!category) return { error: "Please choose which option describes you." };
  if (["ack1", "ack2", "ack3"].some((k) => form.get(k) !== "on")) {
    return { error: "Please check all three acknowledgements." };
  }

  let token: string;
  try {
    const s = await createSignup(event, { name, email, category: category.key, group: category.group, dietary });
    await sendSignupEmail(event, s, await waitlistPosition(s));
    token = s.token;
  } catch (err) {
    if (err instanceof DuplicateSignupError) {
      return {
        error: emailEnabled
          ? "You're already signed up for this event. Check your email for your status link."
          : "You're already signed up for this event. Use the status page you bookmarked, or ask the board.",
      };
    }
    console.error(err);
    return { error: "Something went wrong. Please try again." };
  }
  redirect(`/s/${token}?new=1`);
}
