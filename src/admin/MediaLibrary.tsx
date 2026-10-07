import { AlertTriangle, Check, Copy, ImagePlus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { deleteMedia, formatBytes, listMedia, updateAlt, uploadMedia, type MediaItem } from "@/admin/media";
import { useAdminSession } from "@/admin/session";
import { adminDb } from "@/admin/supabase";
import { btnDark, btnGhost, ErrorNote, inputCls, SuccessNote } from "@/admin/ui";
import { CMS_CONFIG } from "@/cms/config";
import siteImages from "@/content/images.json";

export type PickedImage = { src: string; alt: string; width?: number; height?: number };

/** Une photo de la médiathèque : envoyée depuis le back-office, ou d'origine (livrée avec le site). */
type Photo = {
  kind: "upload" | "site";
  url: string;
  name: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  alt: string;
  item?: MediaItem;
};

/** Utilisation d'une photo : page et description (attribut alt) employée sur cette page. */
type Usage = { page: string; alt: string };
type Filter = "all" | "upload" | "site" | "noalt" | "unused";
const FILTERS: [Filter, string][] = [
  ["all", "Toutes"],
  ["upload", "Envoyées"],
  ["site", "D'origine"],
  ["noalt", "Description à compléter"],
  ["unused", "Non utilisées"],
];

/** Relève, dans les brouillons de toutes les pages, où chaque photo est utilisée et avec quelle description. */
async function loadUsages(): Promise<Map<string, Usage[]>> {
  const { data } = await adminDb().from("pages").select("label,draft").eq("site_id", CMS_CONFIG.siteId).is("deleted_at", null);
  const map = new Map<string, Usage[]>();
  const add = (url: string, page: string, alt: string) => map.set(url, [...(map.get(url) ?? []), { page, alt }]);
  const walk = (value: unknown, page: string) => {
    if (Array.isArray(value)) value.forEach((v) => walk(v, page));
    else if (value && typeof value === "object") {
      const o = value as Record<string, unknown>;
      if (typeof o["src"] === "string" && "alt" in o) add(String(o["src"]), page, String(o["alt"] ?? ""));
      else Object.values(o).forEach((v) => walk(v, page));
    }
  };
  for (const p of data ?? []) {
    const draft = p.draft as { blocks?: unknown; meta?: unknown; seo?: { image?: string } };
    walk(draft.blocks, String(p.label));
    walk(draft.meta, `${p.label} (carte)`);
    if (draft.seo?.image) add(draft.seo.image, `${p.label} (partage)`, "");
  }
  return map;
}

const weakAlt = (alt: string) => alt.trim().length < 5;

/**
 * Médiathèque : toutes les photos du site (d'origine et envoyées), avec format, dimensions,
 * poids, pages qui les utilisent et descriptions. En mode « choix », un clic sélectionne une photo.
 */
export function MediaLibrary({ onPick }: { onPick?: (img: PickedImage) => void }) {
  const { role } = useAdminSession();
  const [uploads, setUploads] = useState<MediaItem[] | null>(null);
  const [usages, setUsages] = useState<Map<string, Usage[]>>(new Map());
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [media, used] = await Promise.all([listMedia().catch((e: Error) => (setErrors([e.message]), [] as MediaItem[])), loadUsages()]);
    setUploads(media);
    setUsages(used);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const photos: Photo[] = useMemo(() => [
    ...(uploads ?? []).map((m) => ({ kind: "upload" as const, url: m.url, name: m.name, format: "webp", width: m.width, height: m.height, bytes: m.bytes, alt: m.alt, item: m })),
    ...siteImages.map((s) => ({ kind: "site" as const, url: s.url, name: s.url.split("/").pop()!.replace(/\.[^.]+$/, ""), format: s.format, width: s.width, height: s.height, bytes: s.bytes, alt: usages.get(s.url)?.find((u) => !weakAlt(u.alt))?.alt ?? "" })),
  ], [uploads, usages]);

  const visible = photos.filter((p) => {
    const used = usages.get(p.url) ?? [];
    if (filter === "upload") return p.kind === "upload";
    if (filter === "site") return p.kind === "site";
    if (filter === "noalt") return used.some((u) => weakAlt(u.alt)) || (p.kind === "upload" && weakAlt(p.alt));
    if (filter === "unused") return used.length === 0;
    return true;
  });

  const upload = async (files: FileList | File[]) => {
    const list = [...files];
    if (!list.length) return;
    setErrors([]);
    setNotice(null);
    const failed: string[] = [];
    let done = 0;
    for (const file of list) {
      setBusy(`Préparation et envoi de ${file.name} (${done + 1}/${list.length})…`);
      try {
        await uploadMedia(file);
        done++;
      } catch (e) {
        failed.push(e instanceof Error ? e.message : `« ${file.name} » : envoi impossible.`);
      }
    }
    setBusy(null);
    setErrors(failed);
    if (done) setNotice(`${done} photo(s) ajoutée(s), converties en WebP, réduites et compressées automatiquement.`);
    await refresh();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    void upload(e.dataTransfer.files);
  };

  const remove = async (item: MediaItem) => {
    if (!confirm(`Supprimer définitivement « ${item.name} » ?`)) return;
    setErrors([]);
    setNotice(null);
    try {
      await deleteMedia(item);
      setNotice("Photo supprimée.");
      await refresh();
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Suppression impossible."]);
    }
  };

  const total = photos.reduce((s, p) => s + p.bytes, 0);
  const toFix = photos.filter((p) => (usages.get(p.url) ?? []).some((u) => weakAlt(u.alt))).length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-7 text-center transition-colors ${drag ? "border-accent bg-accent/5" : "border-line bg-background"}`}
      >
        <ImagePlus className="size-7 text-accent" aria-hidden="true" />
        <p className="text-[15px]">Glissez vos photos ici, ou</p>
        <button type="button" disabled={!!busy} onClick={() => input.current?.click()} className={btnDark}>Choisir des photos</button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => { if (e.target.files) void upload(e.target.files); e.target.value = ""; }} />
        <p className="text-[12px] text-muted-foreground">JPG, PNG, WebP ou photo d'iPhone · converties en WebP, réduites à 2 000 px et compressées automatiquement</p>
        {busy ? <p role="status" className="text-[14px] text-ink-soft">{busy}</p> : null}
      </div>

      {errors.length ? <ErrorNote>{errors.map((e) => <span key={e} className="block">{e}</span>)}</ErrorNote> : null}
      {notice ? <SuccessNote>{notice}</SuccessNote> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex flex-wrap gap-2">
          {FILTERS.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={filter === key} type="button" onClick={() => setFilter(key)}
              className={`min-h-9 rounded-full px-3.5 text-[13px] ${filter === key ? "bg-primary text-primary-foreground" : "border border-line bg-background hover:bg-sand"}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-muted-foreground">
          {photos.length} photos · {formatBytes(total)} au total{toFix ? <span className="text-accent"> · {toFix} à décrire</span> : null}
        </p>
      </div>

      {!uploads ? <p className="py-8 text-center text-muted-foreground">Chargement des photos…</p> : null}
      {uploads && visible.length === 0 ? <p className="py-6 text-center text-muted-foreground">Aucune photo dans cette catégorie.</p> : null}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {visible.map((photo) => (
          <PhotoCard key={photo.url} photo={photo} usages={usages.get(photo.url) ?? []} canDelete={role !== "contributor"} onPick={onPick}
            onDelete={photo.item ? () => void remove(photo.item!) : undefined} />
        ))}
      </div>
    </div>
  );
}

