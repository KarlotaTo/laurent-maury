import { adminDb } from "@/admin/supabase";
import { CMS_CONFIG } from "@/cms/config";

/** Photo de la médiathèque. */
export type MediaItem = {
  id: string;
  url: string;
  name: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  storage_path: string;
  created_at: string;
};

const MAX_SIDE = 2000;
const QUALITY = 0.82;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function slug(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "photo"
  );
}

/** Réduit la photo à 2 000 px maximum et la convertit en WebP compressé, dans le navigateur. */
async function compress(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Votre navigateur ne permet pas de préparer la photo.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  if (!blob) throw new Error("La photo n'a pas pu être compressée.");
  return { blob, width, height };
}

export async function listMedia(): Promise<MediaItem[]> {
  const { data, error } = await adminDb()
    .from("media")
    .select("id,url,name,alt,width,height,bytes,storage_path,created_at")
    .eq("site_id", CMS_CONFIG.siteId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as MediaItem[];
}

/** Envoie une photo : contrôle, compression, stockage, puis fiche dans la médiathèque. */
export async function uploadMedia(file: File, alt = ""): Promise<MediaItem> {
  if (!ACCEPTED.includes(file.type)) throw new Error(`« ${file.name} » : format non accepté (JPG, PNG, WebP ou photo d'iPhone).`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`« ${file.name} » : fichier trop lourd (25 Mo maximum avant compression).`);
  const { blob, width, height } = await compress(file);
  const db = adminDb();
  const user = (await db.auth.getUser()).data.user;
  const now = new Date();
  const path = `${CMS_CONFIG.siteId}/${now.getFullYear()}/${slug(file.name)}-${crypto.randomUUID().slice(0, 8)}.webp`;
  const up = await db.storage.from("media").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (up.error) throw new Error(`« ${file.name} » : envoi impossible (${up.error.message}).`);
  const url = db.storage.from("media").getPublicUrl(path).data.publicUrl;
  const name = file.name.replace(/\.[^.]+$/, "").slice(0, 160) || "photo";
  const { data, error } = await db
    .from("media")
    .insert({ site_id: CMS_CONFIG.siteId, storage_path: path, url, name, alt: alt.slice(0, 160), width, height, bytes: blob.size, created_by: user?.id })
    .select("id,url,name,alt,width,height,bytes,storage_path,created_at")
    .single();
  if (error) {
    await db.storage.from("media").remove([path]);
    throw new Error(`« ${file.name} » : enregistrement impossible (${error.message}).`);
  }
  return data as MediaItem;
}

/** Pages (brouillon ou version en ligne) et listes qui utilisent encore une photo. */
export async function mediaUsage(url: string): Promise<string[]> {
  const db = adminDb();
  const [pages, versions, settings] = await Promise.all([
    db.from("pages").select("label,draft,published_version_id").eq("site_id", CMS_CONFIG.siteId).is("deleted_at", null),
    db.from("page_versions").select("id,snapshot").eq("site_id", CMS_CONFIG.siteId),
    db.from("site_settings").select("key,value").eq("site_id", CMS_CONFIG.siteId),
  ]);
  const used = new Set<string>();
  const live = new Set((pages.data ?? []).map((p) => p.published_version_id as string | null).filter(Boolean));
  for (const p of pages.data ?? []) if (JSON.stringify(p.draft).includes(url)) used.add(String(p.label));
  for (const v of versions.data ?? []) {
    if (live.has(v.id as string) && JSON.stringify(v.snapshot).includes(url)) used.add(`${(v.snapshot as { label?: string }).label ?? "page"} (en ligne)`);
  }
  for (const s of settings.data ?? []) if (JSON.stringify(s.value).includes(url)) used.add(`réglage « ${s.key} »`);
  return [...used];
}

export async function deleteMedia(item: MediaItem): Promise<void> {
  const usage = await mediaUsage(item.url);
  if (usage.length) throw new Error(`Photo encore utilisée : ${usage.join(", ")}. Retirez-la de ces pages avant de la supprimer.`);
  const db = adminDb();
  const removed = await db.from("media").delete().eq("id", item.id);
  if (removed.error) throw new Error(`Suppression impossible : ${removed.error.message}`);
  await db.storage.from("media").remove([item.storage_path]);
}

export async function updateAlt(id: string, alt: string) {
  const { error } = await adminDb().from("media").update({ alt: alt.slice(0, 160) }).eq("id", id);
  if (error) throw new Error(error.message);
}

export const formatBytes = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`);
