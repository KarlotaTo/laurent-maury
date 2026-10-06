/**
 * Donne les droits de super-administratrice (UpSEO) à un compte existant.
 * Usage : node --env-file=.env.local scripts/grant-super-admin.mjs <email>
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const email = process.argv[2];
if (!email) throw new Error("Usage : grant-super-admin.mjs <email>");
const url = readFileSync("supabase/.temp/pooler-url", "utf8").trim()
  .replace("@", `:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@`);
const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await db.connect();
const user = (await db.query("select id, email from auth.users where lower(email) = lower($1)", [email])).rows[0];
if (!user) {
  console.error(`Aucun compte pour ${email}.`);
  process.exitCode = 1;
} else {
  await db.query("insert into platform_admins (user_id) values ($1) on conflict do nothing", [user.id]);
  await db.query("insert into activity_log (user_id, action, target) values ($1, 'grant_super_admin', $2)", [user.id, user.email]);
  console.log(`${user.email} est super-administratrice.`);
}
await db.end();
