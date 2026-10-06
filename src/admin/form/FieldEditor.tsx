import { ArrowDown, ArrowUp, Lock, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { fieldMeta, type FieldMeta } from "@/cms/fields";
import { inputCls } from "@/admin/ui";

/**
 * Formulaire généré à partir du schéma d'un bloc : chaque type de champ
 * (texte, paragraphe, photo, lien, liste…) a son contrôle, ses limites et son verrou.
 */

export type FormEnv = {
  /** La super-admin peut modifier les champs verrouillés. */
  canUnlock: boolean;
  /** Erreurs de validation, par chemin (ex. "items.0.title"). */
  errors: Map<string, string>;
  /** Pages du site, pour les liens. */
  pages: { path: string; label: string }[];
  /** Photos déjà utilisées sur le site, proposées dans les champs photo. */
  images: string[];
};

export function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  for (let i = 0; i < 10; i++) {
    const def = current._def as { innerType?: z.ZodTypeAny; schema?: z.ZodTypeAny };
    const next = def.innerType ?? def.schema;
    if (!next) break;
    current = next;
  }
  return current;
}

const isOptional = (schema: z.ZodTypeAny) => schema.isOptional();

/** Valeur par défaut d'un champ vide (nouvel élément de liste, champ facultatif ajouté). */
export function defaultFor(schema: z.ZodTypeAny): unknown {
  const meta = fieldMeta(schema);
  const inner = unwrap(schema);
  if (meta?.kind === "image") return { src: "", alt: "" };
  if (meta?.kind === "boolean") return false;
  if (meta?.kind === "number") return meta.min ?? 0;
  if (meta?.kind === "select") return meta.options?.[0]?.value ?? "";
  if (inner instanceof z.ZodArray) {
    const min = meta?.min ?? 0;
    return Array.from({ length: min }, () => defaultFor(inner.element as z.ZodTypeAny));
  }
  if (inner instanceof z.ZodObject) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(inner.shape as Record<string, z.ZodTypeAny>)) {
      if (!isOptional(child)) out[key] = defaultFor(child);
    }
    return out;
  }
  return "";
}

function humanize(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function LockNote() {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <Lock className="size-3" aria-hidden="true" /> Verrouillé par sécurité : modification réservée à l'administratrice du site.
    </p>
  );
}

function ErrorText({ message }: { message?: string | undefined }) {
  return message ? <p className="mt-1.5 text-[13px] text-accent">{message}</p> : null;
}

function Counter({ value, max }: { value: string; max?: number | undefined }) {
  if (!max) return null;
  const n = value.length;
  return <span className={`text-[12px] ${n > max ? "text-accent" : "text-muted-foreground"}`}>{n} / {max}</span>;
}

type Props = {
  schema: z.ZodTypeAny;
  value: unknown;
  onChange: (value: unknown) => void;
  path: string;
  env: FormEnv;
  /** Libellé à utiliser si le schéma n'en déclare pas (clé de l'objet parent). */
  fallbackLabel?: string;
  /** Champ verrouillé par un parent (liste verrouillée…). */
  inheritedLock?: boolean;
};

