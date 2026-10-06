/**
 * Vérifie les règles d'accès de la base en simulant chaque rôle.
 * Tout se passe dans une transaction annulée à la fin : rien n'est conservé.
 * Usage : node --env-file=.env.local supabase/tests/rls.test.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const url = readFileSync("supabase/.temp/pooler-url", "utf8").trim()
  .replace("@", `:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@`);
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const ids = {
  siteA: "a0000000-0000-4000-8000-00000000000a", siteB: "b0000000-0000-4000-8000-00000000000b",
  super: "10000000-0000-4000-8000-000000000001", adminA: "10000000-0000-4000-8000-000000000002",
  editorA: "10000000-0000-4000-8000-000000000003", contribA: "10000000-0000-4000-8000-000000000004",
  adminB: "10000000-0000-4000-8000-000000000005",
  pageA: "20000000-0000-4000-8000-00000000000a", pageB: "20000000-0000-4000-8000-00000000000b",
  versionA: "30000000-0000-4000-8000-00000000000a",
};
let passed = 0, failed = 0;
const sp = async (name) => client.query(`savepoint ${name}`);
async function as(user, fn) {
  await client.query("reset role");
  if (user === "anon") {
    await client.query("set local role anon");
    await client.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true)`);
  } else {
    await client.query("set local role authenticated");
    await client.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: user, role: "authenticated" })]);
  }
  try { return await fn(); } finally { await client.query("reset role"); }
}
async function expectOk(label, user, sql, params = [], check) {
  await sp("t");
  try {
    const r = await as(user, () => client.query(sql, params));
    if (check && !check(r)) throw new Error(`résultat inattendu : ${JSON.stringify(r.rows)}`);
    passed++; console.log(`  ok   ${label}`);
  } catch (e) { failed++; console.log(`  ÉCHEC ${label} : ${e.message}`); }
  await client.query("rollback to savepoint t");
}
async function expectDenied(label, user, sql, params = []) {
  await sp("t");
  try {
    const r = await as(user, () => client.query(sql, params));
    if (r.command !== "SELECT" && r.rowCount === 0) { passed++; console.log(`  ok   ${label} (aucune ligne touchée)`); }
    else { failed++; console.log(`  ÉCHEC ${label} : l'action a été acceptée`); }
  } catch { passed++; console.log(`  ok   ${label} (refusé)`); }
  await client.query("rollback to savepoint t");
}

await client.query("begin");
for (const [k, v] of Object.entries(ids)) if (/^(super|admin|editor|contrib)/.test(k))
  await client.query(`insert into auth.users (id, email, aud, role) values ($1, $2, 'authenticated', 'authenticated')`, [v, `${k}@test.invalid`]);
await client.query(`insert into public.sites (id, slug, name, domain) values ($1,'site-a','Site A','a.test'),($2,'site-b','Site B','b.test')`, [ids.siteA, ids.siteB]);
await client.query(`insert into public.platform_admins (user_id) values ($1)`, [ids.super]);
await client.query(`insert into public.site_members (site_id,user_id,role) values ($1,$2,'admin'),($1,$3,'editor'),($1,$4,'contributor'),($5,$6,'admin')`,
  [ids.siteA, ids.adminA, ids.editorA, ids.contribA, ids.siteB, ids.adminB]);
const draft = JSON.stringify({ seo: { title: "T", description: "D", jsonLd: [] }, blocks: [] });
await client.query(`insert into public.pages (id, site_id, key, path, template, label, draft) values ($1,$2,'accueil','/','home','Accueil',$4),($3,$5,'accueil','/','home','Accueil',$4)`,
  [ids.pageA, ids.siteA, ids.pageB, draft, ids.siteB]);
await client.query(`insert into public.page_versions (id, page_id, site_id, snapshot) values ($1,$2,$3,$4)`, [ids.versionA, ids.pageA, ids.siteA, draft]);
await client.query(`insert into public.activity_log (site_id, action) values ($1, 'test')`, [ids.siteA]);
await client.query(`update public.pages set published_version_id = $1 where id = $2`, [ids.versionA, ids.pageA]);

console.log("Isolation entre sites");
await expectOk("l'admin du site A voit sa page", ids.adminA, "select id from pages", [], (r) => r.rows.length === 1 && r.rows[0].id === ids.pageA);
await expectOk("l'admin du site B ne voit pas les pages du site A", ids.adminB, "select id from pages where site_id = $1", [ids.siteA], (r) => r.rows.length === 0);
await expectDenied("l'admin du site B ne peut pas modifier le site A", ids.adminB, "update pages set label = 'x' where id = $1", [ids.pageA]);

console.log("Champs techniques verrouillés");
await expectDenied("l'admin client ne change pas l'adresse d'une page", ids.adminA, "update pages set path = '/autre' where id = $1", [ids.pageA]);
await expectDenied("l'admin client ne change pas les données structurées", ids.adminA, `update pages set draft = jsonb_set(draft, '{seo,jsonLd}', '[{"x":1}]') where id = $1`, [ids.pageA]);
await expectDenied("l'admin client ne change pas le modèle", ids.adminA, "update pages set template = 'free' where id = $1", [ids.pageA]);
await expectOk("l'admin client modifie le titre Google", ids.adminA, `update pages set draft = jsonb_set(draft, '{seo,title}', '"Nouveau"') where id = $1`, [ids.pageA], (r) => r.rowCount === 1);
await expectOk("la super-admin change l'adresse", ids.super, "update pages set path = '/autre' where id = $1", [ids.pageA], (r) => r.rowCount === 1);

console.log("Rôles");
await expectOk("le contributeur modifie le brouillon", ids.contribA, `update pages set draft = jsonb_set(draft, '{seo,title}', '"Brouillon"') where id = $1`, [ids.pageA], (r) => r.rowCount === 1);
await expectDenied("le contributeur ne publie pas", ids.contribA, "update pages set published_version_id = null where id = $1", [ids.pageA]);
await expectDenied("le contributeur ne supprime pas", ids.contribA, "update pages set deleted_at = now() where id = $1", [ids.pageA]);
await expectDenied("le contributeur ne crée pas de page", ids.contribA, `insert into pages (site_id, key, path, template, label, draft) values ($1,'n','/n','free','N','{"seo":{},"blocks":[]}')`, [ids.siteA]);
await expectOk("l'éditeur crée une page", ids.editorA, `insert into pages (site_id, key, path, template, label, draft) values ($1,'n','/n','free','N','{"seo":{},"blocks":[]}')`, [ids.siteA], (r) => r.rowCount === 1);
await expectOk("l'éditeur ne lit pas le journal d'activité", ids.editorA, "select id from activity_log", [], (r) => r.rows.length === 0);
await expectOk("l'admin client lit le journal d'activité", ids.adminA, "select id from activity_log", [], (r) => r.rows.length === 1);
await expectDenied("l'admin client ne nomme pas un autre admin", ids.adminA, "insert into site_members (site_id,user_id,role) values ($1,$2,'admin')", [ids.siteA, ids.adminB]);
await expectOk("l'admin client invite un éditeur", ids.adminA, "insert into site_members (site_id,user_id,role) values ($1,$2,'editor')", [ids.siteA, ids.adminB], (r) => r.rowCount === 1);

console.log("Réglages");
await expectOk("l'admin client modifie les coordonnées", ids.adminA, `insert into site_settings (site_id,key,value) values ($1,'general','{}')`, [ids.siteA], (r) => r.rowCount === 1);
await expectDenied("l'admin client ne crée pas de réglage technique", ids.adminA, `insert into site_settings (site_id,key,value,technical) values ($1,'technique','{}',true)`, [ids.siteA]);
await expectDenied("l'admin client ne crée pas de redirection", ids.adminA, `insert into redirects (site_id,from_path,to_path,status) values ($1,'/a','/b',301)`, [ids.siteA]);

console.log("Médiathèque");
const mediaRow = (site, path, by) => [`insert into media (site_id, storage_path, url, name, width, height, bytes, created_by) values ($1,$2,'https://x/y.webp','photo',10,10,100,$3)`, [site, path, by]];
await expectOk("le contributeur ajoute une photo à son site", ids.contribA, ...mediaRow(ids.siteA, `${ids.siteA}/2026/a.webp`, ids.contribA), (r) => r.rowCount === 1);
await expectDenied("une photo rangée dans le dossier d'un autre site est refusée", ids.adminA, ...mediaRow(ids.siteA, `${ids.siteB}/2026/a.webp`, ids.adminA));
await expectDenied("l'admin du site B n'ajoute pas de photo au site A", ids.adminB, ...mediaRow(ids.siteA, `${ids.siteA}/2026/b.webp`, ids.adminB));
await expectOk("l'admin du site A envoie un fichier dans son dossier", ids.adminA, `insert into storage.objects (bucket_id, name) values ('media', $1)`, [`${ids.siteA}/2026/test.webp`], (r) => r.rowCount === 1);
await expectDenied("l'admin du site B n'envoie pas de fichier dans le dossier du site A", ids.adminB, `insert into storage.objects (bucket_id, name) values ('media', $1)`, [`${ids.siteA}/2026/intrus.webp`]);
await expectDenied("un visiteur n'envoie pas de fichier", "anon", `insert into storage.objects (bucket_id, name) values ('media', $1)`, [`${ids.siteA}/2026/anon.webp`]);

console.log("Visiteur anonyme");
await expectOk("le visiteur lit la version publiée", "anon", "select id from page_versions where site_id = $1", [ids.siteA], (r) => r.rows.length === 1);
await expectOk("le visiteur ne voit aucun brouillon", "anon", "select id from pages", [], (r) => r.rows.length === 0);
await expectOk("le visiteur ne voit pas l'historique des versions non publiées", "anon", "select id from page_versions where site_id = $1 and id <> $2", [ids.siteA, ids.versionA], (r) => r.rows.length === 0);
await expectOk("le visiteur envoie un message", "anon", `insert into messages (site_id,name,email,body) values ($1,'Nom','a@b.fr','Bonjour')`, [ids.siteA], (r) => r.rowCount === 1);
await expectOk("le visiteur ne lit pas les messages", "anon", "select id from messages", [], (r) => r.rows.length === 0);
await expectDenied("le visiteur ne marque pas un message comme traité", "anon", `insert into messages (site_id,name,email,body,status) values ($1,'Nom','a@b.fr','Bonjour','done')`, [ids.siteA]);

await client.query("rollback");
await client.end();
console.log(`\n${passed} réussis, ${failed} échoués`);
process.exit(failed ? 1 : 0);
