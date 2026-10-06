import type { SiteContext } from "@/cms/site-data";

/** Site de test : jamais indexé par les moteurs de recherche (compilé avec VITE_STAGING=1). */
export const IS_STAGING = import.meta.env["VITE_STAGING"] === "1";

/**
 * Indexation par les moteurs de recherche :
 * - site de test : jamais ;
 * - site en ligne : selon le réglage technique « indexable » (désactivé tant que
 *   le site est sur son adresse provisoire).
 */
export function robotsContent(ctx: Pick<SiteContext, "indexable">) {
  if (IS_STAGING) return "noindex, nofollow";
  return ctx.indexable ? "index, follow, max-image-preview:large" : "noindex, follow";
}

type Schema = Record<string, unknown>;

export const businessId = (ctx: Pick<SiteContext, "siteUrl">) => `${ctx.siteUrl}/#entreprise`;

export function absoluteUrl(ctx: Pick<SiteContext, "siteUrl">, path: string) {
  return new URL(path, ctx.siteUrl).toString();
}

const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Fiche entreprise lue par Google, construite à partir des coordonnées du back-office. */
export function localBusinessSchema(ctx: SiteContext): Schema {
  const g = ctx.general;
  return {
    "@context": "https://schema.org",
    "@type": ["HomeAndConstructionBusiness", "GeneralContractor", "HousePainter"],
    "@id": businessId(ctx),
    name: g.name,
    url: ctx.siteUrl,
    telephone: `+33${g.phone.replace(/\s/g, "").replace(/^0/, "")}`,
    email: g.email,
    description: g.description,
    foundingDate: String(g.since),
    address: {
      "@type": "PostalAddress",
      streetAddress: g.streetAddress,
      addressLocality: g.city,
      addressRegion: g.region,
      postalCode: g.postalCode,
      addressCountry: "FR",
    },
    areaServed: ctx.zones.map((zone) => ({ "@type": "City", name: zone.name })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: hour(g.hours.openHour),
        closes: hour(g.hours.closeHour),
      },
    ],
    knowsAbout: [
      "Peinture intérieure et décorative",
      "Sols et parquets",
      "Enduits, placo et isolation",
      "Rénovation intérieure",
      "Ravalement de façade",
      "Entretien du bâti",
    ],
  };
}

type SeoHeadOptions = {
  ctx: SiteContext;
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  schema?: Schema[];
};

export function buildSeoHead({ ctx, title, description, path, ogType = "website", schema = [] }: SeoHeadOptions) {
  const url = absoluteUrl(ctx, path);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: robotsContent(ctx) },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { property: "og:locale", content: "fr_FR" },
      { property: "og:site_name", content: ctx.general.name },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: schema.map((item) => ({ type: "application/ld+json", children: JSON.stringify(item) })),
  };
}
