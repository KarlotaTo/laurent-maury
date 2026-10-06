import { createFileRoute } from "@tanstack/react-router";
import { RedirectsScreen } from "@/admin/screens/Redirects";

export const Route = createFileRoute("/admin/configuration/redirections")({ component: RedirectsScreen });
