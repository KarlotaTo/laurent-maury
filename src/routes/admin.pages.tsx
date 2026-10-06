import { createFileRoute } from "@tanstack/react-router";
import { PagesTreeScreen } from "@/admin/screens/PagesTree";

export const Route = createFileRoute("/admin/pages")({ component: PagesTreeScreen });
