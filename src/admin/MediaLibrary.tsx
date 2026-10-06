import { Check, Copy, ImagePlus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { deleteMedia, formatBytes, listMedia, updateAlt, uploadMedia, type MediaItem } from "@/admin/media";
import { useAdminSession } from "@/admin/session";
import { btnDark, btnGhost, ErrorNote, inputCls, SuccessNote } from "@/admin/ui";

export type PickedImage = { src: string; alt: string; width?: number; height?: number };

/**
 * Médiathèque : envoi (glisser-déposer ou bouton), liste, description, suppression.
 * En mode « choix », un clic sur une photo la sélectionne pour un champ photo.
 */
export function MediaLibrary({ onPick, siteImages = [] }: { onPick?: (img: PickedImage) => void; siteImages?: string[] }) {
  const { role } = useAdminSession();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => listMedia().then(setItems, (e: Error) => setErrors([e.message])), []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

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
    if (done) setNotice(`${done} photo(s) ajoutée(s), réduite(s) et compressée(s) automatiquement.`);
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

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${drag ? "border-accent bg-accent/5" : "border-line bg-background"}`}
      >
        <ImagePlus className="size-7 text-accent" aria-hidden="true" />
        <p className="text-[15px]">Glissez vos photos ici, ou</p>
        <button type="button" disabled={!!busy} onClick={() => input.current?.click()} className={btnDark}>Choisir des photos</button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => { if (e.target.files) void upload(e.target.files); e.target.value = ""; }} />
        <p className="text-[12px] text-muted-foreground">JPG, PNG, WebP ou photo d'iPhone · réduites à 2 000 px et compressées automatiquement</p>
        {busy ? <p role="status" className="text-[14px] text-ink-soft">{busy}</p> : null}
      </div>

      {errors.length ? <ErrorNote>{errors.map((e) => <span key={e} className="block">{e}</span>)}</ErrorNote> : null}
      {notice ? <SuccessNote>{notice}</SuccessNote> : null}

      {!items ? <p className="py-8 text-center text-muted-foreground">Chargement des photos…</p> : null}
      {items && items.length === 0 ? <p className="py-6 text-center text-muted-foreground">Aucune photo envoyée pour l'instant.</p> : null}
      {items && items.length > 0 ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} canDelete={role !== "contributor"} onPick={onPick} onDelete={() => void remove(item)} />
          ))}
        </div>
      ) : null}

      {siteImages.length ? (
        <div>
          <h2 className="mb-3 mt-6 text-[15px] font-medium">Photos d'origine du site</h2>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
            {siteImages.map((src) => (
              <button key={src} type="button" disabled={!onPick} onClick={() => onPick?.({ src, alt: "" })}
                className="overflow-hidden rounded-xl border border-line bg-background text-left enabled:hover:border-accent disabled:cursor-default">
                <img src={src} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <span className="block truncate px-2 py-1.5 text-[12px] text-muted-foreground">{src.split("/").pop()}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MediaCard({ item, canDelete, onPick, onDelete }: { item: MediaItem; canDelete: boolean; onPick?: ((img: PickedImage) => void) | undefined; onDelete: () => void }) {
  const [alt, setAlt] = useState(item.alt);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveAlt = async () => {
    if (alt === item.alt) return;
    await updateAlt(item.id, alt);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-background">
      <button type="button" disabled={!onPick} onClick={() => onPick?.({ src: item.url, alt, width: item.width, height: item.height })} className="block w-full enabled:hover:opacity-90 disabled:cursor-default">
        <img src={item.url} alt={alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      </button>
      <div className="space-y-2 p-3">
        <p className="truncate text-[13px] font-medium" title={item.name}>{item.name}</p>
        <p className="text-[12px] text-muted-foreground">{item.width} × {item.height} px · {formatBytes(item.bytes)}</p>
        <label className="block">
          <span className="sr-only">Description de la photo</span>
          <input value={alt} placeholder="Description (pour Google)" maxLength={160} onChange={(e) => setAlt(e.target.value)} onBlur={() => void saveAlt()} className={`${inputCls} min-h-9 py-1.5 text-[13px]`} />
        </label>
        <div className="flex items-center justify-between gap-2">
          {onPick ? (
            <button type="button" onClick={() => onPick({ src: item.url, alt, width: item.width, height: item.height })} className={`${btnDark} min-h-9 px-3 text-[13px]`}>Choisir</button>
          ) : (
            <button type="button" onClick={() => { void navigator.clipboard.writeText(item.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className={`${btnGhost} min-h-9 px-3 text-[13px]`}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copiée" : "Copier l'adresse"}
            </button>
          )}
          {saved ? <span className="text-[12px] text-emerald-700">Enregistré</span> : null}
          {canDelete ? (
            <button type="button" aria-label="Supprimer la photo" onClick={onDelete} className="rounded-md p-2 text-accent hover:bg-accent/10"><Trash2 className="size-4" /></button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Fenêtre de choix d'une photo, ouverte depuis un champ photo de l'éditeur. */
export function MediaPickerDialog({ open, onClose, onPick, siteImages }: { open: boolean; onClose: () => void; onPick: (img: PickedImage) => void; siteImages: string[] }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Choisir une photo" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 sm:p-10">
      <div className="w-full max-w-5xl rounded-2xl bg-[oklch(0.975_0.005_85)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-3xl">Choisir une photo</h2>
          <button type="button" aria-label="Fermer" onClick={onClose} className="rounded-md p-2 hover:bg-sand"><X className="size-5" /></button>
        </div>
        <MediaLibrary onPick={(img) => { onPick(img); onClose(); }} siteImages={siteImages} />
      </div>
    </div>
  );
}
