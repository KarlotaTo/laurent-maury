import { createFileRoute } from "@tanstack/react-router";
import { SettingListScreen } from "@/admin/screens/SettingList";

export const Route = createFileRoute("/admin/questions")({ component: () => <SettingListScreen settingKey="faq" /> });
