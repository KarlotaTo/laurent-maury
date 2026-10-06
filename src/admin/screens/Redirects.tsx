import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { fetchPages, type PageRow } from "@/admin/pages-data";
import { adminDb } from "@/admin/supabase";
import { btnPrimary, ErrorNote, inputCls, SuccessNote } from "@/admin/ui";
import { CMS_CONFIG } from "@/cms/config";
import { normalizePath } from "@/cms/redirects";

type Row = { id: string; from_path: string; to_path: string | null; status: 301 | 302 | 410; origin: string; note: string | null; created_at: string };
const STATUS_LABELS: Record<number, string> = { 301: "301 · permanente", 302: "302 · temporaire", 410: "410 · page supprimée" };

export function RedirectsScreen() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<301 | 302 | 410>(301);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await adminDb().from("redirects").select("id,from_path,to_path,status,origin,note,created_at").eq("site_id", CMS_CONFIG.siteId).order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data as Row[]);
  }, []);
  useEffect(() => {
    void load();
    fetchPages().then(setPages, () => setPages([]));
  }, [load]);

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    let from = String(data.get("from") ?? "").trim();
    const to = status === 410 ? null : String(data.get("to") ?? "").trim();
    const note = String(data.get("note") ?? "").trim();
    setError(null);
    setNotice(null);
    // Accepte une adresse complète collée depuis le navigateur : on garde le chemin.
    if (/^https?:\/\//.test(from)) {
      try { from = new URL(from).pathname; } catch { /* laissé tel quel, refusé ci-dessous */ }
    }
    if (!from.startsWith("/")) return setError("L'ancienne adresse doit commencer par / (exemple : /ancienne-page).");
    if (from === "/") return setError("La page d'accueil ne peut pas être redirigée.");
    if (/^\/(admin|images|assets)\b/.test(from)) return setError("Cette adresse est réservée au fonctionnement du site.");
    if (pages.some((p) => normalizePath(p.path) === normalizePath(from))) return setError("Cette adresse correspond à une page existante : la redirection la rendrait inaccessible.");
    if (rows?.some((r) => normalizePath(r.from_path) === normalizePath(from))) return setError("Une redirection existe déjà pour cette adresse.");
    if (status !== 410) {
      if (!to) return setError("Choisissez la page de destination.");
      if (normalizePath(to) === normalizePath(from)) return setError("L'adresse ne peut pas rediriger vers elle-même.");
      if (rows?.some((r) => normalizePath(r.from_path) === normalizePath(to!))) return setError("La destination est elle-même redirigée : choisissez directement la page finale.");
    }
    setBusy(true);
    const { error } = await adminDb().from("redirects").insert({ site_id: CMS_CONFIG.siteId, from_path: from, to_path: to, status, origin: "manual", note: note || null });
    setBusy(false);
    if (error) return setError(`Enregistrement impossible : ${error.message}`);
    form.reset();
    setStatus(301);
    setNotice("Redirection ajoutée : active sur le site dans les 30 secondes.");
    void load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Supprimer la redirection de ${r.from_path} ?`)) return;
    const { error } = await adminDb().from("redirects").delete().eq("id", r.id);
    if (error) setError(error.message);
    else void load();
  };

  return (
    <section className="space-y-4">
      <p className="text-[13px] text-muted-foreground"><Link to="/admin/configuration" className="text-accent hover:underline">Configuration</Link> › Redirections</p>
      <div>
        <h1 className="font-display text-4xl">Redirections</h1>
        <p className="mt-1 max-w-3xl text-[14px] text-muted-foreground">
          Quand une ancienne adresse ne doit plus exister, redirigez-la vers la bonne page : les visiteurs et Google suivent automatiquement, sans lien cassé, et le référencement est conservé.
          Utilisez <strong>301</strong> pour un changement définitif, <strong>302</strong> pour un changement temporaire (promotion), <strong>410</strong> pour une page supprimée sans remplaçante.
        </p>
      </div>

      <form onSubmit={(e) => void add(e)} className="grid gap-4 rounded-2xl border border-line bg-background p-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div>
          <label htmlFor="from" className="mb-1.5 block text-[13px] font-medium">Ancienne adresse</label>
          <input id="from" name="from" required placeholder="/ancienne-page" className={inputCls} />
        </div>
        <div>
          <label htmlFor="status" className="mb-1.5 block text-[13px] font-medium">Type</label>
          <select id="status" value={status} onChange={(e) => setStatus(Number(e.target.value) as 301 | 302 | 410)} className={inputCls}>
            <option value={301}>301 · permanente</option>
            <option value={302}>302 · temporaire</option>
            <option value={410}>410 · page supprimée</option>
          </select>
        </div>
        <div>
          <label htmlFor="to" className="mb-1.5 block text-[13px] font-medium">Nouvelle page</label>
          <select id="to" name="to" disabled={status === 410} className={inputCls} defaultValue="">
            <option value="">{status === 410 ? "— aucune (page supprimée) —" : "— Choisir une page —"}</option>
            {pages.map((p) => <option key={p.id} value={p.path}>{p.label} ({p.path})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="note" className="mb-1.5 block text-[13px] font-medium">Note (facultatif)</label>
          <input id="note" name="note" maxLength={200} placeholder="Ancien site, campagne…" className={inputCls} />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? "Ajout…" : "Ajouter la redirection"}</button>
        </div>
      </form>

      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {notice ? <SuccessNote>{notice}</SuccessNote> : null}

      <div className="overflow-x-auto rounded-2xl border border-line bg-background">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Ancienne adresse</th>
              <th className="px-4 py-3 font-medium">Nouvelle adresse</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Origine</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows?.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucune redirection pour l'instant.</td></tr>
            ) : null}
            {rows?.map((r) => (
              <tr key={r.id} className="border-b border-line/60">
                <td className="px-4 py-3 font-mono text-[13px]">{r.from_path}</td>
                <td className="px-4 py-3 font-mono text-[13px]">{r.to_path ?? "—"}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2.5 py-1 text-[12px] text-sky-800">{STATUS_LABELS[r.status]}</span></td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">{r.origin === "auto" ? "Automatique" : "Manuelle"}{r.note ? ` · ${r.note}` : ""}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" aria-label="Supprimer" onClick={() => void remove(r)} className="rounded-md p-2 text-accent hover:bg-accent/10"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
