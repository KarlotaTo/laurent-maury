import { pageSchema, type Page } from "@/cms/types";

/**
 * Source des pages. Aujourd'hui : fichiers JSON livrés avec le site.
 * Demain : base de données, avec ces fichiers comme filet de sécurité
 * si la base ne répond pas.
 */
const files = import.meta.glob("../content/cms/pages/*.json", { eager: true, import: "default" });

function loadPages(): Page[] {
  const pages: Page[] = [];
  for (const [file, raw] of Object.entries(files)) {
    const parsed = pageSchema.safeParse(raw);
    if (parsed.success) pages.push(parsed.data);
    else console.warn(`[cms] page ignorée (${file}) : ${parsed.error.issues[0]?.message}`);
  }
  return pages.sort((a, b) => a.order - b.order);
}

const pages = loadPages();

export function getAllPages(): Page[] {
  return pages;
}

export function getPublishedPage(path: string): Page | undefined {
  return pages.find((p) => p.path === path && p.status === "published");
}
