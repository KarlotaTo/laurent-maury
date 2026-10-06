import { z } from "zod";
import { changedLockedFields } from "@/cms/locks";
import { blockRegistry } from "@/cms/registry";
import { checkBlock } from "@/cms/render";
import { TEMPLATE_META } from "@/cms/templates";
import { blockInstanceSchema, pageSchema } from "@/cms/types";

export type Role = "super" | "admin" | "editor" | "contributor";

export const draftSchema = z.object({
  seo: pageSchema.shape.seo,
  blocks: z.array(blockInstanceSchema).max(60, "60 blocs maximum par page"),
  meta: z.record(z.unknown()).default({}),
});
export type Draft = z.infer<typeof draftSchema>;

/** Problèmes empêchant l'enregistrement ou la publication, en français. */
export function validateDraft(template: string, draft: Draft, previous: Draft, role: Role): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  draft.blocks.forEach((block, index) => {
    const label = `Bloc ${index + 1}`;
    if (ids.has(block.id)) problems.push(`${label} : identifiant en double.`);
    ids.add(block.id);
    const checked = checkBlock(block);
    if (!checked.ok) {
      problems.push(`${label} (${blockRegistry[block.type]?.label ?? block.type}) : ${checked.reason}`);
      return;
    }
    if (role !== "super") {
      const def = blockRegistry[block.type]!;
      const before = previous.blocks.find((b) => b.id === block.id && b.type === block.type)?.data ?? def.example;
      const changed = changedLockedFields(def.schema, before, block.data);
      if (changed.length) problems.push(`${label} (${def.label}) : champ verrouillé modifié (${changed.join(", ")}).`);
    }
  });
  if (role !== "super") {
    if (JSON.stringify(draft.seo.jsonLd ?? null) !== JSON.stringify(previous.seo.jsonLd ?? null)) problems.push("Données structurées : champ verrouillé.");
    if ((draft.seo.noindex ?? false) !== (previous.seo.noindex ?? false)) problems.push("Indexation : champ verrouillé.");
  }
  const metaSchema = TEMPLATE_META[template];
  if (metaSchema) {
    const meta = metaSchema.safeParse(draft.meta);
    if (!meta.success) problems.push(`Informations de la page : ${meta.error.issues[0]?.path.join(".")} : ${meta.error.issues[0]?.message}`);
    else if (role !== "super") {
      const changed = changedLockedFields(metaSchema, previous.meta ?? {}, draft.meta);
      if (changed.length) problems.push(`Informations de la page : champ verrouillé modifié (${changed.join(", ")}).`);
    }
  } else if (role !== "super" && JSON.stringify(draft.meta) !== JSON.stringify(previous.meta ?? {})) {
    problems.push("Informations de la page : champ verrouillé.");
  }
  return problems;
}

