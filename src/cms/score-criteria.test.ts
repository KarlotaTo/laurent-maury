import { describe, expect, it, vi } from "vitest";
import { fallbackData } from "@/cms/fallback";
import { SCORE_CRITERIA, seoScore } from "@/cms/seo-score";

vi.spyOn(console, "warn").mockImplementation(() => {});

describe("barème affiché = barème calculé", () => {
  it("les critères expliqués sont exactement ceux du calcul, avec les mêmes points", () => {
    const checks = seoScore(fallbackData.pages[0]!).checks;
    expect(checks.map((c) => [c.id, c.max])).toEqual(SCORE_CRITERIA.map((c) => [c.id, c.max]));
  });
  it("le total fait 100", () => {
    expect(SCORE_CRITERIA.reduce((s, c) => s + c.max, 0)).toBe(100);
  });
});
