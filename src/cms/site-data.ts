import type { Page } from "@/cms/types";

/** Réglages du site, modifiables dans le back-office. */
export type General = {
  name: string;
  baseline: string;
  city: string;
  since: number;
  phone: string;
  email: string;
  address: string;
  streetAddress: string;
  postalCode: string;
  region: string;
  /** Présentation de l'entreprise pour Google (fiche entreprise). */
  description: string;
  hours: { days: string; range: string; openHour: number; closeHour: number };
  footerText: string;
};
export type Review = { author: string; rating: number; date: string; text: string };
export type Engagement = { title: string; text: string };
export type FaqItem = { question: string; answer: string; category?: string | undefined };
export type Tracking = { gtm?: string; ga4?: string; clarity?: string; googleVerification?: string; bingVerification?: string };
export type Redirect = { from_path: string; to_path: string | null; status: 301 | 302 | 410 };
export type Technique = { siteUrl: string; indexable: boolean } & Record<string, unknown>;

/** Tout le contenu d'un site : pages publiées et réglages. */
export type SiteData = {
  pages: Page[];
  general: General;
  avis: Review[];
  engagements: Engagement[];
  faq: FaqItem[];
  tracking: Tracking;
  redirects: Redirect[];
  technique: Technique;
  /** "base" : contenus lus dans la base ; "secours" : contenus livrés avec le site. */
  source: "base" | "secours";
};

export type ZoneSummary = { slug: string; name: string; h1: string; hubText: string; main: boolean; order: number };
export type RealisationSummary = {
  slug: string;
  title: string;
  city: string;
  type: string;
  summary: string;
  image: { src: string; alt: string };
  order: number;
};

/** Ce dont les blocs et le gabarit ont besoin, sans le contenu des autres pages. */
export type SiteContext = {
  general: General;
  avis: Review[];
  engagements: Engagement[];
  faq: FaqItem[];
  tracking: Tracking;
  siteUrl: string;
  indexable: boolean;
  zones: ZoneSummary[];
  realisations: RealisationSummary[];
};

export function zonesOf(pages: Page[]): ZoneSummary[] {
  return pages
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
}

export function realisationsOf(pages: Page[]): RealisationSummary[] {
  return pages
    .filter((page) => page.template === "realisation" && page.status === "published")
    .map((page) => {
      const meta = (page.meta ?? {}) as Partial<RealisationSummary> & { cardTitle?: string };
      return {
        order: page.order,
        slug: page.path.split("/").pop() ?? "",
        title: meta.cardTitle ?? page.label,
        city: meta.city ?? "",
        type: meta.type ?? "",
        summary: meta.summary ?? page.seo.description,
        image: meta.image ?? { src: "", alt: "" },
      };
    })
    .filter((r) => r.image.src !== "")
    .sort((a, b) => a.order - b.order);
}

export function contextOf(data: SiteData): SiteContext {
  return {
    general: data.general,
    avis: data.avis,
    engagements: data.engagements,
    faq: data.faq,
    tracking: data.tracking,
    siteUrl: data.technique.siteUrl,
    indexable: data.technique.indexable === true,
    zones: zonesOf(data.pages),
    realisations: realisationsOf(data.pages),
  };
}

/** Pages parentes, de la racine à la page (pour le fil d'Ariane). */
export function ancestorsOf(page: Page, pages: Page[]): { label: string; path: string }[] {
  const byId = new Map(pages.map((p) => [p.id, p]));
  const chain: { label: string; path: string }[] = [];
  for (let current: Page | undefined = page; current && chain.length < 10; current = current.parentId ? byId.get(current.parentId) : undefined) {
    chain.unshift({ label: current.label, path: current.path });
  }
  return chain;
}

/* ---------- Petites aides sur les coordonnées ---------- */

export const hasPhone = (g: General) => g.phone.trim().length > 0;
export const telHref = (g: General) => `tel:${g.phone.replace(/\s/g, "")}`;
/** Jours ouvrés : du lundi (1) au vendredi (5). */
export function isOpen(g: General, date = new Date()): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  return day >= 1 && day <= 5 && hour >= g.hours.openHour && hour < g.hours.closeHour;
}

/** Questions retenues pour un bloc : thème éventuel, puis nombre maximum. */
export function faqItems(all: { question: string; answer: string; category?: string | undefined }[], category: string | undefined, limit: number) {
  const theme = category?.trim().toLowerCase();
  return all.filter((q) => !theme || q.category?.trim().toLowerCase() === theme).slice(0, limit);
}
