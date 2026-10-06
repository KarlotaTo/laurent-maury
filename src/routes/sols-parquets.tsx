import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/sols-parquets")({
  ...cmsRouteOptions(() => "/sols-parquets"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
