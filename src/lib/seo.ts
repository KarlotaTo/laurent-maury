import { communes, site } from "@/data/site";

export const SITE_URL = "https://maury-laurent.lnkio.fr";
export const BUSINESS_ID = `${SITE_URL}/#entreprise`;

type Schema = Record<string, unknown>;

type SeoHeadOptions = {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  schema?: Schema | Schema[];
  breadcrumbLabel?: string;
};

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export const localBusinessSchema: Schema = {
  "@context": "https://schema.org",
  "@type": ["HomeAndConstructionBusiness", "GeneralContractor", "HousePainter"],
  "@id": BUSINESS_ID,
  name: site.name,
  url: SITE_URL,
  telephone: "+33603068750",
  email: site.email,
  description:
    "Artisan de la rénovation à Bouloc depuis 1994 : rénovation clé en main ou travaux ciblés, peinture et décoration, sols, placo, isolation, façades. Quatre générations d'artisans.",
  foundingDate: String(site.since),
  address: {
    "@type": "PostalAddress",
    streetAddress: "14 impasse de la Seube",
    addressLocality: site.city,
    addressRegion: "Haute-Garonne",
    postalCode: "31620",
    addressCountry: "FR",
  },
  areaServed: communes.map((commune) => ({
    "@type": "City",
    name: commune.name,
  })),
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
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

export function breadcrumbSchema(path: string, label: string): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: absoluteUrl(path),
      },
    ],
  };
}

export function serviceSchema(name: string, description: string, path: string): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: absoluteUrl(path),
    provider: { "@id": BUSINESS_ID },
    areaServed: communes.map((commune) => ({ "@type": "City", name: commune.name })),
    serviceType: name,
  };
}

export function buildSeoHead({
  title,
  description,
  path,
  ogType = "website",
  schema,
  breadcrumbLabel,
}: SeoHeadOptions) {
  const url = absoluteUrl(path);
  const schemas = [
    ...(schema ? (Array.isArray(schema) ? schema : [schema]) : []),
    ...(breadcrumbLabel ? [breadcrumbSchema(path, breadcrumbLabel)] : []),
  ];

  return {
    meta: [
      { title },
      { name: "description", content: description },
      // Site provisoire (maury-laurent.lnkio.fr) : hors de Google jusqu'à la mise en ligne sur maury-laurent.fr.
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: ogType },
      { property: "og:url", content: url },
      { property: "og:locale", content: "fr_FR" },
      { property: "og:site_name", content: site.name },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: schemas.map((item) => ({
      type: "application/ld+json",
      children: JSON.stringify(item),
    })),
  };
}