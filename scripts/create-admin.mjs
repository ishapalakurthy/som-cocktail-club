// Adds a board member, or resets their password. Usually you only need this for the
// first board member; after that, use the Board members page.
// Usage: npm run create-admin -- you@yale.edu "Your Name" "a-password"
import postgres from "postgres";
import bcrypt from "bcryptjs";

const [rawEmail, name, password] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
if (!email || !name || !password || !email.endsWith("@yale.edu") || password.length < 8) {
  console.error('Usage: npm run create-admin -- you@yale.edu "Your Name" "a-password (8+ characters)"');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (put it in .env.local)");

const sql = postgres(url, { prepare: false });
const hash = await bcrypt.hash(password, 10);
await sql`
  insert into admins (email, name, password_hash, added_by) values (${email}, ${name}, ${hash}, 'setup script')
  on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash
`;
console.log(`${email} is on the board and can sign in at /admin.`);
await sql.end();
