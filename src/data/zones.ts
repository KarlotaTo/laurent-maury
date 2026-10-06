/**
 * Communes desservies : lues depuis les pages du modèle « ville » du CMS.
 * Une page ville publiée apparaît automatiquement dans le pied de page,
 * le formulaire de contact, la carte, les listes de communes et le plan du site.
 * Règle éditoriale : ne jamais présenter une réalisation d'une autre commune comme locale.
 */
import { getAllPages } from "@/cms/pages";

export type Zone = {
  order: number;
  /** Siège de l'entreprise */
  main: boolean;
  slug: string;
  name: string;
  /** Titre principal de la page ville */
  h1: string;
  /** Texte court affiché sur la page « Zones d'intervention » */
  hubText: string;
};

export const zones: Zone[] = getAllPages()
  .filter((page) => page.template === "ville" && page.status === "published")
  .map((page) => {
    const meta = (page.meta ?? {}) as { name?: string; hubText?: string; main?: boolean };
    const hero = page.blocks.find((b) => b.type === "zoneHero")?.data as { title?: string } | undefined;
    return {
      order: page.order,
      main: meta.main === true,
      slug: page.path.split("/").pop() ?? "",
      name: meta.name ?? page.label,
      h1: hero?.title ?? page.label,
      hubText: meta.hubText ?? "",
    };
  })
  .sort((a, b) => a.order - b.order);

export const getZone = (slug: string) => zones.find((z) => z.slug === slug);
