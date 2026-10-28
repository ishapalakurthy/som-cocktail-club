"use server";

import { getSignupByToken, removeSignup } from "@/lib/signups";

export async function withdraw(token: string) {
  const s = await getSignupByToken(token);
  if (!s || s.status === "removed") return;
  await removeSignup(s.id, "self");
}
