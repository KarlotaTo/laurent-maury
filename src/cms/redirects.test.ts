import { describe, expect, it } from "vitest";
import { findRedirect, isRedirectable, normalizePath, redirectResponse } from "@/cms/redirects";

const list = [
  { from_path: "/ancienne-page/", to_path: "/sols-parquets", status: 301 as const },
  { from_path: "/Promo", to_path: "/contact", status: 302 as const },
  { from_path: "/supprimee", to_path: null, status: 410 as const },
];

describe("redirections", () => {
  it("normalise les adresses", () => {
    expect(normalizePath("/Ancienne-Page/?x=1")).toBe("/ancienne-page");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/r%C3%A9novation")).toBe("/rénovation");
  });
  it("trouve la redirection malgré la casse et la barre finale", () => {
    expect(findRedirect(list, "/ancienne-page")?.to_path).toBe("/sols-parquets");
    expect(findRedirect(list, "/promo/")?.status).toBe(302);
    expect(findRedirect(list, "/autre")).toBeUndefined();
  });
  it("renvoie une 301 en gardant les paramètres", () => {
    const r = redirectResponse(list[0]!, new URL("https://site.fr/ancienne-page?utm_source=x"));
    expect(r.status).toBe(301);
    expect(r.headers.get("location")).toBe("/sols-parquets?utm_source=x");
  });
  it("renvoie une 410 pour une page supprimée", () => {
    expect(redirectResponse(list[2]!, new URL("https://site.fr/supprimee")).status).toBe(410);
  });
  it("ne redirige jamais le back-office ni les ressources", () => {
    expect(isRedirectable("/admin")).toBe(false);
    expect(isRedirectable("/images/a.webp")).toBe(false);
    expect(isRedirectable("/_serverFn/x")).toBe(false);
    expect(isRedirectable("/ancienne-page")).toBe(true);
  });
});
