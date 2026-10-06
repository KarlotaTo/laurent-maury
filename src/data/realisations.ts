/**
 * Réalisations : lues depuis les pages du modèle « réalisation » du CMS.
 * Une réalisation publiée apparaît automatiquement dans les listes du site et le plan du site.
 */
import { getAllPages } from "@/cms/pages";

export type Realisation = {
  order: number;
  slug: string;
  /** Titre court affiché sur les cartes */
  title: string;
  city: string;
  type: string;
  summary: string;
  image: { src: string; alt: string };
};

type RealisationMeta = Partial<Omit<Realisation, "order" | "slug" | "title">> & { cardTitle?: string };

export const realisations: Realisation[] = getAllPages()
  .filter((page) => page.template === "realisation" && page.status === "published")
  .map((page) => {
    const meta = (page.meta ?? {}) as RealisationMeta;
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
