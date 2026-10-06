import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/entretien-bati")({
  ...cmsRouteOptions(() => "/entretien-bati"),
  component: () => <CmsPageView page={Route.useLoaderData()} />,
});
