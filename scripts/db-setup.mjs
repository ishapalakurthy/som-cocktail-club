// Creates the tables. Usage: npm run db:setup
import postgres from "postgres";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (put it in .env.local)");

const sql = postgres(url, { prepare: false });
await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
console.log("Database is ready.");
await sql.end();
