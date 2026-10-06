import { getAllPages } from "@/cms/pages";
import type { Page } from "@/cms/types";
import { site } from "@/data/site";
import { realisations } from "@/data/realisations";
import { absoluteUrl, buildSeoHead, localBusinessSchema, BUSINESS_ID, SITE_URL } from "@/lib/seo";

/** Remplace {{site}} par le domaine courant dans les données structurées enregistrées. */
function withSite<T>(value: T): T {
  const realisationList = realisations.map((r, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: r.title,
    url: absoluteUrl(`/realisations/${r.slug}`),
  }));
  return JSON.parse(
    JSON.stringify(value)
      .replaceAll('"{{realisations}}"', JSON.stringify(realisationList))
      .replaceAll("{{site}}", SITE_URL),
  ) as T;
}

/** Fil d'Ariane de Google : Accueil, puis chaque page parente, puis la page. */
function breadcrumb(page: Page) {
  const byId = new Map(getAllPages().map((p) => [p.id, p]));
  const chain: Page[] = [];
  for (let current: Page | undefined = page; current && chain.length < 10; current = current.parentId ? byId.get(current.parentId) : undefined) {
    chain.unshift(current);
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      ...chain.map((p, i) => ({ "@type": "ListItem", position: i + 2, name: p.label, item: absoluteUrl(p.path) })),
    ],
  };
}

/** Balises <head> d'une page du CMS : titre, description, partage, données structurées. */
export function buildPageHead(page: Page) {
  const isHome = page.template === "home";
  const stored = withSite(page.seo.jsonLd ?? []);
  const schema = isHome
    ? [
        localBusinessSchema,
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          url: SITE_URL,
          inLanguage: "fr-FR",
          publisher: { "@id": BUSINESS_ID },
        },
        ...stored,
      ]
    : [...stored, breadcrumb(page)];

  const head = buildSeoHead({
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
  meta: [{ title: `Page introuvable — ${site.name}` }, { name: "robots", content: "noindex" }],
};
