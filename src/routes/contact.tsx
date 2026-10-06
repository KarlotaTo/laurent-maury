import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): { intent?: string } =>
    typeof search["intent"] === "string" ? { intent: search["intent"] } : {},
  ...cmsRouteOptions(() => "/contact"),
  component: () => <CmsPageView data={Route.useLoaderData()} />,
});
