import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/renovation-interieure")({
  ...cmsRouteOptions(() => "/renovation-interieure"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
