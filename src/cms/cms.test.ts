import { describe, expect, it, vi } from "vitest";
import { blockRegistry } from "@/cms/registry";
import { checkBlock } from "@/cms/render";
import { getAllPages } from "@/cms/pages";
import { pageSchema } from "@/cms/types";

const pageFiles = import.meta.glob("../content/cms/pages/*.json", { eager: true, import: "default" });

describe("bibliothèque de blocs", () => {
  it.each(Object.values(blockRegistry).map((def) => [def.type, def] as const))(
    "le contenu d'exemple du bloc %s est valide",
    (_type, def) => {
      expect(def.schema.safeParse(def.example).success).toBe(true);
      expect(def.backgrounds.length).toBeGreaterThan(0);
    },
  );
});

describe("pages publiées", () => {
  it("chaque fichier de page est valide", () => {
    for (const [file, raw] of Object.entries(pageFiles)) {
      const parsed = pageSchema.safeParse(raw);
      expect(parsed.success, `${file} : ${parsed.success ? "" : parsed.error.issues[0]?.message}`).toBe(true);
    }
  });

  it("aucune page n'a de bloc écarté", () => {
    for (const page of getAllPages()) {
      for (const block of page.blocks) {
        const result = checkBlock(block);
        expect(result.ok, `${page.path} › ${block.type} (${block.id}) : ${result.ok ? "" : result.reason}`).toBe(true);
      }
    }
  });

  it("adresses et identifiants uniques", () => {
    const pages = getAllPages();
    expect(new Set(pages.map((p) => p.path)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.id)).size).toBe(pages.length);
    const blockIds = pages.flatMap((p) => p.blocks.map((b) => b.id));
    expect(new Set(blockIds).size).toBe(blockIds.length);
  });

  it("titres et descriptions Google dans les limites", () => {
    for (const page of getAllPages()) {
      expect(page.seo.title.length, page.path).toBeLessThanOrEqual(70);
      expect(page.seo.description.length, page.path).toBeLessThanOrEqual(170);
    }
  });
});

describe("garde-fous", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});

  it("un type de bloc inconnu est écarté", () => {
    expect(checkBlock({ id: "x", type: "inconnu", data: {} }).ok).toBe(false);
  });

  it("un champ obligatoire vide est refusé", () => {
    const result = checkBlock({ id: "x", type: "contactCta", data: { title: "", text: "Texte" } });
    expect(result.ok).toBe(false);
  });

  it("un titre trop long est refusé", () => {
    const result = checkBlock({ id: "x", type: "contactCta", data: { title: "a".repeat(81), text: "Texte" } });
    expect(result.ok).toBe(false);
  });

  it("une photo sans description est refusée", () => {
    const data = { ...blockRegistry["feature"]!.example, image: { src: "/images/atelier.jpg", alt: "" } };
    expect(checkBlock({ id: "x", type: "feature", data }).ok).toBe(false);
  });

  it("un lien vers un site extérieur est refusé dans un lien de page", () => {
    const data = { ...blockRegistry["textTitle"]!.example, link: { href: "https://exemple.com", label: "Lien" } };
    expect(checkBlock({ id: "x", type: "textTitle", data }).ok).toBe(false);
  });

  it("un fond non prévu pour le bloc est remplacé par son fond par défaut", () => {
    const result = checkBlock({ id: "x", type: "feature", background: "light", data: blockRegistry["feature"]!.example });
    expect(result.ok && result.background).toBe("dark");
  });
});
