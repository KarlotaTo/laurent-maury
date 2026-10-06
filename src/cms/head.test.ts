import { describe, expect, it, vi } from "vitest";
import { fallbackData } from "@/cms/fallback";
import { buildPageHead } from "@/cms/head";
import { contextOf } from "@/cms/site-data";

vi.spyOn(console, "warn").mockImplementation(() => {});
const ctx = contextOf(fallbackData);
const ld = (head: ReturnType<typeof buildPageHead>) => head.scripts.map((s) => JSON.parse(s.children) as Record<string, unknown>);

describe("informations Google d'une page dupliquée", () => {
  const original = fallbackData.pages.find((p) => p.path === "/realisations/renovation-veranda-balma")!;
  const copy = structuredClone(original);
  copy.path = "/realisations/salle-de-bains-fronton";
  delete copy.seo.jsonLd;
  copy.meta = { ...copy.meta, city: "Fronton", type: "Salle de bains" };
  const head = ld(buildPageHead(copy, ctx, [{ label: "Réalisations", path: "/realisations" }, { label: "Copie", path: copy.path }]));

  it("génère une fiche CreativeWork à la bonne adresse et pour la bonne commune", () => {
    const work = head.find((s) => s["@type"] === "CreativeWork")!;
    expect(work["url"]).toBe(`${ctx.siteUrl}/realisations/salle-de-bains-fronton`);
    expect(work["genre"]).toBe("Salle de bains");
    expect((work["contentLocation"] as { name: string }).name).toBe("Fronton");
    expect(work["about"]).toEqual(["Retrait de papier peint", "Préparation des surfaces", "Pose de papier peint"]);
  });

  it("garde le fil d'Ariane", () => {
    expect(head.some((s) => s["@type"] === "BreadcrumbList")).toBe(true);
  });

  it("la page d'origine garde ses informations enregistrées", () => {
    const orig = ld(buildPageHead(original, ctx, []));
    expect(orig.find((s) => s["@type"] === "CreativeWork")!["url"]).toBe(`${ctx.siteUrl}/realisations/renovation-veranda-balma`);
  });
});
