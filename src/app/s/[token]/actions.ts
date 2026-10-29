"use server";

import { getPartner, getSignupByToken, removeSignup } from "@/lib/signups";

// "me" gives up the student's spot along with their partner's (the partner came as their guest);
// "partner" drops only the partner and keeps the student's spot.
export async function withdraw(token: string, who: "me" | "partner" = "me") {
  const s = await getSignupByToken(token);
  if (!s || s.status === "removed") return;
  if (who === "partner") {
    const p = await getPartner(s);
    if (p && p.status !== "removed") await removeSignup(p.id, "self");
    return;
  }
  await removeSignup(s.id, "self", true);
}
