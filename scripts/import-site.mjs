/**
 * Import initial d'un site dans la base : pages (avec une première version publiée)
 * et réglages, depuis les fichiers de src/content.
 * Usage : node --env-file=.env.local scripts/import-site.mjs <slug> "<nom>" <domaine> [--force]
 * Sans --force, refuse de toucher un site qui a déjà des pages (la base fait foi ensuite).
 */
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";

const [slug, name, domain] = process.argv.slice(2);
const force = process.argv.includes("--force");
if (!slug || !name || !domain) throw new Error("Usage : import-site.mjs <slug> <nom> <domaine> [--force]");

const url = readFileSync("supabase/.temp/pooler-url", "utf8").trim()
  .replace("@", `:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@`);
const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await db.connect();
const json = (p) => JSON.parse(readFileSync(p, "utf8"));

try {
  await db.query("begin");
  const site = (await db.query(
    `insert into sites (slug, name, domain) values ($1, $2, $3)
     on conflict (slug) do update set name = excluded.name, domain = excluded.domain returning id`,
    [slug, name, domain],
  )).rows[0].id;

  const existing = (await db.query("select count(*)::int as n from pages where site_id = $1", [site])).rows[0].n;
  if (existing > 0 && !force) throw new Error(`Le site ${slug} a déjà ${existing} pages : import refusé (--force pour écraser).`);
  if (force) await db.query("delete from pages where site_id = $1", [site]);

  const files = readdirSync("src/content/cms/pages").filter((f) => f.endsWith(".json"));
  const pages = files.map((f) => json(`src/content/cms/pages/${f}`));
  const ids = new Map();
  for (const p of pages) {
    const draft = { seo: p.seo, blocks: p.blocks, meta: p.meta ?? {} };
    const row = (await db.query(
      `insert into pages (site_id, key, path, template, sort_order, label, in_menu, draft)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [site, p.id, p.path, p.template, p.order, p.label, p.inMenu, draft],
    )).rows[0];
    ids.set(p.id, row.id);
  }
  for (const p of pages) {
    const pageId = ids.get(p.id);
    if (p.parentId) await db.query("update pages set parent_id = $1 where id = $2", [ids.get(p.parentId), pageId]);
    if (p.status === "published") {
      const v = (await db.query(
        `insert into page_versions (page_id, site_id, snapshot, note) values ($1,$2,$3,'Import initial') returning id`,
        [pageId, site, p],
      )).rows[0];
      await db.query("update pages set published_version_id = $1 where id = $2", [v.id, pageId]);
    }
  }

  const settings = {
    general: [json("src/content/general.json"), false],
    avis: [json("src/content/avis.json"), false],
    engagements: [json("src/content/engagements.json"), false],
    technique: [json("src/content/technique.json"), true],
  };
  for (const [key, [value, technical]] of Object.entries(settings)) {
    await db.query(
      `insert into site_settings (site_id, key, value, technical) values ($1,$2,$3,$4)
       on conflict (site_id, key) do update set value = excluded.value, technical = excluded.technical`,
      [site, key, value, technical],
    );
  }
  await db.query("insert into activity_log (site_id, action, details) values ($1, 'import', $2)", [site, { pages: pages.length }]);
  await db.query("commit");
  console.log(`Site ${slug} (${site}) : ${pages.length} pages et ${Object.keys(settings).length} réglages importés.`);
} catch (e) {
  await db.query("rollback");
  console.error("Import annulé :", e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
