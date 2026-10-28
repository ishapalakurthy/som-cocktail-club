import "server-only";
import nodemailer from "nodemailer";
import type { EventRow, SignupRow } from "./db";
import { GROUPS } from "./categories";
import { formatDateTime } from "./time";

// Sends through any SMTP account (e.g. a club Gmail with an app password).
// If SMTP isn't configured, emails are printed to the server console instead.
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function send(to: string, subject: string, text: string) {
  if (!transport) {
    console.log(`\n[email not sent - SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return;
  }
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  } catch (err) {
    // A failed email should never undo a signup.
    console.error("Failed to send email to", to, err);
  }
}

export function statusUrl(s: SignupRow) {
  return `${process.env.APP_URL}/s/${s.token}`;
}

function paymentLines(e: EventRow) {
  const lines = [];
  if (e.price_cents > 0) lines.push(`Price: $${(e.price_cents / 100).toFixed(2)}`);
  if (e.venmo_handle) lines.push(`Venmo: @${e.venmo_handle.replace(/^@/, "")}`);
  if (e.zelle_info) lines.push(`Zelle: ${e.zelle_info}`);
  return lines.join("\n");
}

function eventLines(e: EventRow) {
  return [e.name, formatDateTime(e.starts_at), e.location].filter(Boolean).join("\n");
}

export async function sendSignupEmail(e: EventRow, s: SignupRow, waitlistPosition: number | null) {
  if (s.status === "confirmed") {
    await send(
      s.email,
      `You're in: ${e.name}`,
      `Hi ${s.name},

You got a spot at:
${eventLines(e)}

Please pay within 24 hours or your spot may be given to someone on the waitlist.
${paymentLines(e)}

Check your status or give up your spot: ${statusUrl(s)}

Cheers,
Cocktail Club`,
    );
  } else {
    await send(
      s.email,
      `Waitlisted: ${e.name}`,
      `Hi ${s.name},

The ${GROUPS[s.group_key].label} spots for ${e.name} are full, so you're #${waitlistPosition} on the waitlist.
We'll email you if a spot opens up. Don't pay unless you get a spot.

Watch your place in line live: ${statusUrl(s)}

Cocktail Club`,
    );
  }
}

export async function sendPromotedEmail(e: EventRow, s: SignupRow) {
  await send(
    s.email,
    `A spot opened up: ${e.name}`,
    `Hi ${s.name},

Good news! You've been moved off the waitlist and have a spot at:
${eventLines(e)}

Please pay within 24 hours or your spot may go to the next person.
${paymentLines(e)}

If you can no longer come, give up your spot here: ${statusUrl(s)}

Cheers,
Cocktail Club`,
  );
}

export async function sendLoginLink(to: string, name: string, link: string) {
  await send(
    to,
    "Your Cocktail Club board sign-in link",
    `Hi ${name},

Click to sign in to the Cocktail Club board (link works once, for 15 minutes):
${link}

If you didn't ask for this, you can ignore this email.`,
  );
}

export async function sendBoardWelcome(to: string, name: string, addedBy: string) {
  await send(
    to,
    "You've been added to the Cocktail Club board",
    `Hi ${name},

${addedBy} gave you board access to Cocktail Club signups.
Sign in with this email address at: ${process.env.APP_URL}/admin

Cocktail Club`,
  );
}