export function FieldEditor({ schema, value, onChange, path, env, fallbackLabel, inheritedLock }: Props) {
  const meta: FieldMeta | undefined = fieldMeta(schema);
  const inner = unwrap(schema);
  const locked = (meta?.locked || inheritedLock) && !env.canUnlock;
  const label = meta?.label ?? (fallbackLabel ? humanize(fallbackLabel) : "");
  const id = `f-${path.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const error = env.errors.get(path);

  // Champ facultatif absent : bouton pour l'ajouter.
  if (value === undefined && isOptional(schema) && meta?.kind !== "string" && meta?.kind !== "text" && meta?.kind !== "rich" && meta?.kind !== "link") {
    if (locked) return null;
    return (
      <button type="button" onClick={() => onChange(defaultFor(schema))} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-[13px] text-ink-soft hover:bg-sand">
        <Plus className="size-3.5" aria-hidden="true" /> Ajouter : {label || "élément"}
      </button>
    );
  }

  switch (meta?.kind) {
    case "string":
    case "text":
    case "rich": {
      const v = typeof value === "string" ? value : "";
      const multiline = meta.kind !== "string";
      return (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor={id} className="text-[13px] font-medium text-ink">{label}</label>
            <Counter value={v} max={meta.max} />
          </div>
          {multiline ? (
            <textarea id={id} value={v} readOnly={locked} rows={meta.kind === "rich" ? 4 : 3} onChange={(e) => onChange(e.target.value)} className={inputCls} />
          ) : (
            <input id={id} value={v} readOnly={locked} onChange={(e) => onChange(e.target.value)} className={inputCls} />
          )}
          {meta.help && !locked ? <p className="mt-1.5 text-[12px] text-muted-foreground">{meta.help}</p> : null}
          {locked ? <LockNote /> : null}
          <ErrorText message={error} />
        </div>
      );
    }
    case "number":
      return (
        <div>
          <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>
          <input id={id} type="number" min={meta.min} max={meta.max} value={typeof value === "number" ? value : ""} readOnly={locked}
            onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} className={`${inputCls} max-w-40`} />
          {locked ? <LockNote /> : null}
          <ErrorText message={error} />
        </div>
      );
    case "boolean":
      return (
        <div>
          <label className="flex min-h-11 items-center gap-2.5 text-[14px]">
            <input type="checkbox" checked={value === true} disabled={locked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            {label}
          </label>
          {locked ? <LockNote /> : null}
        </div>
      );
    case "select":
      return (
        <div>
          <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>
          <select id={id} value={String(value ?? "")} disabled={locked} onChange={(e) => onChange(e.target.value)} className={`${inputCls} max-w-xs`}>
            {meta.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {locked ? <LockNote /> : null}
          <ErrorText message={error} />
        </div>
      );
    case "link": {
      const v = typeof value === "string" ? value : "";
      const known = env.pages.some((p) => p.path === v);
      return (
        <div>
          <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>
          <select id={id} value={v} disabled={locked} onChange={(e) => onChange(isOptional(schema) && e.target.value === "" ? undefined : e.target.value)} className={inputCls}>
            <option value="">— Choisir une page —</option>
            {!known && v ? <option value={v}>{v}</option> : null}
            {env.pages.map((p) => <option key={p.path} value={p.path}>{p.label} ({p.path})</option>)}
          </select>
          {locked ? <LockNote /> : null}
          <ErrorText message={error} />
        </div>
      );
    }
    case "image":
      return <ImageField id={id} label={label} value={value} onChange={onChange} locked={!!locked} env={env} path={path} optional={isOptional(schema)} />;
    case "list":
      return <ListField schema={inner as z.ZodArray<z.ZodTypeAny>} meta={meta} value={value} onChange={onChange} path={path} env={env} locked={!!locked} label={label} />;
    default:
      break;
  }

  if (inner instanceof z.ZodObject) {
    const obj = (value ?? {}) as Record<string, unknown>;
    return (
      <fieldset className={label ? "rounded-xl border border-line p-4" : ""}>
        {label ? (
          <legend className="flex items-center gap-2 px-1 text-[13px] font-medium text-ink">
            {label}
            {isOptional(schema) && !locked ? (
              <button type="button" onClick={() => onChange(undefined)} className="text-[12px] font-normal text-accent hover:underline">Retirer</button>
            ) : null}
          </legend>
        ) : null}
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {Object.entries(inner.shape as Record<string, z.ZodTypeAny>).map(([key, child]) => {
            const kind = fieldMeta(child)?.kind;
            const wide = kind === "text" || kind === "rich" || kind === "list" || unwrap(child) instanceof z.ZodObject;
            return (
              <div key={key} className={wide ? "[grid-column:1/-1]" : ""}>
                <FieldEditor schema={child} value={obj[key]} path={path ? `${path}.${key}` : key} env={env} fallbackLabel={key} inheritedLock={!!locked}
                  onChange={(v) => {
                    const next = { ...obj };
                    if (v === undefined) delete next[key];
                    else next[key] = v;
                    onChange(next);
                  }} />
              </div>
            );
          })}
        </div>
        <ErrorText message={error} />
      </fieldset>
    );
  }
  return <p className="text-[13px] text-muted-foreground">Champ non modifiable ici.</p>;
}

function ImageField({ id, label, value, onChange, locked, env, path, optional }: {
  id: string; label: string; value: unknown; onChange: (v: unknown) => void; locked: boolean; env: FormEnv; path: string; optional: boolean;
}) {
  const img = (value ?? { src: "", alt: "" }) as { src: string; alt: string };
  const listId = `${id}-photos`;
  return (
    <fieldset className="rounded-xl border border-line p-4">
      <legend className="flex items-center gap-2 px-1 text-[13px] font-medium text-ink">
        {label || "Photo"}
        {optional && !locked ? <button type="button" onClick={() => onChange(undefined)} className="text-[12px] font-normal text-accent hover:underline">Retirer</button> : null}
      </legend>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sand">
          {img.src ? <img src={img.src} alt="" className="h-full w-full object-cover" /> : <span className="text-[11px] text-muted-foreground">Aucune photo</span>}
        </div>
        <div className="min-w-[220px] flex-1 space-y-3">
          <div>
            <label htmlFor={`${id}-src`} className="mb-1.5 block text-[12px] text-muted-foreground">Photo (choisir dans la liste ; la médiathèque arrive bientôt)</label>
            <input id={`${id}-src`} list={listId} value={img.src} readOnly={locked} onChange={(e) => onChange({ ...img, src: e.target.value })} className={inputCls} />
            <datalist id={listId}>{env.images.map((src) => <option key={src} value={src} />)}</datalist>
            <ErrorText message={env.errors.get(`${path}.src`)} />
          </div>
          <div>
            <label htmlFor={`${id}-alt`} className="mb-1.5 block text-[12px] text-muted-foreground">Description de la photo (lue par Google et les personnes malvoyantes)</label>
            <input id={`${id}-alt`} value={img.alt} readOnly={locked} onChange={(e) => onChange({ ...img, alt: e.target.value })} className={inputCls} />
            <ErrorText message={env.errors.get(`${path}.alt`)} />
          </div>
        </div>
      </div>
      {locked ? <LockNote /> : null}
    </fieldset>
  );
}

function ListField({ schema, meta, value, onChange, path, env, locked, label }: {
  schema: z.ZodArray<z.ZodTypeAny>; meta: FieldMeta; value: unknown; onChange: (v: unknown) => void; path: string; env: FormEnv; locked: boolean; label: string;
}) {
  const items = Array.isArray(value) ? value : [];
  const element = schema.element as z.ZodTypeAny;
  const max = meta.max ?? 99;
  const min = meta.min ?? 0;
  const set = (next: unknown[]) => onChange(next);
  const move = (i: number, d: number) => {
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    set(next);
  };
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="text-[12px] text-muted-foreground">{items.length} / {max}</span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-line bg-[oklch(0.985_0.004_85)] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{meta.itemLabel ?? "Élément"} {i + 1}</span>
              {!locked ? (
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Monter" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-md p-1.5 hover:bg-sand disabled:opacity-30"><ArrowUp className="size-4" /></button>
                  <button type="button" aria-label="Descendre" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="rounded-md p-1.5 hover:bg-sand disabled:opacity-30"><ArrowDown className="size-4" /></button>
                  <button type="button" aria-label="Supprimer" disabled={items.length <= min} onClick={() => set(items.filter((_, j) => j !== i))} className="rounded-md p-1.5 text-accent hover:bg-accent/10 disabled:opacity-30"><Trash2 className="size-4" /></button>
                </div>
              ) : null}
            </div>
            <FieldEditor schema={element} value={item} path={`${path}.${i}`} env={env} inheritedLock={locked}
              {...(unwrap(element) instanceof z.ZodObject ? {} : { fallbackLabel: meta.itemLabel ?? "Élément" })}
              onChange={(v) => set(items.map((x, j) => (j === i ? v : x)))} />
          </div>
        ))}
      </div>
      {!locked && items.length < max ? (
        <button type="button" onClick={() => set([...items, defaultFor(element)])} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-[13px] text-ink-soft hover:bg-sand">
          <Plus className="size-3.5" aria-hidden="true" /> Ajouter : {meta.itemLabel?.toLowerCase() ?? "élément"}
        </button>
      ) : null}
      {locked ? <LockNote /> : null}
      <ErrorText message={env.errors.get(path)} />
    </div>
  );
}
