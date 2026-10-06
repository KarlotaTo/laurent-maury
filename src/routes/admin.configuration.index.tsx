import { createFileRoute } from "@tanstack/react-router";
import { ConfigurationScreen } from "@/admin/screens/Configuration";

export const Route = createFileRoute("/admin/configuration/")({ component: ConfigurationScreen });
