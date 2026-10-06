import type { SiteContext } from "@/cms/site-data";
import type { Page } from "@/cms/types";
import { absoluteUrl, buildSeoHead, businessId, localBusinessSchema } from "@/lib/seo";

/**
 * Données structurées enregistrées avec la page : {{site}} devient le domaine courant,
 * "{{realisations}}" la liste à jour des réalisations publiées.
 */
function resolveJsonLd(page: Page, ctx: SiteContext) {
  const realisationList = ctx.realisations.map((r, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: r.title,
    url: absoluteUrl(ctx, `/realisations/${r.slug}`),
  }));
  return JSON.parse(
    JSON.stringify(page.seo.jsonLd ?? [])
      .replaceAll('"{{realisations}}"', JSON.stringify(realisationList))
      .replaceAll("{{site}}", ctx.siteUrl),
  ) as Record<string, unknown>[];
}

/** Fil d'Ariane de Google : Accueil, puis chaque page parente, puis la page. */
function breadcrumbSchema(ctx: SiteContext, chain: { label: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: ctx.siteUrl },
      ...chain.map((p, i) => ({ "@type": "ListItem", position: i + 2, name: p.label, item: absoluteUrl(ctx, p.path) })),
    ],
  };
}

/** Balises <head> d'une page du CMS : titre, description, partage, données structurées. */
export function buildPageHead(page: Page, ctx: SiteContext, breadcrumb: { label: string; path: string }[]) {
  const isHome = page.template === "home";
  const stored = resolveJsonLd(page, ctx);
  const schema = isHome
    ? [
        localBusinessSchema(ctx),
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: ctx.general.name,
          url: ctx.siteUrl,
          inLanguage: "fr-FR",
          publisher: { "@id": businessId(ctx) },
        },
        ...stored,
      ]
    : [...stored, breadcrumbSchema(ctx, breadcrumb)];

  const head = buildSeoHead({
    ctx,
    title: page.seo.title,
    description: page.seo.description,
    path: page.path,
    schema,
    ...(page.seo.ogType ? { ogType: page.seo.ogType } : {}),
  });
  if (page.seo.noindex) {
    head.meta = head.meta.map((m) => ("name" in m && m.name === "robots" ? { name: "robots", content: "noindex, follow" } : m));
  }
  return head;
}

export const notFoundHead = {
  meta: [{ title: "Page introuvable" }, { name: "robots", content: "noindex" }],
};
