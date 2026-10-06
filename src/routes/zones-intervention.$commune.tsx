import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/zones-intervention/$commune")({
  ...cmsRouteOptions((params) => `/zones-intervention/${params["commune"] ?? ""}`),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
