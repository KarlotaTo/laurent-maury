import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Eye, EyeOff, Lock, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { FieldEditor, type FormEnv } from "@/admin/form/FieldEditor";
import { useAdminSession } from "@/admin/session";
import { useSite } from "@/cms/context";
import { adminDb } from "@/admin/supabase";
import { btnDark, btnGhost, btnPrimary, ErrorNote, inputCls, SuccessNote } from "@/admin/ui";
import { deleteDraftPage, DUPLICABLE_TEMPLATES, duplicatePage, publishPage, savePageDraft } from "@/cms/admin-server";
import { CMS_CONFIG } from "@/cms/config";
import { outlineOf } from "@/cms/outline";
import { blockRegistry } from "@/cms/registry";
import { seoScore, suggestKeyword } from "@/cms/seo-score";
import { PageBlocks } from "@/cms/render";
import { TEMPLATE_LABELS, TEMPLATE_META } from "@/cms/templates";
import type { BlockInstance, Page } from "@/cms/types";

type Draft = { seo: Page["seo"]; blocks: BlockInstance[]; meta: Record<string, unknown> };
type Row = {
  id: string;
  key: string;
  path: string;
  parent_id: string | null;
  template: string;
  label: string;
  in_menu: boolean;
  draft: Draft;
  published_version_id: string | null;
  updated_at: string;
};
type Version = { id: string; created_at: string; note: string | null; snapshot: Page };
type Tab = "contenu" | "seo" | "reglages";

const newId = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).slice(0, 12);

/** Erreurs d'un bloc, par chemin de champ, en français. */
function blockErrors(block: BlockInstance): Map<string, string> {
  const def = blockRegistry[block.type];
  const out = new Map<string, string>();
  if (!def) return out;
  const parsed = def.schema.safeParse(block.data);
  if (!parsed.success) for (const issue of parsed.error.issues) out.set(issue.path.join("."), issue.message);
  return out;
}

/** Résumé d'un bloc pour sa ligne repliée : son titre ou son surtitre. */
function summary(block: BlockInstance): string {
  const d = (block.data ?? {}) as Record<string, unknown>;
  for (const key of ["title", "label", "eyebrow", "name"]) if (typeof d[key] === "string" && d[key]) return String(d[key]).replace(/[*\n]/g, " ");
  return "";
}

