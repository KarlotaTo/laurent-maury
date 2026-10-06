import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/entreprise")({
  ...cmsRouteOptions(() => "/entreprise"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
