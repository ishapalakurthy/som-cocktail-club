// Adds the first board member (after that, add people from the Board members page).
// Usage: npm run create-admin -- you@yale.edu "Your Name"
import postgres from "postgres";

const [rawEmail, name] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
if (!email || !name || !email.endsWith("@yale.edu")) {
  console.error('Usage: npm run create-admin -- you@yale.edu "Your Name"');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (put it in .env.local)");

const sql = postgres(url, { prepare: false });
await sql`
  insert into admins (email, name, added_by) values (${email}, ${name}, 'setup script')
  on conflict (email) do update set name = excluded.name
`;
console.log(`${email} is on the board. Sign in at /admin with that email.`);
await sql.end();
