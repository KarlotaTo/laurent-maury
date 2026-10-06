import { createFileRoute } from "@tanstack/react-router";
import { loadSiteData } from "@/cms/source";
import { IS_STAGING } from "@/lib/seo";

const body = (siteUrl: string) => `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(IS_STAGING ? "User-agent: *\nDisallow: /\n" : body((await loadSiteData()).technique.siteUrl), {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            ...(IS_STAGING ? { "x-robots-tag": "noindex, nofollow" } : {}),
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
