import { z } from "zod";

/**
 * Champs du CMS : chaque constructeur renvoie un schéma zod (validation) et
 * enregistre les informations dont le back-office a besoin pour afficher le
 * formulaire (libellé, aide, limite, verrou).
 */

export type FieldKind =
  | "string"
  | "text"
  | "rich"
  | "image"
  | "link"
  | "number"
  | "boolean"
  | "select"
  | "list"
  | "object";

export type FieldMeta = {
  kind: FieldKind;
  label: string;
  help?: string | undefined;
  max?: number | undefined;
  min?: number | undefined;
  /** Visible mais non modifiable pour les rôles autres que Super-admin. */
  locked?: boolean | undefined;
  options?: readonly { value: string | undefined; label: string }[];
  /** Pour les listes : libellé d'un élément (« Prestation », « Photo »…). */
  itemLabel?: string | undefined;
};

const registry = new WeakMap<z.ZodTypeAny, FieldMeta>();

export function fieldMeta(schema: z.ZodTypeAny): FieldMeta | undefined {
  let current: z.ZodTypeAny | undefined = schema;
  while (current) {
    const meta = registry.get(current);
    if (meta) return meta;
    const def = current._def as { innerType?: z.ZodTypeAny; schema?: z.ZodTypeAny };
    current = def.innerType ?? def.schema;
  }
  return undefined;
}

function tag<T extends z.ZodTypeAny>(schema: T, meta: FieldMeta): T {
  registry.set(schema, meta);
  return schema;
}

type Common = { label: string; help?: string; locked?: boolean };

/** Texte court sur une ligne. */
export function string(o: Common & { max: number; optional: true }): z.ZodOptional<z.ZodString>;
export function string(o: Common & { max: number; optional?: false }): z.ZodString;
export function string(o: Common & { max: number; optional?: boolean }): z.ZodTypeAny {
  const base = z.string().trim().max(o.max, `${o.max} caractères maximum`);
  const schema = o.optional ? base.optional() : base.min(1, "Champ obligatoire");
  return tag(schema, { kind: "string", label: o.label, help: o.help, max: o.max, locked: o.locked });
}

/** Paragraphe sans mise en forme. */
export function text(o: Common & { max: number; optional: true }): z.ZodOptional<z.ZodString>;
export function text(o: Common & { max: number; optional?: false }): z.ZodString;
export function text(o: Common & { max: number; optional?: boolean }): z.ZodTypeAny {
  const base = z.string().trim().max(o.max, `${o.max} caractères maximum`);
  const schema = o.optional ? base.optional() : base.min(1, "Champ obligatoire");
  return tag(schema, { kind: "text", label: o.label, help: o.help, max: o.max, locked: o.locked });
}

/** Paragraphe avec **gras**, *italique* et retours à la ligne. */
export function rich(o: Common & { max: number; optional: true }): z.ZodOptional<z.ZodString>;
export function rich(o: Common & { max: number; optional?: false }): z.ZodString;
export function rich(o: Common & { max: number; optional?: boolean }): z.ZodTypeAny {
  const base = z.string().trim().max(o.max, `${o.max} caractères maximum`);
  const schema = o.optional ? base.optional() : base.min(1, "Champ obligatoire");
  return tag(schema, {
    kind: "rich",
    label: o.label,
    help: o.help ?? "**gras**, *italique*, retour à la ligne",
    max: o.max,
    locked: o.locked,
  });
}

const imagePath = z
  .string()
  .min(1, "Photo obligatoire")
  .refine((v) => v.startsWith("/") || v.startsWith("https://"), "Adresse d'image invalide");

/** Photo et sa description (obligatoire pour Google et l'accessibilité). */
export function image(o: Common) {
  const schema = z.object({
    src: imagePath,
    alt: z.string().trim().min(1, "Description de la photo obligatoire").max(160),
  });
  return tag(schema, { kind: "image", label: o.label, help: o.help, locked: o.locked });
}

/** Lien vers une page du site (adresse commençant par /) ou vers le téléphone. */
export function link(o: Common & { optional: true }): z.ZodOptional<z.ZodEffects<z.ZodString>>;
export function link(o: Common & { optional?: false }): z.ZodEffects<z.ZodEffects<z.ZodString>>;
export function link(o: Common & { optional?: boolean }): z.ZodTypeAny {
  const base = z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("/") || v === "tel", "Choisissez une page du site");
  const schema = o.optional ? base.optional() : base.refine((v) => v !== "", "Lien obligatoire");
  return tag(schema, { kind: "link", label: o.label, help: o.help, locked: o.locked });
}

export function boolean(o: Common) {
  return tag(z.boolean(), { kind: "boolean", label: o.label, help: o.help, locked: o.locked });
}

export function number(o: Common & { min: number; max: number }) {
  return tag(z.number().int().min(o.min).max(o.max), {
    kind: "number",
    label: o.label,
    help: o.help,
    min: o.min,
    max: o.max,
    locked: o.locked,
  });
}

export function select<const V extends readonly [string, ...string[]]>(
  o: Common & { options: { [K in keyof V]: { value: V[K]; label: string } } },
) {
  const values = o.options.map((opt) => opt.value) as unknown as V;
  return tag(z.enum(values), {
    kind: "select",
    label: o.label,
    help: o.help,
    options: o.options,
    locked: o.locked,
  });
}

/** Liste d'éléments avec un nombre minimum et maximum. */
export function list<T extends z.ZodTypeAny>(
  item: T,
  o: Common & { min: number; max: number; itemLabel: string },
) {
  const schema = z
    .array(item)
    .min(o.min, `${o.min} élément(s) minimum`)
    .max(o.max, `${o.max} éléments maximum`);
  return tag(schema, {
    kind: "list",
    label: o.label,
    help: o.help,
    min: o.min,
    max: o.max,
    itemLabel: o.itemLabel,
    locked: o.locked,
  });
}

export function object<T extends z.ZodRawShape>(shape: T, o: Common) {
  return tag(z.object(shape), { kind: "object", label: o.label, help: o.help, locked: o.locked });
}
