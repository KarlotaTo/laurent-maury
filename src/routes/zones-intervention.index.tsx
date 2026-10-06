import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/zones-intervention/")({
  ...cmsRouteOptions(() => "/zones-intervention"),
  component: () => <CmsPageView page={Route.useLoaderData()} />,
});
