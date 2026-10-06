import type { Page } from "@/cms/types";
import { site } from "@/data/site";
import { buildSeoHead, localBusinessSchema, BUSINESS_ID, SITE_URL } from "@/lib/seo";

/** Remplace {{site}} par le domaine courant dans les données structurées enregistrées. */
function withSite<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replaceAll("{{site}}", SITE_URL)) as T;
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
    : stored;

  const head = buildSeoHead({
    title: page.seo.title,
    description: page.seo.description,
    path: page.path,
    schema,
    ...(page.seo.ogType ? { ogType: page.seo.ogType } : {}),
    ...(isHome ? {} : { breadcrumbLabel: page.label }),
  });
  if (page.seo.noindex) {
    head.meta = head.meta.map((m) => ("name" in m && m.name === "robots" ? { name: "robots", content: "noindex, follow" } : m));
  }
  return head;
}

export const notFoundHead = {
  meta: [{ title: `Page introuvable — ${site.name}` }, { name: "robots", content: "noindex" }],
};
