import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/murs-revetements")({
  ...cmsRouteOptions(() => "/murs-revetements"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
