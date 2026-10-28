# 🍸 Cocktail Club Signups

Event signups with live first-come-first-served spots, separate capacity for
1st years (incl. 1-year degrees) and 2nd years (incl. exchange students),
waitlists, payment tracking, and email notifications.

## What it does

**Students** (no account needed)
- `/e/<event>`: the link you post in Slack. Shows a countdown until signups unlock, then the form.
  Live spots-left counters and the attendee list (names only) update every few seconds.
- `/s/<private-link>`: each person's status page (✅ in / ⏳ waitlist #N), payment instructions
  with a Venmo button, and a button to give up their spot. The link is emailed to them.

**Board** (`/admin`)
- Create/edit events: name, time, signup unlock time, capacity per group, price, Venmo/Zelle.
- Roster per group: confirmed list with a 24-hour payment countdown and **Venmo / Zelle / Other**
  paid buttons, waitlist with **Move up** (emails them) and **Remove**, and a removed list with
  **Restore** / **Delete**.
- Copy Slack link, download CSV, archive old events, add/remove board members.

Which form answers count toward which group is set in `src/lib/categories.ts`.

## Run it on your laptop

You need Node.js and Postgres (`brew install node postgresql@16 && brew services start postgresql@16`).

```bash
npm install
createdb cocktail_club
cp .env.example .env.local      # then set DATABASE_URL=postgres://<your-mac-username>@localhost:5432/cocktail_club
                                # and SESSION_SECRET (openssl rand -hex 32)
npm run db:setup
npm run create-admin -- you@yale.edu "Your Name" "pick-a-password"
npm run dev                     # open http://localhost:3000/admin
```

## Put it online (free)

1. **Database: [Supabase](https://supabase.com)** → New project. Open **SQL Editor**, paste all of
   `db/schema.sql`, and click Run. Then click **Connect** and copy the **Transaction pooler** URI.
2. **Code: GitHub** → create a private repository and push this folder to it.
3. **Hosting: [Vercel](https://vercel.com)** → Add New Project → import the GitHub repo. Before deploying,
   add the environment variables from `.env.example` (with `APP_URL` set to your Vercel URL,
   e.g. `https://cocktail-club.vercel.app`). Deploy.
4. **First board login**: on your laptop, temporarily set `DATABASE_URL` in `.env.local` to the
   Supabase URI and run `npm run create-admin -- you@yale.edu "Your Name" "a-password"`.
   After that, add other board members from the **Board members** page.

Every push to the `main` branch on GitHub redeploys the site automatically.

## For board members editing the code

- Next.js 16 (App Router) + Postgres via [`postgres`](https://github.com/porsager/postgres) + Tailwind CSS.
- `src/lib/signups.ts` holds all signup logic. A new signup locks the event row so two people can
  never grab the same last spot.
- `src/lib/email.ts` holds the email wording.
- Schema changes: edit `db/schema.sql` (keep it re-runnable) and run it in Supabase's SQL Editor.
