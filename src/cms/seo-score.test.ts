import { describe, expect, it, vi } from "vitest";
import { fallbackData } from "@/cms/fallback";
import { outlineOf } from "@/cms/outline";
import { contains, normalize, seoScore } from "@/cms/seo-score";

vi.spyOn(console, "warn").mockImplementation(() => {});
const page = (path: string) => structuredClone(fallbackData.pages.find((p) => p.path === path)!);

describe("plan de la page", () => {
  it("une page savoir-faire a un H1 puis des H2 et H3", () => {
    const outline = outlineOf(page("/sols-parquets").blocks);
    expect(outline.filter((h) => h.level === "h1")).toHaveLength(1);
    expect(outline[0]!.level).toBe("h1");
    expect(outline.filter((h) => h.level === "h2").length).toBeGreaterThanOrEqual(2);
    expect(outline.some((h) => h.level === "h3")).toBe(true);
  });
  it("un bloc masqué n'apparaît pas dans le plan", () => {
    const p = page("/sols-parquets");
    p.blocks[0]!.hidden = true;
    expect(outlineOf(p.blocks).some((h) => h.level === "h1")).toBe(false);
  });
});

describe("score SEO", () => {
  it("compare les expressions sans accents ni majuscules", () => {
    expect(normalize("Rénovation À Bouloc")).toBe("renovation a bouloc");
    expect(contains("Entreprise de rénovation à Bouloc", "renovation bouloc")).toBe(true);
    expect(contains("Peintres décorateurs", "peintre")).toBe(true);
    expect(contains("Parquet massif", "peintre bouloc")).toBe(false);
  });

  it("sans expression clé, la page perd les points correspondants", () => {
    const result = seoScore(page("/sols-parquets"));
    expect(result.checks.find((c) => c.id === "keyword")!.points).toBe(0);
    expect(result.score).toBeLessThanOrEqual(75);
  });

  it("une expression bien placée rapporte les 25 points", () => {
    const p = page("/sols-parquets");
    p.seo.focusKeyword = "parquet Bouloc";
    p.path = "/parquet-bouloc";
    (p.blocks[0]!.data as { title: string }).title = "Parquet massif à Bouloc";
    const check = seoScore(p).checks.find((c) => c.id === "keyword")!;
    expect(check.points).toBe(25);
  });

  it("deux H1 font perdre les 15 points du H1", () => {
    const p = page("/sols-parquets");
    p.blocks.push({ ...structuredClone(p.blocks[0]!), id: "doublon" });
    expect(seoScore(p).checks.find((c) => c.id === "h1")!.points).toBe(0);
  });

  it("une photo sans description est signalée", () => {
    const p = page("/sols-parquets");
    (p.blocks[0]!.data as { image: { alt: string } }).image.alt = "";
    const check = seoScore(p).checks.find((c) => c.id === "alt")!;
    expect(check.ok).toBe(false);
  });

  it("la même expression sur deux pages est signalée (cannibalisation)", () => {
    const a = page("/sols-parquets");
    const b = page("/peinture-decoration");
    a.seo.focusKeyword = "peintre Bouloc";
    b.seo.focusKeyword = "Peintre bouloc";
    expect(seoScore(a, [a, b]).checks.find((c) => c.id === "unique")!.ok).toBe(false);
  });

  it("le score reste entre 0 et 100", () => {
    for (const p of fallbackData.pages) {
      const { score } = seoScore(p, fallbackData.pages);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});
