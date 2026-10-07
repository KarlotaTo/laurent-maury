import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Toutes les photos du site sont en WebP, et chaque photo citée dans une page existe bien. */
const files = import.meta.glob("../content/**/*.json", { eager: true, import: "default" });
const code = import.meta.glob("./blocks/*.tsx", { eager: true, query: "?raw", import: "default" });

describe("photos du site", () => {
  const all = [...Object.values(files).map((v) => JSON.stringify(v)), ...Object.values(code).map(String)].join("\n");
  const refs = [...new Set(all.match(/\/images\/[A-Za-z0-9/_.-]+/g) ?? [])];

  it("aucune photo en JPG ou PNG", () => {
    expect(refs.filter((r) => /\.(jpe?g|png)$/i.test(r))).toEqual([]);
  });

  it("chaque photo citée existe dans public/images", () => {
    expect(refs.filter((r) => !existsSync(`public${r}`))).toEqual([]);
  });
});