function PhotoCard({ photo, usages, canDelete, onPick, onDelete }: {
  photo: Photo; usages: Usage[]; canDelete: boolean; onPick?: ((img: PickedImage) => void) | undefined; onDelete?: (() => void) | undefined;
}) {
  const [alt, setAlt] = useState(photo.alt);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const missing = usages.filter((u) => weakAlt(u.alt)).length;
  const pick = () => onPick?.({ src: photo.url, alt, width: photo.width, height: photo.height });
  const saveAlt = async () => {
    if (!photo.item || alt === photo.item.alt) return;
    await updateAlt(photo.item.id, alt);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-background">
      <button type="button" disabled={!onPick} onClick={pick} className="relative block w-full enabled:hover:opacity-90 disabled:cursor-default">
        <img src={photo.url} alt={alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-medium uppercase text-ink">{photo.format}</span>
        <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[11px] text-ink-soft">{photo.kind === "site" ? "D'origine" : "Envoyée"}</span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-[13px] font-medium" title={photo.name}>{photo.name}</p>
        <p className="text-[12px] text-muted-foreground">{photo.width} × {photo.height} px · {formatBytes(photo.bytes)}</p>

        {photo.kind === "upload" ? (
          <label className="block">
            <span className="mb-1 block text-[12px] text-muted-foreground">Description proposée par défaut</span>
            <input value={alt} placeholder="Ce qu'on voit sur la photo" maxLength={160} onChange={(e) => setAlt(e.target.value)} onBlur={() => void saveAlt()} className={`${inputCls} min-h-9 py-1.5 text-[13px]`} />
          </label>
        ) : null}

        <details className="text-[12px]">
          <summary className="cursor-pointer select-none text-ink-soft">
            {usages.length === 0 ? "Non utilisée" : `Utilisée ${usages.length} fois`}
            {missing ? <span className="ml-1 inline-flex items-center gap-1 text-accent"><AlertTriangle className="size-3" /> {missing} sans description</span> : null}
          </summary>
          <ul className="mt-2 space-y-1.5">
            {usages.map((u, i) => (
              <li key={i} className="rounded-md bg-sand/60 px-2 py-1.5">
                <span className="font-medium text-ink">{u.page}</span>
                <span className={`block ${weakAlt(u.alt) ? "text-accent" : "text-muted-foreground"}`}>{weakAlt(u.alt) ? "Description manquante ou trop courte" : `« ${u.alt} »`}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {onPick ? (
            <button type="button" onClick={pick} className={`${btnDark} min-h-9 px-3 text-[13px]`}>Choisir</button>
          ) : (
            <button type="button" onClick={() => { void navigator.clipboard.writeText(photo.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className={`${btnGhost} min-h-9 px-3 text-[13px]`}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copiée" : "Copier l'adresse"}
            </button>
          )}
          {saved ? <span className="text-[12px] text-emerald-700">Enregistré</span> : null}
          {canDelete && onDelete ? (
            <button type="button" aria-label="Supprimer la photo" onClick={onDelete} className="rounded-md p-2 text-accent hover:bg-accent/10"><Trash2 className="size-4" /></button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Fenêtre de choix d'une photo, ouverte depuis un champ photo de l'éditeur. */
export function MediaPickerDialog({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (img: PickedImage) => void; siteImages?: string[] }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Choisir une photo" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 sm:p-10">
      <div className="w-full max-w-6xl rounded-2xl bg-[oklch(0.975_0.005_85)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-3xl">Choisir une photo</h2>
          <button type="button" aria-label="Fermer" onClick={onClose} className="rounded-md p-2 hover:bg-sand"><X className="size-5" /></button>
        </div>
        <MediaLibrary onPick={(img) => { onPick(img); onClose(); }} />
      </div>
    </div>
  );
}
