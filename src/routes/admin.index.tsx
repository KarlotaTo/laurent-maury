import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen } from "@/admin/screens/Dashboard";

export const Route = createFileRoute("/admin/")({ component: DashboardScreen });
