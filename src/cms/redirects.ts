import type { Redirect } from "@/cms/site-data";

/** Adresse normalisée pour comparer : sans barre finale, sans paramètres, minuscules. */
export function normalizePath(path: string): string {
  let p = path.split("?")[0]!.split("#")[0]!;
  try {
    p = decodeURIComponent(p);
  } catch {
    // adresse mal encodée : comparée telle quelle
  }
  p = p.toLowerCase();
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

/** Redirection à appliquer pour cette adresse, s'il y en a une. */
export function findRedirect(redirects: Redirect[], pathname: string): Redirect | undefined {
  const target = normalizePath(pathname);
  return redirects.find((r) => normalizePath(r.from_path) === target);
}

/** Réponse HTTP d'une redirection (301 permanente, 302 temporaire, 410 page supprimée). */
export function redirectResponse(redirect: Redirect, url: URL): Response {
  if (redirect.status === 410 || !redirect.to_path) {
    return new Response(
      `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page supprimée</title></head><body style="font-family:system-ui;padding:3rem;text-align:center"><h1>Cette page n'existe plus</h1><p><a href="/">Retour à l'accueil</a></p></body></html>`,
      { status: 410, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
  const location = redirect.to_path.startsWith("/") ? `${redirect.to_path}${url.search}` : redirect.to_path;
  return new Response(null, { status: redirect.status, headers: { location, "cache-control": "public, max-age=300" } });
}

/** Adresses jamais redirigées : back-office, fichiers techniques, ressources du site. */
export function isRedirectable(pathname: string): boolean {
  return !/^\/(admin|_serverFn|_build|assets|images|@|__)/.test(pathname) && pathname !== "/robots.txt" && pathname !== "/sitemap.xml";
}
