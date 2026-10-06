import { createServerFn } from "@tanstack/react-start";
import { ancestorsOf, contextOf } from "@/cms/site-data";
import { loadSiteData } from "@/cms/source";
import type { BlockInstance, Page } from "@/cms/types";

/** Page telle qu'envoyée au navigateur (les données des blocs sont validées au rendu). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
export type WirePage = Omit<Page, "blocks" | "meta" | "seo"> & {
  blocks: (Omit<BlockInstance, "data"> & { data: Json })[];
  meta?: Record<string, Json>;
  seo: Omit<Page["seo"], "jsonLd"> & { jsonLd?: Record<string, Json>[] };
};

/** Contexte du site (coordonnées, communes, réalisations…) pour l'en-tête, le pied de page et les blocs. */
export const getSiteContext = createServerFn({ method: "GET" }).handler(async () => contextOf(await loadSiteData()));

/** Une page publiée, son fil d'Ariane et le contexte du site ; null si l'adresse n'existe pas. */
export const getPublishedPage = createServerFn({ method: "GET" })
  .validator((path: string) => path)
  .handler(async ({ data: path }) => {
    const site = await loadSiteData();
    const page = site.pages.find((p) => p.path === path && p.status === "published");
    if (!page) return null;
    return { page: page as WirePage, breadcrumb: ancestorsOf(page, site.pages), ctx: contextOf(site), source: site.source };
  });
