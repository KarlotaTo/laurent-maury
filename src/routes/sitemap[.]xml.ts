import { createFileRoute } from "@tanstack/react-router";
import { loadSiteData } from "@/cms/source";

/** Plan du site pour Google : toutes les pages publiées et indexables, à jour à chaque publication. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const site = await loadSiteData();
        const paths = site.pages
          .filter((p) => p.status === "published" && !p.seo.noindex)
          .map((p) => p.path);
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, site.technique.siteUrl).toString()}</loc></url>`).join("\n")}
</urlset>
`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
