import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CMS_CONFIG } from "@/cms/config";
import { draftSchema, validateDraft as validate, type Draft, type Role } from "@/cms/validate";
import { forgetSiteData } from "@/cms/source";
import { changedLockedFields } from "@/cms/locks";
import { SETTINGS_SCHEMAS, type SettingKey } from "@/cms/settings";
import { pageSchema } from "@/cms/types";

/**
 * Écritures du back-office, toujours vérifiées côté serveur :
 * 1. identité et rôle de l'utilisateur (jeton de session) ;
 * 2. validité de chaque bloc (champs, limites, photos) ;
 * 3. champs verrouillés inchangés pour les rôles autres que super-admin.
 * L'écriture se fait ensuite avec le jeton de l'utilisateur : les règles
 * d'accès de la base s'appliquent en plus.
 */


async function rest(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${CMS_CONFIG.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: CMS_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(8000),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = (body && (body.message as string)) || `erreur ${response.status}`;
    throw new Error(message.includes("verrouill") || message.includes("réservée") ? message : `La base a refusé l'opération (${message}).`);
  }
  return body;
}

async function caller(token: string): Promise<{ userId: string; role: Role }> {
  const response = await fetch(`${CMS_CONFIG.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: CMS_CONFIG.supabaseAnonKey, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Session expirée : reconnectez-vous.");
  const user = (await response.json()) as { id: string };
  const [platform, member] = await Promise.all([
    rest(token, `platform_admins?select=user_id&user_id=eq.${user.id}`),
    rest(token, `site_members?select=role&site_id=eq.${CMS_CONFIG.siteId}&user_id=eq.${user.id}`),
  ]);
  if ((platform as unknown[]).length > 0) return { userId: user.id, role: "super" };
  const role = (member as { role: Role }[])[0]?.role;
  if (!role) throw new Error("Accès non autorisé à ce site.");
  return { userId: user.id, role };
}

type PageRow = {
  id: string;
  key: string;
  path: string;
  parent_id: string | null;
  template: string;
  sort_order: number;
  label: string;
  in_menu: boolean;
  draft: Draft;
  published_version_id: string | null;
  updated_at: string;
};

async function loadRow(token: string, pageId: string): Promise<PageRow> {
  const rows = (await rest(token, `pages?select=*&id=eq.${pageId}&site_id=eq.${CMS_CONFIG.siteId}`)) as PageRow[];
  if (!rows[0]) throw new Error("Page introuvable ou accès refusé.");
  return rows[0];
}

async function log(token: string, userId: string, action: string, target: string, details?: unknown) {
  await rest(token, "activity_log", {
    method: "POST",
    body: JSON.stringify({ site_id: CMS_CONFIG.siteId, user_id: userId, action, target, details: details ?? null }),
    headers: { Prefer: "return=minimal" },
  }).catch(() => undefined);
}

const saveInput = z.object({
  token: z.string().min(10),
  pageId: z.string().uuid(),
  expectedUpdatedAt: z.string(),
  label: z.string().trim().min(1).max(60),
  inMenu: z.boolean(),
  draft: z.unknown(),
});

/** Enregistre le brouillon d'une page (sans la publier). */
export const savePageDraft = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof saveInput>) => saveInput.parse(input))
  .handler(async ({ data }) => {
    const { userId, role } = await caller(data.token);
    const row = await loadRow(data.token, data.pageId);
    if (row.updated_at !== data.expectedUpdatedAt) {
      return { ok: false as const, problems: ["Cette page a été modifiée entre-temps (par vous dans un autre onglet ou par quelqu'un d'autre). Rechargez-la pour reprendre la dernière version."] };
    }
    const parsed = draftSchema.safeParse(data.draft);
    if (!parsed.success) return { ok: false as const, problems: [`Contenu invalide : ${parsed.error.issues[0]?.message}`] };
    const problems = validate(row.template, parsed.data, row.draft, role);
    if (problems.length) return { ok: false as const, problems };
    if (role === "contributor" && (data.label !== row.label || data.inMenu !== row.in_menu)) {
      return { ok: false as const, problems: ["Le nom et l'affichage dans le menu sont réservés aux éditeurs."] };
    }
    const updated = (await rest(data.token, `pages?id=eq.${data.pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ draft: parsed.data, label: data.label, in_menu: data.inMenu }),
    })) as { updated_at: string }[];
    await log(data.token, userId, "save_draft", row.path);
    return { ok: true as const, updatedAt: updated[0]?.updated_at ?? "" };
  });

