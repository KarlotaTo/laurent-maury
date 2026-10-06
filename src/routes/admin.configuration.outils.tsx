import { createFileRoute } from "@tanstack/react-router";
import { SettingListScreen } from "@/admin/screens/SettingList";

export const Route = createFileRoute("/admin/configuration/outils")({ component: () => <SettingListScreen settingKey="tracking" /> });
