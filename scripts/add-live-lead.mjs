// Adds a lead (or resets their password) on the LIVE database by asking for each piece in turn,
// so nothing needs quoting in Terminal. Use it for the very first lead; after that, use the Leads page.
// Usage: npm run add-live-lead
import { createInterface } from "node:readline";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const lines = rl[Symbol.asyncIterator]();
async function ask(prompt) {
  process.stdout.write(prompt);
  return (await lines.next()).value ?? "";
}

const url = (await ask("Paste the Supabase database link, then press Enter:\n> ")).trim();
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.error("That doesn't look like a database link. It should start with postgresql://");
  process.exit(1);
}
const email = (await ask("Your Yale email: ")).trim().toLowerCase();
if (!email.endsWith("@yale.edu")) {
  console.error("The email must end in @yale.edu.");
  process.exit(1);
}
const name = (await ask("Your name: ")).trim();
const password = await ask("Password for the site (8+ characters): ");
rl.close();
if (!name || password.length < 8) {
  console.error("Name is required and the password must be at least 8 characters.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });
try {
  await sql`
    insert into admins (email, name, password_hash, added_by)
    values (${email}, ${name}, ${await bcrypt.hash(password, 10)}, 'setup script')
    on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash
  `;
  console.log(`\nDone. ${email} is a lead and can sign in at /admin.`);
} catch (err) {
  console.error(`\nCouldn't save to the database: ${err.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
