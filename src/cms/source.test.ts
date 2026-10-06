import { afterEach, describe, expect, it, vi } from "vitest";
import { fallbackData } from "@/cms/fallback";

/** Le site ne doit jamais afficher une page blanche, même si la base ne répond pas. */
async function freshSource() {
  vi.resetModules();
  return import("@/cms/source");
}

const okResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("chargement des contenus", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  afterEach(() => vi.unstubAllGlobals());

  it("utilise les contenus de secours si la base est injoignable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("réseau coupé")));
    const { loadSiteData } = await freshSource();
    const data = await loadSiteData();
    expect(data.source).toBe("secours");
    expect(data.pages.length).toBe(fallbackData.pages.length);
  });

  it("utilise les contenus de secours si la base renvoie une erreur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("erreur", { status: 500 })));
    const { loadSiteData } = await freshSource();
    expect((await loadSiteData()).source).toBe("secours");
  });

  it("lit la base quand elle répond", async () => {
    const page = fallbackData.pages[0];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(okResponse(url.includes("page_versions") ? [{ snapshot: page }] : [{ key: "general", value: fallbackData.general }])),
      ),
    );
    const { loadSiteData } = await freshSource();
    const data = await loadSiteData();
    expect(data.source).toBe("base");
    expect(data.pages).toHaveLength(1);
  });

  it("écarte une page invalide renvoyée par la base sans bloquer les autres", async () => {
    const page = fallbackData.pages[0];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(okResponse(url.includes("page_versions") ? [{ snapshot: page }, { snapshot: { path: "cassée" } }] : [])),
      ),
    );
    const { loadSiteData } = await freshSource();
    const data = await loadSiteData();
    expect(data.source).toBe("base");
    expect(data.pages).toHaveLength(1);
  });

  it("garde la dernière version connue si la base tombe ensuite", async () => {
    const page = fallbackData.pages[0];
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(okResponse(url.includes("page_versions") ? [{ snapshot: page }] : [])),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    const { loadSiteData } = await freshSource();
    expect((await loadSiteData()).pages).toHaveLength(1);
    fetchMock.mockImplementation(() => Promise.reject(new Error("panne")));
    vi.advanceTimersByTime(60_000);
    const data = await loadSiteData();
    expect(data.source).toBe("base");
    expect(data.pages).toHaveLength(1);
    vi.useRealTimers();
  });
});
