import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/mentions-legales")({
  ...cmsRouteOptions(() => "/mentions-legales"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
