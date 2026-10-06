import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/charte-utilisation")({
  ...cmsRouteOptions(() => "/charte-utilisation"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
