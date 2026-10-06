import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/peinture-decoration")({
  ...cmsRouteOptions(() => "/peinture-decoration"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
