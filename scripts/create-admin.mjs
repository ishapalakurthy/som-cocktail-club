// Creates (or resets the password of) a board member login.
// Usage: npm run create-admin -- you@yale.edu "Your Name" "a-password"
import postgres from "postgres";
import bcrypt from "bcryptjs";

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password) {
  console.error('Usage: npm run create-admin -- you@yale.edu "Your Name" "a-password"');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (put it in .env.local)");

const sql = postgres(url, { prepare: false });
const hash = await bcrypt.hash(password, 10);
await sql`
  insert into admins (email, name, password_hash)
  values (${email.toLowerCase().trim()}, ${name}, ${hash})
  on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash
`;
console.log(`Board member ${email} can now log in at /admin.`);
await sql.end();
