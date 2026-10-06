import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/facades-exterieur")({
  ...cmsRouteOptions(() => "/facades-exterieur"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
