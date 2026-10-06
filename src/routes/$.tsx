import { createFileRoute } from "@tanstack/react-router";
import { cmsRouteOptions, CmsPageView } from "@/cms/route";

/** Pages créées depuis le back-office (toute adresse non prise par une autre route). */
export const Route = createFileRoute("/$")({
  ...cmsRouteOptions((params) => `/${params["_splat"] ?? ""}`.replace(/\/+$/, "")),
  component: () => <CmsPageView page={Route.useLoaderData()} />,
});
