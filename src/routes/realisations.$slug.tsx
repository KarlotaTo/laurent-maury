import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/realisations/$slug")({
  ...cmsRouteOptions((params) => `/realisations/${params["slug"] ?? ""}`),
  component: () => <CmsPageView page={Route.useLoaderData()} />,
});
