import type { ReactNode } from "react";
import { z } from "zod";
import type { SiteContext } from "@/cms/site-data";

export type Background = "light" | "sand" | "dark";

/** Définition d'un bloc : son schéma (champs et limites) et son rendu, repris du design du site. */
export type BlockDef<S extends z.ZodTypeAny = z.ZodTypeAny> = {
  type: string;
  label: string;
  description: string;
  schema: S;
  /** Fonds autorisés, dans l'ordre de préférence (le premier est celui par défaut). */
  backgrounds: readonly Background[];
  /** Contenu d'exemple : sert aux nouveaux blocs et aux tests. */
  example: z.infer<S>;
  render: (props: { data: z.infer<S>; background: Background; ctx: SiteContext }) => ReactNode;
};

export function defineBlock<S extends z.ZodTypeAny>(def: BlockDef<S>): BlockDef<S> {
  return def;
}

export const blockInstanceSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  hidden: z.boolean().optional(),
  background: z.enum(["light", "sand", "dark"]).optional(),
  data: z.unknown(),
});
export type BlockInstance = z.infer<typeof blockInstanceSchema>;

export const pageSchema = z.object({
  id: z.string().min(1),
  /** Adresse publique : "/" ou "/parent/enfant" en minuscules sans accents. */
  path: z.string().regex(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/, "Adresse invalide"),
  parentId: z.string().nullable(),
  template: z.string().min(1),
  status: z.enum(["draft", "published"]),
  order: z.number().int(),
  /** Nom court : menu, fil d'Ariane, arborescence du back-office. */
  label: z.string().min(1).max(60),
  inMenu: z.boolean(),
  /** Données propres au modèle (ex. page ville : nom de la commune, texte court, siège). */
  meta: z.record(z.unknown()).optional(),
  seo: z.object({
    title: z.string().min(1).max(70),
    description: z.string().min(1).max(200),
    image: z.string().optional(),
    ogType: z.enum(["website", "article"]).optional(),
    /** Données structurées propres à la page (réservé Super-admin). */
    jsonLd: z.array(z.record(z.unknown())).optional(),
    noindex: z.boolean().optional(),
  }),
  blocks: z.array(blockInstanceSchema),
});
export type Page = z.infer<typeof pageSchema>;