const publishInput = z.object({ token: z.string().min(10), pageId: z.string().uuid(), note: z.string().max(200).optional() });

/** Publie le brouillon : version figée dans l'historique, en ligne sous 30 secondes. */
export const publishPage = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof publishInput>) => publishInput.parse(input))
  .handler(async ({ data }) => {
    const { userId, role } = await caller(data.token);
    if (role === "contributor") return { ok: false as const, problems: ["La publication est réservée aux éditeurs et administrateurs."] };
    const row = await loadRow(data.token, data.pageId);
    const parentKey = row.parent_id
      ? ((await rest(data.token, `pages?select=key&id=eq.${row.parent_id}`)) as { key: string }[])[0]?.key ?? null
      : null;
    const snapshot = {
      id: row.key,
      path: row.path,
      parentId: parentKey,
      template: row.template,
      status: "published",
      order: row.sort_order,
      label: row.label,
      inMenu: row.in_menu,
      meta: row.draft.meta ?? {},
      seo: row.draft.seo,
      blocks: row.draft.blocks,
    };
    const parsed = pageSchema.safeParse(snapshot);
    if (!parsed.success) return { ok: false as const, problems: [`Page invalide : ${parsed.error.issues[0]?.message}`] };
    const problems = validate(row.template, row.draft, row.draft, "super");
    if (problems.length) return { ok: false as const, problems };
    const version = (await rest(data.token, "page_versions", {
      method: "POST",
      body: JSON.stringify({ page_id: row.id, site_id: CMS_CONFIG.siteId, snapshot: parsed.data, note: data.note ?? null, created_by: userId }),
    })) as { id: string }[];
    await rest(data.token, `pages?id=eq.${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ published_version_id: version[0]!.id }),
    });
    forgetSiteData();
    await log(data.token, userId, "publish", row.path);
    return { ok: true as const };
  });

const settingInput = z.object({
  token: z.string().min(10),
  key: z.enum(Object.keys(SETTINGS_SCHEMAS) as [SettingKey, ...SettingKey[]]),
  value: z.unknown(),
});

/** Enregistre un réglage du site (avis, questions fréquentes…), en ligne sous 30 secondes. */
export const saveSetting = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof settingInput>) => settingInput.parse(input))
  .handler(async ({ data }) => {
    const { userId, role } = await caller(data.token);
    if (role !== "super" && role !== "admin") return { ok: false as const, problems: ["Réservé aux administrateurs du site."] };
    const parsed = SETTINGS_SCHEMAS[data.key].safeParse(data.value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { ok: false as const, problems: [`${issue?.path.map((p) => (typeof p === "number" ? p + 1 : p)).join(" › ")} : ${issue?.message}`] };
    }
    if (role !== "super") {
      const previous = (await rest(data.token, `site_settings?select=value&site_id=eq.${CMS_CONFIG.siteId}&key=eq.${data.key}`)) as { value: unknown }[];
      const changed = changedLockedFields(SETTINGS_SCHEMAS[data.key], previous[0]?.value ?? {}, parsed.data);
      if (previous[0] && changed.length) return { ok: false as const, problems: [`Champ verrouillé modifié (${changed.join(", ")}).`] };
    }
    await rest(data.token, "site_settings?on_conflict=site_id,key", {
      method: "POST",
      body: JSON.stringify({ site_id: CMS_CONFIG.siteId, key: data.key, value: parsed.data, technical: false }),
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    });
    forgetSiteData();
    await log(data.token, userId, "save_setting", data.key);
    return { ok: true as const };
  });
