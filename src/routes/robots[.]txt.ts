import { createFileRoute } from "@tanstack/react-router";
import { IS_STAGING, SITE_URL } from "@/lib/seo";

const body = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(IS_STAGING ? "User-agent: *\nDisallow: /\n" : body, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            ...(IS_STAGING ? { "x-robots-tag": "noindex, nofollow" } : {}),
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
