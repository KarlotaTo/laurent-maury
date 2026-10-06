import { describe, expect, it, vi } from "vitest";
import { fallbackData } from "@/cms/fallback";
import { validateDraft, type Draft } from "@/cms/validate";

/** Les vérifications faites par le serveur avant tout enregistrement. */
vi.spyOn(console, "warn").mockImplementation(() => {});

const pageOf = (path: string) => fallbackData.pages.find((p) => p.path === path)!;
const draftOf = (path: string): Draft => {
  const p = pageOf(path);
  return structuredClone({ seo: p.seo, blocks: p.blocks, meta: p.meta ?? {} });
};

describe("enregistrement d'une page", () => {
  const original = draftOf("/sols-parquets");

  it("accepte une page inchangée", () => {
    expect(validateDraft("service", original, original, "admin")).toEqual([]);
  });

  it("accepte une modification de texte par le client", () => {
    const d = structuredClone(original);
    (d.blocks[0]!.data as { intro: string }).intro = "Nouvelle introduction.";
    expect(validateDraft("service", d, original, "admin")).toEqual([]);
  });

  it("refuse un titre vide", () => {
    const d = structuredClone(original);
    (d.blocks[0]!.data as { title: string }).title = "";
    expect(validateDraft("service", d, original, "editor").join(" ")).toMatch(/obligatoire/);
  });

  it("refuse un titre trop long", () => {
    const d = structuredClone(original);
    (d.blocks[0]!.data as { title: string }).title = "x".repeat(200);
    expect(validateDraft("service", d, original, "editor").join(" ")).toMatch(/maximum/);
  });

  it("refuse une photo sans description", () => {
    const d = structuredClone(original);
    (d.blocks[0]!.data as { image: { alt: string } }).image.alt = "";
    expect(validateDraft("service", d, original, "admin").length).toBeGreaterThan(0);
  });

  it("refuse un bloc inconnu", () => {
    const d = structuredClone(original);
    d.blocks.push({ id: "x", type: "scriptMalveillant", data: {} });
    expect(validateDraft("service", d, original, "admin").join(" ")).toMatch(/inconnu/);
  });

  it("refuse deux blocs avec le même identifiant", () => {
    const d = structuredClone(original);
    d.blocks.push(structuredClone(d.blocks[0]!));
    expect(validateDraft("service", d, original, "admin").join(" ")).toMatch(/double/);
  });

  it("refuse la modification d'un champ verrouillé par le client", () => {
    const d = structuredClone(original);
    (d.blocks[0]!.data as { titleSeoPrefix: string }).titleSeoPrefix = "Autre préfixe";
    expect(validateDraft("service", d, original, "admin").join(" ")).toMatch(/verrouillé/);
  });

  it("autorise la super-admin à modifier un champ verrouillé", () => {
    const d = structuredClone(original);
    (d.blocks[0]!.data as { titleSeoPrefix: string }).titleSeoPrefix = "Autre préfixe";
    expect(validateDraft("service", d, original, "super")).toEqual([]);
  });

  it("refuse un nouveau bloc dont un champ verrouillé est rempli par le client", () => {
    const d = structuredClone(original);
    d.blocks.push({
      id: "nouveau",
      type: "hero",
      data: { eyebrow: "A", titleSeoPrefix: "Tentative", title: "B", intro: "C", chantier: [] },
    });
    expect(validateDraft("service", d, original, "admin").join(" ")).toMatch(/verrouillé/);
  });

  it("refuse la modification des données structurées et de l'indexation par le client", () => {
    const d = structuredClone(original);
    d.seo.jsonLd = [];
    d.seo.noindex = true;
    const problems = validateDraft("service", d, original, "admin").join(" ");
    expect(problems).toMatch(/Données structurées/);
    expect(problems).toMatch(/Indexation/);
  });
});

describe("informations propres au modèle", () => {
  const ville = draftOf("/zones-intervention/fronton");

  it("le client peut modifier le texte court d'une ville", () => {
    const d = structuredClone(ville);
    d.meta["hubText"] = "Nouveau texte court.";
    expect(validateDraft("ville", d, ville, "admin")).toEqual([]);
  });

  it("le client ne peut pas renommer la commune", () => {
    const d = structuredClone(ville);
    d.meta["name"] = "Autre commune";
    expect(validateDraft("ville", d, ville, "admin").join(" ")).toMatch(/verrouillé/);
  });

  it("le client ne peut pas modifier les communes voisines", () => {
    const d = structuredClone(ville);
    const neighbours = d.blocks.find((b) => b.type === "neighbours")!;
    (neighbours.data as { communes: string[] }).communes = ["bouloc"];
    expect(validateDraft("ville", d, ville, "admin").join(" ")).toMatch(/verrouillé/);
  });

  it("une réalisation sans photo de carte est refusée", () => {
    const r = draftOf("/realisations/renovation-veranda-balma");
    const d = structuredClone(r);
    (d.meta["image"] as { src: string }).src = "";
    expect(validateDraft("realisation", d, r, "super").join(" ")).toMatch(/Photo/);
  });
});
