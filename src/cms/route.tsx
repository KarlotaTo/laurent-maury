import { notFound } from "@tanstack/react-router";
import { buildPageHead, notFoundHead } from "@/cms/head";
import { getPublishedPage } from "@/cms/pages";
import { PageBlocks } from "@/cms/render";
import type { Page } from "@/cms/types";

/**
 * Options communes aux routes affichant une page du CMS :
 * chargement de la page, balises <head> et rendu des blocs.
 */
export function cmsRouteOptions(resolvePath: (params: Record<string, string>) => string) {
  return {
    loader: ({ params }: { params: Record<string, string> }): Page => {
      const page = getPublishedPage(resolvePath(params));
      if (!page) throw notFound();
      return page;
    },
    head: ({ loaderData }: { loaderData?: Page }) => (loaderData ? buildPageHead(loaderData) : notFoundHead),
  };
}

export function CmsPageView({ page }: { page: Page }) {
  return <PageBlocks blocks={page.blocks} />;
}
