"use server";

import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { emailEnabled, sendSignupEmail } from "@/lib/email";
import { createSignup, DuplicateSignupError, getEventBySlug, waitlistPosition, type NewPartner } from "@/lib/signups";

export type SignupState = { error?: string; values?: Record<string, string> };

export async function signUp(slug: string, _prev: SignupState, form: FormData): Promise<SignupState> {
  const result = await validateAndSignUp(slug, form);
  // Send back what was typed so the form is refilled, not cleared, after an error.
  const values = Object.fromEntries([...form].filter(([k]) => !k.startsWith("$")).map(([k, v]) => [k, String(v)]));
  return { ...result, values };
}

async function validateAndSignUp(slug: string, form: FormData): Promise<SignupState> {
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

  let partner: NewPartner | undefined;
  if (form.get("with_partner") === "on") {
    const partnerName = String(form.get("partner_name") ?? "").trim();
    if (!partnerName) return { error: "Please enter your partner's name." };
    if (partnerName.toLowerCase() === name.toLowerCase()) return { error: "Your partner's name can't be the same as yours." };
    partner = {
      name: partnerName,
      dietary: String(form.get("partner_dietary") ?? "").trim(),
      together: form.get("together") === "on",
    };
  }

  let token: string;
  try {
    const s = await createSignup(event, { name, email, category: category.key, group: category.group, dietary }, partner);
    await sendSignupEmail(event, s, await waitlistPosition(s));
    token = s.token;
  } catch (err) {
    if (err instanceof DuplicateSignupError) {
      return {
        error: emailEnabled
          ? "You're already signed up for this event. Check your email for your status link."
          : "You're already signed up for this event. Use the link you saved, or ask a lead to send it to you.",
      };
    }
    console.error(err);
    return { error: "Something went wrong. Please try again." };
  }
  redirect(`/s/${token}?new=1`);
}
