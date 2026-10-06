import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/realisations/")({
  ...cmsRouteOptions(() => "/realisations"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
