import { createFileRoute } from "@tanstack/react-router";
import { loadSiteData } from "@/cms/source";
import { contextOf, zonesOf } from "@/cms/site-data";
import { TEMPLATE_LABELS } from "@/cms/templates";
import { IS_STAGING } from "@/lib/seo";

/**
 * llms.txt : fiche lisible par les assistants IA (ChatGPT, Claude, Perplexity…),
 * générée depuis le back-office : présentation, coordonnées, secteur, pages, questions fréquentes.
 */
export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const data = await loadSiteData();
        const ctx = contextOf(data);
        const g = ctx.general;
        const pages = data.pages.filter((p) => p.status === "published" && !p.seo.noindex && p.template !== "legal");
        const url = (path: string) => new URL(path, ctx.siteUrl).toString();
        const groups = new Map<string, typeof pages>();
        for (const p of pages) groups.set(p.template, [...(groups.get(p.template) ?? []), p]);
        const lines = [
          `# ${g.name}`,
          "",
          `> ${g.description}`,
          "",
          `- Activité : ${g.baseline}`,
          `- Siège : ${g.streetAddress}, ${g.postalCode} ${g.city} (${g.region}), France`,
          `- Depuis : ${g.since}`,
          `- Secteur d'intervention : ${zonesOf(data.pages).map((z) => z.name).join(", ")}`,
          `- Téléphone : ${g.phone}`,
          `- E-mail : ${g.email}`,
          `- Horaires : ${g.hours.days}, ${g.hours.range}`,
          `- Devis : gratuit et détaillé, après visite sur place (${url("/contact")})`,
          "",
          ...[...groups.entries()].flatMap(([template, list]) => [
            `## ${TEMPLATE_LABELS[template] ?? template}`,
            "",
            ...list.map((p) => `- [${p.label}](${url(p.path)}) : ${p.seo.description}`),
            "",
          ]),
          ...(ctx.faq.length
            ? ["## Questions fréquentes", "", ...ctx.faq.flatMap((q) => [`### ${q.question}`, "", q.answer.replace(/\*\*|\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"), ""])]
            : []),
          ...(ctx.avis.length
            ? ["## Avis clients (Google)", "", ...ctx.avis.slice(0, 6).map((a) => `- « ${a.text} » — ${a.author}, ${a.rating}/5`), ""]
            : []),
        ];
        return new Response(lines.join("\n"), {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=3600",
            ...(IS_STAGING || !ctx.indexable ? { "x-robots-tag": "noindex" } : {}),
          },
        });
      },
    },
  },
});
