import { createFileRoute } from "@tanstack/react-router";
import { PageEditorScreen } from "@/admin/screens/PageEditor";

export const Route = createFileRoute("/admin/pages/$id")({
  component: () => <PageEditorScreen pageId={Route.useParams().id} />,
});
