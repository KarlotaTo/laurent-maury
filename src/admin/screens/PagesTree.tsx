import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchPages, toTree, type PageRow } from "@/admin/pages-data";
import { useAdminSession } from "@/admin/session";
import { TEMPLATE_LABELS } from "@/cms/templates";
import { ErrorNote, inputCls } from "@/admin/ui";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

export function PagesTreeScreen() {
  const { role } = useAdminSession();
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchPages().then(setPages, (e: Error) => setError(e.message));
  }, []);

  const rows = useMemo(() => {
    const tree = toTree(pages ?? []);
    const q = query.trim().toLowerCase();
    return q ? tree.filter((p) => p.label.toLowerCase().includes(q) || p.path.includes(q)) : tree;
  }, [pages, query]);

  const lockedFor = (template: string) => template === "legal" && role !== "super";

  return (
    <section className="rounded-2xl border border-line bg-background p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Pages du site</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">L'arborescence reprend celle du site, sans limite de niveaux.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="search" className="sr-only">Rechercher une page</label>
          <input id="search" type="search" placeholder="Rechercher une page" value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputCls} w-64`} />
          <span className="inline-flex min-h-11 cursor-not-allowed items-center rounded-lg bg-accent/40 px-5 text-[14px] font-medium text-white" title="Disponible avec l'éditeur de pages">
            + Nouvelle page
          </span>
        </div>
      </div>

      {error ? <ErrorNote>Impossible de charger les pages : {error}</ErrorNote> : null}
      {!pages && !error ? <p className="py-10 text-center text-muted-foreground">Chargement des pages…</p> : null}

      {pages ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">Titre</th>
                <th className="px-4 py-3 font-medium">Modèle</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Menu</th>
                <th className="px-4 py-3 font-medium">Modifiée le</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const locked = lockedFor(p.template);
                return (
                  <tr key={p.id} className={`border-b border-line/60 ${locked ? "bg-sand/50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${p.depth * 26}px` }}>
                        {p.depth > 0 ? <span className="text-muted-foreground/60" aria-hidden="true">└</span> : null}
                        <span className={`${p.depth === 0 ? "font-medium" : ""} ${locked ? "text-muted-foreground" : ""}`}>{p.label}</span>
                        {locked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[11px] text-muted-foreground" title="Verrouillé par sécurité : modification réservée à l'administratrice du site.">
                            <Lock className="size-3" aria-hidden="true" /> Verrouillée
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[12px] text-muted-foreground" style={{ paddingLeft: `${p.depth * 26 + (p.depth ? 22 : 0)}px` }}>
                        {p.path}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[14px] text-ink-soft">{TEMPLATE_LABELS[p.template] ?? p.template}</td>
                    <td className="px-4 py-3">
                      {p.published_version_id ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-800">Publiée</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-800">Brouillon</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[14px]">{p.in_menu ? "Oui" : "—"}</td>
                    <td className="px-4 py-3 text-[14px] text-muted-foreground">{date(p.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {locked ? (
                        <span className="inline-flex min-h-9 cursor-not-allowed items-center rounded-lg border border-line px-3 text-[13px] text-muted-foreground">Verrouillée</span>
                      ) : (
                        <Link to="/admin/pages/$id" params={{ id: p.id }} className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-[13px] text-ink hover:bg-sand">
                          Modifier
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-[13px] text-muted-foreground">{pages.length} pages.</p>
        </div>
      ) : null}
    </section>
  );
}
