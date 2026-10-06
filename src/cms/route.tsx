import { notFound } from "@tanstack/react-router";
import { SiteProvider } from "@/cms/context";
import { buildPageHead, notFoundHead } from "@/cms/head";
import { PageBlocks } from "@/cms/render";
import { getPublishedPage } from "@/cms/server-fns";

type PageData = NonNullable<Awaited<ReturnType<typeof getPublishedPage>>>;

/**
 * Options communes aux routes affichant une page du CMS :
 * chargement de la page depuis le serveur, balises <head> et rendu des blocs.
 */
export function cmsRouteOptions(resolvePath: (params: Record<string, string>) => string) {
  return {
    loader: async ({ params }: { params: Record<string, string> }): Promise<PageData> => {
      const result = await getPublishedPage({ data: resolvePath(params) });
      if (!result) throw notFound();
      return result;
    },
    head: ({ loaderData }: { loaderData?: PageData }) =>
      loaderData ? buildPageHead(loaderData.page, loaderData.ctx, loaderData.breadcrumb) : notFoundHead,
  };
}

export function CmsPageView({ data }: { data: PageData }) {
  return (
    <SiteProvider value={data.ctx}>
      <PageBlocks blocks={data.page.blocks} />
    </SiteProvider>
  );
}
