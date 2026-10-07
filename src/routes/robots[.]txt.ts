import { createFileRoute } from "@tanstack/react-router";
import { loadSiteData } from "@/cms/source";
import { IS_STAGING } from "@/lib/seo";

/**
 * Moteurs de recherche et assistants IA explicitement autorisés : le site doit pouvoir
 * être lu, résumé et cité par Google, Bing, ChatGPT, Claude, Perplexity, Gemini…
 */
const AGENTS = [
  "Googlebot", "Bingbot", "Google-Extended", "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User",
  "Applebot", "Applebot-Extended", "facebookexternalhit", "Twitterbot",
];
const body = (siteUrl: string) => `${AGENTS.map((a) => `User-agent: ${a}\nAllow: /\n`).join("\n")}
User-agent: *
Allow: /
Disallow: /admin

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