export function PageEditorScreen({ pageId }: { pageId: string }) {
  const { role, session } = useAdminSession();
  const site = useSite();
  const isSuper = role === "super";
  const [row, setRow] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [label, setLabel] = useState("");
  const [inMenu, setInMenu] = useState(false);
  const [pages, setPages] = useState<{ path: string; label: string; id: string; seo?: Page["seo"] }[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [published, setPublished] = useState<Page | null>(null);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [tab, setTab] = useState<Tab>("contenu");
  const [open, setOpen] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const db = adminDb();
    const { data, error } = await db.from("pages").select("id,key,path,parent_id,template,label,in_menu,draft,published_version_id,updated_at").eq("id", pageId).maybeSingle();
    if (error || !data) return setLoadError(error?.message ?? "Page introuvable.");
    const r = data as Row;
    setRow(r);
    setDraft({ seo: r.draft.seo, blocks: r.draft.blocks ?? [], meta: r.draft.meta ?? {} });
    setLabel(r.label);
    setInMenu(r.in_menu);
    const all = await db.from("pages").select("id,path,label,draft").eq("site_id", CMS_CONFIG.siteId).is("deleted_at", null).order("sort_order");
    const list = (all.data ?? []) as { id: string; path: string; label: string; draft: Draft }[];
    setPages(list.map(({ id, path, label, draft }) => ({ id, path, label, seo: draft?.seo })));
    const found = new Set<string>();
    JSON.stringify(list.map((p) => p.draft)).replace(/"(\/images\/[^"]+\.(?:jpe?g|png|webp))"/g, (_, src: string) => (found.add(src), ""));
    setImages([...found].sort());
    if (r.published_version_id) {
      const v = await db.from("page_versions").select("snapshot").eq("id", r.published_version_id).maybeSingle();
      setPublished((v.data?.snapshot as Page) ?? null);
    } else setPublished(null);
  }, [pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = !!row && !!draft && (JSON.stringify(draft) !== JSON.stringify({ seo: row.draft.seo, blocks: row.draft.blocks ?? [], meta: row.draft.meta ?? {} }) || label !== row.label || inMenu !== row.in_menu);
  const unpublished = !!row && !!draft && !!published && (JSON.stringify({ seo: draft.seo, blocks: draft.blocks }) !== JSON.stringify({ seo: published.seo, blocks: published.blocks }) || label !== published.label);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const env: FormEnv = useMemo(() => ({ canUnlock: isSuper, errors: new Map(), pages, images }), [isSuper, pages, images]);
  const invalidCount = draft ? draft.blocks.filter((b) => !b.hidden && blockErrors(b).size > 0).length : 0;

  if (loadError) return <ErrorNote>Impossible d'ouvrir la page : {loadError}</ErrorNote>;
  if (!row || !draft) return <p className="py-16 text-center text-muted-foreground">Chargement de la page…</p>;

  const lockedPage = row.template === "legal" && !isSuper;
  const setBlocks = (blocks: BlockInstance[]) => setDraft({ ...draft, blocks });
  const updateBlock = (id: string, patch: Partial<BlockInstance>) => setBlocks(draft.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const moveBlock = (i: number, d: number) => {
    const next = [...draft.blocks];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x!);
    setBlocks(next);
  };

  const token = async () => (await adminDb().auth.getSession()).data.session?.access_token ?? session?.access_token ?? "";

  const save = async (): Promise<boolean> => {
    setBusy("save");
    setProblems([]);
    setNotice(null);
    try {
      const result = await savePageDraft({ data: { token: await token(), pageId: row.id, expectedUpdatedAt: row.updated_at, label, inMenu, draft } });
      if (!result.ok) {
        setProblems(result.problems);
        return false;
      }
      await load();
      setNotice("Brouillon enregistré.");
      return true;
    } catch (e) {
      setProblems([e instanceof Error ? e.message : "Enregistrement impossible."]);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (dirty && !(await save())) return;
    setBusy("publish");
    setProblems([]);
    try {
      const result = await publishPage({ data: { token: await token(), pageId: row.id } });
      if (!result.ok) return setProblems(result.problems);
      await load();
      setVersions(null);
      setNotice("Page publiée : elle est en ligne dans les 30 secondes.");
    } catch (e) {
      setProblems([e instanceof Error ? e.message : "Publication impossible."]);
    } finally {
      setBusy(null);
    }
  };

  const duplicate = async (title: string, focusKeyword: string) => {
    if (dirty && !confirm("Les modifications non enregistrées de cette page ne seront pas reprises dans la copie. Continuer ?")) return;
    setBusy("save");
    setProblems([]);
    try {
      const result = await duplicatePage({ data: { token: await token(), pageId: row.id, title, focusKeyword } });
      if (!result.ok) return setProblems(result.problems);
      setDuplicating(false);
      await navigate({ to: "/admin/pages/$id", params: { id: result.pageId } });
    } catch (e) {
      setProblems([e instanceof Error ? e.message : "Duplication impossible."]);
    } finally {
      setBusy(null);
    }
  };

  const removeDraft = async () => {
    if (!confirm(`Supprimer définitivement la page « ${row.label} » ? Elle n'a jamais été publiée.`)) return;
    const result = await deleteDraftPage({ data: { token: await token(), pageId: row.id } });
    if (!result.ok) return setProblems(result.problems);
    await navigate({ to: "/admin/pages" });
  };

  const openHistory = async () => {
    const { data } = await adminDb().from("page_versions").select("id,created_at,note,snapshot").eq("page_id", row.id).order("created_at", { ascending: false }).limit(30);
    setVersions((data ?? []) as Version[]);
  };
  const restore = (v: Version) => {
    setDraft({ seo: v.snapshot.seo, blocks: v.snapshot.blocks, meta: v.snapshot.meta ?? {} });
    setLabel(v.snapshot.label);
    setVersions(null);
    setNotice(`Version du ${new Date(v.created_at).toLocaleString("fr-FR")} remise dans le brouillon. Enregistrez puis publiez pour la remettre en ligne.`);
  };

  const score = seoScore(
    { path: row.path, seo: draft.seo, blocks: draft.blocks },
    pages.filter((p) => p.id !== row.id && p.seo).map((p) => ({ path: p.path, seo: p.seo!, blocks: [] })),
    { places: [...site.zones.map((z) => z.name), "Toulouse", "Balma"], faq: site.faq },
  );
  const scored = row.template !== "legal";
  const scoreCls = score.score >= 80 ? "bg-emerald-50 text-emerald-800" : score.score >= 50 ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-800";

  const status = !row.published_version_id ? (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-800">Brouillon</span>
  ) : unpublished || dirty ? (
    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[12px] font-medium text-sky-800">Modifications non publiées</span>
  ) : (
    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-800">Publiée</span>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted-foreground">
            <Link to="/admin/pages" className="text-accent hover:underline">Pages</Link> › {row.label}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl">{row.label}</h1>
            {status}
            {scored ? (
              <button type="button" onClick={() => { setPreview(false); setTab("seo"); }} className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${scoreCls}`} title="Voir le détail du score SEO">
                SEO {score.score}/100
              </button>
            ) : null}
            {dirty ? <span className="text-[13px] text-muted-foreground">· modifications non enregistrées</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={row.path} target="_blank" rel="noreferrer" className={btnGhost}>Voir en ligne ↗</a>
          <button type="button" onClick={() => setPreview((p) => !p)} className={btnGhost}>{preview ? "Revenir à l'édition" : "Aperçu"}</button>
          <button type="button" onClick={() => void openHistory()} className={btnGhost}>Historique</button>
          {(DUPLICABLE_TEMPLATES as readonly string[]).includes(row.template) && role !== "contributor" ? (
            <button type="button" onClick={() => setDuplicating(true)} className={btnGhost}>Dupliquer la page</button>
          ) : null}
          {!row.published_version_id && role !== "contributor" ? (
            <button type="button" onClick={() => void removeDraft()} className={`${btnGhost} text-accent`}>Supprimer la page</button>
          ) : null}
          <button type="button" disabled={!dirty || !!busy || lockedPage} onClick={() => void save()} className={btnDark}>
            {busy === "save" ? "Enregistrement…" : "Enregistrer le brouillon"}
          </button>
          {role !== "contributor" ? (
            <button type="button" disabled={!!busy || lockedPage || (!dirty && !unpublished && !!row.published_version_id)} onClick={() => void publish()} className={btnPrimary}>
              {busy === "publish" ? "Publication…" : "Publier"}
            </button>
          ) : null}
        </div>
      </div>

      {lockedPage ? (
        <p className="flex items-center gap-2 rounded-lg bg-sand px-4 py-3 text-[14px] text-muted-foreground">
          <Lock className="size-4" aria-hidden="true" /> Page verrouillée par sécurité : modification réservée à l'administratrice du site.
        </p>
      ) : null}
      {problems.length ? (
        <ErrorNote>
          {problems.length === 1 ? problems[0] : (
            <span className="block space-y-1">{problems.map((p) => <span key={p} className="block">• {p}</span>)}</span>
          )}
        </ErrorNote>
      ) : null}
      {notice ? <SuccessNote>{notice}</SuccessNote> : null}
      {invalidCount > 0 ? <ErrorNote>{invalidCount} bloc(s) à compléter avant de pouvoir enregistrer : ils sont signalés en rouge ci-dessous.</ErrorNote> : null}

      {duplicating ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void duplicate(String(form.get("title") ?? ""), String(form.get("keyword") ?? ""));
          }}
          className="rounded-2xl border border-accent/40 bg-background p-5"
        >
          <h2 className="text-lg font-medium">Dupliquer cette page</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            La copie reprend tous les blocs et toutes les photos de cette page, pour que vous n'ayez plus qu'à remplacer textes et photos. Elle est créée en brouillon : invisible sur le site tant que vous ne la publiez pas.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] flex-1">
              <label htmlFor="dup-title" className="mb-1.5 block text-[13px] font-medium">Titre de la nouvelle page</label>
              <input id="dup-title" name="title" required minLength={3} maxLength={90} autoFocus placeholder="Rénovation d'une salle de bains à Fronton" className={inputCls}
                onInput={(e) => {
                  const keyword = e.currentTarget.form?.elements.namedItem("keyword") as HTMLInputElement | null;
                  if (keyword && keyword.dataset["edited"] !== "1") keyword.value = suggestKeyword(e.currentTarget.value);
                }} />
              <p className="mt-1.5 text-[12px] text-muted-foreground">L'adresse de la page est créée à partir du titre.</p>
            </div>
            <div className="min-w-[240px] flex-1">
              <label htmlFor="dup-keyword" className="mb-1.5 block text-[13px] font-medium">Expression clé visée <span className="text-accent">★</span></label>
              <input id="dup-keyword" name="keyword" maxLength={80} placeholder="salle de bains Fronton" className={inputCls}
                onInput={(e) => { e.currentTarget.dataset["edited"] = "1"; }} />
              <p className="mt-1.5 text-[12px] text-muted-foreground">Proposée à partir du titre : ajustez-la (le métier et la ville).</p>
            </div>
            <button type="submit" disabled={!!busy} className={btnPrimary}>{busy ? "Création…" : "Créer la copie"}</button>
            <button type="button" onClick={() => setDuplicating(false)} className={btnGhost}>Annuler</button>
          </div>
        </form>
      ) : null}

      {versions ? (
        <section className="rounded-2xl border border-line bg-background p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Historique des publications</h2>
            <button type="button" onClick={() => setVersions(null)} className="text-[14px] text-accent hover:underline">Fermer</button>
          </div>
          {versions.length === 0 ? <p className="text-muted-foreground">Aucune version publiée pour l'instant.</p> : (
            <ul className="divide-y divide-line">
              {versions.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-[14px]">
                    {new Date(v.created_at).toLocaleString("fr-FR")}
                    {v.id === row.published_version_id ? <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] text-emerald-800">en ligne</span> : null}
                    {v.note ? <span className="ml-2 text-muted-foreground">· {v.note}</span> : null}
                  </span>
                  <button type="button" onClick={() => restore(v)} className={btnGhost}>Remettre dans le brouillon</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {preview ? (
        <section className="overflow-hidden rounded-2xl border border-line bg-background">
          <p className="border-b border-line bg-sand px-4 py-2 text-[13px] text-muted-foreground">Aperçu du brouillon (largeur réduite ; la page en ligne n'est pas modifiée tant que vous ne publiez pas)</p>
          <div className="pointer-events-none">
            <PageBlocks blocks={draft.blocks} />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-background px-6 pb-6">
          <div role="tablist" className="mb-5 flex flex-wrap gap-7 border-b border-line">
            {([["contenu", "Contenu de la page"], ["seo", "SEO et Google"], ["reglages", "Réglages de la page"]] as const).map(([key, text]) => (
              <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)}
                className={`min-h-12 border-b-2 text-[15px] ${tab === key ? "border-accent font-medium text-accent" : "border-transparent text-muted-foreground"}`}>
                {text}
              </button>
            ))}
          </div>

          {tab === "contenu" ? (
            <div className="space-y-3">
              <p className="text-[14px] text-muted-foreground">La page est composée de blocs dessinés pour le site : vous modifiez leur contenu, leur ordre, vous pouvez en ajouter ou en retirer, la mise en page reste celle du site.</p>
              {draft.blocks.map((block, i) => {
                const def = blockRegistry[block.type];
                const errors = blockErrors(block);
                const isOpen = open === block.id;
                return (
                  <div key={block.id} className={`overflow-hidden rounded-xl border ${errors.size && !block.hidden ? "border-accent/60" : "border-line"}`}>
                    <div className={`flex flex-wrap items-center gap-2 px-3 py-2 ${block.hidden ? "bg-sand/60" : "bg-[oklch(0.985_0.004_85)]"}`}>
                      <button type="button" onClick={() => setOpen(isOpen ? null : block.id)} className="flex min-h-10 flex-1 items-center gap-2 text-left">
                        {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        <span className="rounded-full bg-[#EFE7DD] px-2.5 py-0.5 text-[12px] text-[#6B4E36]">{def?.label ?? block.type}</span>
                        <span className={`truncate text-[15px] ${block.hidden ? "text-muted-foreground line-through" : ""}`}>{summary(block)}</span>
                        {errors.size && !block.hidden ? <span className="text-[12px] text-accent">à compléter</span> : null}
                        {block.hidden ? <span className="text-[12px] text-muted-foreground">masqué</span> : null}
                      </button>
                      {!lockedPage ? (
                        <div className="flex items-center gap-0.5">
                          <button type="button" aria-label="Monter" disabled={i === 0} onClick={() => moveBlock(i, -1)} className="rounded-md p-2 hover:bg-sand disabled:opacity-30"><ArrowUp className="size-4" /></button>
                          <button type="button" aria-label="Descendre" disabled={i === draft.blocks.length - 1} onClick={() => moveBlock(i, 1)} className="rounded-md p-2 hover:bg-sand disabled:opacity-30"><ArrowDown className="size-4" /></button>
                          <button type="button" aria-label={block.hidden ? "Afficher" : "Masquer"} onClick={() => updateBlock(block.id, { hidden: !block.hidden })} className="rounded-md p-2 hover:bg-sand">{block.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
                          <button type="button" aria-label="Dupliquer" onClick={() => { const copy = { ...structuredClone(block), id: newId() }; const next = [...draft.blocks]; next.splice(i + 1, 0, copy); setBlocks(next); }} className="rounded-md p-2 hover:bg-sand"><Copy className="size-4" /></button>
                          <button type="button" aria-label="Supprimer" onClick={() => { if (confirm(`Supprimer le bloc « ${def?.label ?? block.type} » ? Vous pourrez le retrouver dans l'historique tant que vous n'avez pas publié.`)) setBlocks(draft.blocks.filter((b) => b.id !== block.id)); }} className="rounded-md p-2 text-accent hover:bg-accent/10"><Trash2 className="size-4" /></button>
                        </div>
                      ) : null}
                    </div>
                    {isOpen && def ? (
                      <div className="space-y-4 border-t border-line p-4">
                        {def.backgrounds.length > 1 && !lockedPage ? (
                          <div>
                            <label htmlFor={`bg-${block.id}`} className="mb-1.5 block text-[13px] font-medium">Fond du bloc</label>
                            <select id={`bg-${block.id}`} value={block.background ?? def.backgrounds[0]} onChange={(e) => updateBlock(block.id, { background: e.target.value as BlockInstance["background"] })} className={`${inputCls} max-w-xs`}>
                              {def.backgrounds.map((b) => <option key={b} value={b}>{{ light: "Clair", sand: "Sable", dark: "Bleu nuit" }[b]}</option>)}
                            </select>
                          </div>
                        ) : null}
                        <FieldEditor schema={def.schema} value={block.data} path="" env={{ ...env, errors, blockType: block.type }}
                          inheritedLock={lockedPage}
                          onChange={(data) => updateBlock(block.id, { data })} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!lockedPage ? (
                <button type="button" onClick={() => setShowLibrary((s) => !s)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-[15px] text-ink-soft hover:bg-sand">
                  <Plus className="size-4" aria-hidden="true" /> Ajouter un bloc
                </button>
              ) : null}
              {showLibrary ? (
                <div className="grid gap-3 rounded-xl bg-sand p-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                  {Object.values(blockRegistry).sort((a, b) => a.label.localeCompare(b.label, "fr")).map((def) => (
                    <button key={def.type} type="button" onClick={() => { const id = newId(); setBlocks([...draft.blocks, { id, type: def.type, data: structuredClone(def.example) }]); setOpen(id); setShowLibrary(false); }}
                      className="rounded-xl border border-line bg-background p-4 text-left hover:border-accent">
                      <span className="block font-medium">{def.label}</span>
                      <span className="mt-1 block text-[13px] text-muted-foreground">{def.description}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "seo" ? (
            <div className="space-y-8">
              <SeoTab draft={draft} setDraft={setDraft} path={row.path} isSuper={isSuper} locked={lockedPage} />
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                {scored ? <ScorePanel score={score} /> : <p className="rounded-xl border border-line p-5 text-[14px] text-muted-foreground">Page légale : pas de score SEO, elle n'a pas vocation à se positionner dans Google.</p>}
                <OutlinePanel blocks={draft.blocks} />
              </div>
            </div>
          ) : null}

          {tab === "reglages" ? (
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
              <div>
                <label htmlFor="label" className="mb-1.5 block text-[13px] font-medium">Nom de la page (menu, fil d'Ariane, arborescence)</label>
                <input id="label" value={label} maxLength={60} readOnly={role === "contributor" || lockedPage} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
              </div>
              <div>
                <span className="mb-1.5 block text-[13px] font-medium">Navigation</span>
                <label className="flex min-h-11 items-center gap-2.5 text-[14px]">
                  <input type="checkbox" checked={inMenu} disabled={role === "contributor" || lockedPage} onChange={(e) => setInMenu(e.target.checked)} className="size-4" />
                  Afficher dans le menu du site
                </label>
              </div>
              <ReadOnly label="Modèle de page" value={TEMPLATE_LABELS[row.template] ?? row.template} />
              <ReadOnly label="Page parente" value={pages.find((p) => p.id === row.parent_id)?.label ?? "Aucune (premier niveau)"} hint="Déplacer une page arrive avec la création de pages (redirection automatique)." />
              {TEMPLATE_META[row.template] ? (
                <div className="[grid-column:1/-1]">
                  <h3 className="mb-3 text-[15px] font-medium">Informations affichées dans les listes du site</h3>
                  <FieldEditor schema={TEMPLATE_META[row.template] as z.ZodTypeAny} value={draft.meta} path="" env={{ ...env, errors: new Map() }}
                    inheritedLock={lockedPage} onChange={(meta) => setDraft({ ...draft, meta: meta as Record<string, unknown> })} />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function ReadOnly({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium"><Lock className="size-3" aria-hidden="true" />{label}</span>
      <p className="rounded-lg border border-dashed border-line bg-sand px-3.5 py-2.5 text-[15px] text-muted-foreground">{value}</p>
      {hint ? <p className="mt-1.5 text-[12px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SeoTab({ draft, setDraft, path, isSuper, locked }: { draft: Draft; setDraft: (d: Draft) => void; path: string; isSuper: boolean; locked: boolean }) {
  const seo = draft.seo;
  const set = (patch: Partial<Page["seo"]>) => setDraft({ ...draft, seo: { ...seo, ...patch } });
  const host = typeof window !== "undefined" ? window.location.host : "";
  return (
    <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
      <div className="space-y-5">
        <div>
          <label htmlFor="seo-keyword" className="mb-1.5 block text-[13px] font-medium">Expression clé visée <span className="text-accent">★</span></label>
          <input id="seo-keyword" value={seo.focusKeyword ?? ""} maxLength={80} readOnly={locked} placeholder="ex. parquet Bouloc"
            onChange={(e) => {
              const { focusKeyword: _old, ...rest } = seo;
              setDraft({ ...draft, seo: e.target.value ? { ...rest, focusKeyword: e.target.value } : rest });
            }} className={inputCls} />
          <p className="mt-1.5 text-[12px] text-muted-foreground">Ce que vos clients tapent dans Google pour trouver cette page : le métier et la ville. Une expression différente par page.</p>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between"><label htmlFor="seo-title" className="text-[13px] font-medium">Titre dans Google <span className="text-accent">★</span></label><span className={`text-[12px] ${seo.title.length > 60 ? "text-accent" : "text-muted-foreground"}`}>{seo.title.length} / 60 conseillés</span></div>
          <input id="seo-title" value={seo.title} maxLength={70} readOnly={locked} onChange={(e) => set({ title: e.target.value })} className={inputCls} />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between"><label htmlFor="seo-desc" className="text-[13px] font-medium">Description dans Google <span className="text-accent">★</span></label><span className={`text-[12px] ${seo.description.length > 160 ? "text-accent" : "text-muted-foreground"}`}>{seo.description.length} / 160 conseillés</span></div>
          <textarea id="seo-desc" rows={4} value={seo.description} maxLength={200} readOnly={locked} onChange={(e) => set({ description: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label htmlFor="seo-image" className="mb-1.5 block text-[13px] font-medium">Image de partage (Facebook, WhatsApp…) — facultatif</label>
          <input id="seo-image" value={seo.image ?? ""} readOnly={locked} placeholder="/images/…" onChange={(e) => {
            const { image: _old, ...rest } = seo;
            setDraft({ ...draft, seo: e.target.value ? { ...rest, image: e.target.value } : rest });
          }} className={inputCls} />
        </div>
      </div>
      <div className="space-y-5">
        <div className="rounded-xl border border-line p-4">
          <p className="mb-2 text-[12px] uppercase tracking-[0.08em] text-muted-foreground">Aperçu dans Google</p>
          <p className="text-[13px] text-ink-soft">{host} › {path.split("/").filter(Boolean).join(" › ")}</p>
          <p className="mt-1 text-[19px] leading-snug text-[#1A0DAB]">{seo.title}</p>
          <p className="mt-1 text-[14px] text-[#4D5156]">{seo.description.length > 160 ? `${seo.description.slice(0, 157)}…` : seo.description}</p>
        </div>
        <ReadOnly label="Adresse de la page (URL)" value={path} hint={isSuper ? "Modifiable avec le déplacement de pages (redirection automatique)." : "Verrouillée par sécurité : la modifier casserait les liens et le référencement."} />
        <ReadOnly label="Données structurées (Google)" value={seo.jsonLd?.length ? `${seo.jsonLd.length} élément(s), générés à partir de la page` : "Générées automatiquement"} />
        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">{!isSuper ? <Lock className="size-3" aria-hidden="true" /> : null}Indexation par Google</span>
          <label className="flex min-h-11 items-center gap-2.5 text-[14px]">
            <input type="checkbox" checked={!seo.noindex} disabled={!isSuper || locked} onChange={(e) => {
              const { noindex: _old, ...rest } = seo;
              setDraft({ ...draft, seo: e.target.checked ? rest : { ...rest, noindex: true } });
            }} className="size-4" />
            Autoriser Google à afficher cette page
          </label>
          {!isSuper ? <p className="text-[12px] text-muted-foreground">Verrouillé par sécurité : une erreur ici retirerait la page de Google.</p> : null}
        </div>
      </div>
    </div>
  );
}

function ScorePanel({ score }: { score: ReturnType<typeof seoScore> }) {
  const color = score.score >= 80 ? "text-emerald-700" : score.score >= 50 ? "text-amber-700" : "text-rose-700";
  const bar = score.score >= 80 ? "bg-emerald-600" : score.score >= 50 ? "bg-amber-500" : "bg-rose-600";
  return (
    <section className="rounded-xl border border-line p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-medium">Score SEO de la page</h3>
        <span className={`font-display text-4xl ${color}`}>{score.score}<span className="text-lg text-muted-foreground">/100</span></span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={score.score} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${bar}`} style={{ width: `${score.score}%` }} />
      </div>
      <ul className="mt-4 space-y-2.5">
        {score.checks.map((c) => (
          <li key={c.id} className="flex gap-2.5 text-[14px]">
            <span aria-hidden="true" className={c.ok ? "text-emerald-600" : c.points > 0 ? "text-amber-600" : "text-rose-600"}>{c.ok ? "✓" : c.points > 0 ? "◐" : "✗"}</span>
            <span className="flex-1">
              <span className="font-medium">{c.label}</span> <span className="text-muted-foreground">({c.points}/{c.max})</span>
              <span className="block text-[13px] text-muted-foreground">{c.advice}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] text-muted-foreground">Le score évalue ce qui dépend de la page. Le classement dans Google dépend aussi de la concurrence, des avis et de l'ancienneté du site.</p>
    </section>
  );
}

function OutlinePanel({ blocks }: { blocks: BlockInstance[] }) {
  const outline = outlineOf(blocks);
  const h1 = outline.filter((h) => h.level === "h1").length;
  return (
    <section className="rounded-xl border border-line p-5">
      <h3 className="text-[15px] font-medium">Plan de la page, tel que Google le lit</h3>
      {h1 !== 1 ? <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-800">{h1 === 0 ? "Aucun titre H1 : ajoutez un bloc « Haut de page »." : `${h1} titres H1 : une page ne doit en avoir qu'un.`}</p> : null}
      <ol className="mt-3 space-y-1.5">
        {outline.map((h, i) => (
          <li key={i} className="flex items-start gap-2 text-[14px]" style={{ paddingLeft: h.level === "h1" ? 0 : h.level === "h2" ? 16 : 32 }}>
            <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${h.level === "h1" ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"}`}>{h.level}</span>
            <span className={h.text ? "" : "italic text-rose-700"}>{h.text || "titre vide"}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[12px] text-muted-foreground">Les niveaux de titres sont fixés par chaque bloc pour garantir une structure correcte. Les listes automatiques (réalisations, communes, avis) ajoutent leurs propres titres H3.</p>
    </section>
  );
}
