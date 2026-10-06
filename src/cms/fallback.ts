import { pageSchema, type Page } from "@/cms/types";
import type { SiteData } from "@/cms/site-data";
import general from "@/content/general.json";
import avisContent from "@/content/avis.json";
import engagementsContent from "@/content/engagements.json";
import technique from "@/content/technique.json";

/**
 * Filet de sécurité : contenus livrés avec le site, utilisés si la base ne répond pas.
 * Ils correspondent à l'état du site au moment de la dernière mise en ligne du code.
 */
const files = import.meta.glob("../content/cms/pages/*.json", { eager: true, import: "default" });

export function validPages(raws: Iterable<[string, unknown]>): Page[] {
  const pages: Page[] = [];
  for (const [origin, raw] of raws) {
    const parsed = pageSchema.safeParse(raw);
    if (parsed.success) pages.push(parsed.data);
    else console.warn(`[cms] page ignorée (${origin}) : ${parsed.error.issues[0]?.message}`);
  }
  return pages.sort((a, b) => a.order - b.order);
}

export const fallbackData: SiteData = {
  pages: validPages(Object.entries(files)),
  general,
  avis: avisContent.avis,
  engagements: engagementsContent.engagements,
  technique,
  source: "secours",
};
