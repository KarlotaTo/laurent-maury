import type { BlockInstance } from "@/cms/types";

/**
 * Niveaux de titres produits par chaque bloc sur le site (fixés par le design,
 * pour garantir une hiérarchie correcte). Chemin du champ → niveau.
 * « items.*.title » = le champ title de chaque élément de la liste items.
 */
export const HEADINGS: Record<string, Record<string, "h1" | "h2" | "h3">> = {
  hero: { title: "h1" },
  heroHome: { title: "h1" },
  heroSplit: { title: "h1" },
  zoneHero: { title: "h1" },
  projectHero: { title: "h1" },
  textTitle: { title: "h2" },
  feature: { title: "h2" },
  prestations: { title: "h2", "items.*.title": "h3" },
  engagements: { title: "h2", "items.*.title": "h3" },
  steps: { title: "h2" },
  serviceCards: { title: "h2", "items.*.label": "h3" },
  realisationsList: { title: "h2" },
  reviews: { title: "h2" },
  communesSummary: { title: "h2" },
  communesGrid: { title: "h2" },
  contactCta: { title: "h2" },
  localIntro: { title: "h2", "projects.*.title": "h3" },
  linkedServices: { title: "h2", "items.*.label": "h3" },
  showcase: { title: "h2" },
  stepsBand: { title: "h2", "items.*.title": "h3" },
  sharedEngagements: { title: "h2" },
  neighbours: { title: "h2" },
  legalText: { "sections.*.title": "h2" },
  faq: { title: "h2" },
  textMedia: { title: "h2" },
  beforeAfterWide: { title: "h2" },
  zonesLinks: { title: "h2" },
  realisationsDetailed: { title: "h2" },
  projectStory: { title: "h2" },
  projectGallery: { title: "h2" },
  projectCta: { title: "h2" },
};

/** Niveau de titre d'un champ (chemin avec indices, ex. "items.2.title"), s'il en produit un. */
export function headingOf(blockType: string, path: string): "h1" | "h2" | "h3" | undefined {
  const pattern = path.replace(/\.\d+(?=\.|$)/g, ".*");
  return HEADINGS[blockType]?.[pattern];
}

export type OutlineEntry = { level: "h1" | "h2" | "h3"; text: string; blockId: string };

const clean = (text: string) => text.replace(/\*\*|\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();

/** Plan de la page tel que Google le lit : titres H1, H2, H3 dans l'ordre d'affichage. */
export function outlineOf(blocks: BlockInstance[]): OutlineEntry[] {
  const out: OutlineEntry[] = [];
  for (const block of blocks) {
    if (block.hidden) continue;
    const map = HEADINGS[block.type];
    if (!map) continue;
    const data = (block.data ?? {}) as Record<string, unknown>;
    for (const [path, level] of Object.entries(map)) {
      const [listKey, , field] = path.split(".");
      if (path.includes("*")) {
        const items = Array.isArray(data[listKey!]) ? (data[listKey!] as Record<string, unknown>[]) : [];
        for (const item of items) {
          const text = typeof item?.[field!] === "string" ? clean(String(item[field!])) : "";
          out.push({ level, text, blockId: block.id });
        }
      } else {
        const value = data[path];
        let text = typeof value === "string" ? clean(value) : "";
        // Le début de titre invisible fait partie du H1 lu par Google.
        if (level === "h1" && typeof data["titleSeoPrefix"] === "string" && data["titleSeoPrefix"]) {
          text = `${clean(String(data["titleSeoPrefix"]))} : ${text}`;
        }
        out.push({ level, text, blockId: block.id });
      }
    }
  }
  // Les H2/H3 des sections se suivent dans l'ordre des blocs ; le titre d'une section précède ses éléments.
  return out;
}
