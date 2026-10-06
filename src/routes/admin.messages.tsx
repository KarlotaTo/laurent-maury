import { createFileRoute } from "@tanstack/react-router";
import { MessagesScreen } from "@/admin/screens/Messages";

export const Route = createFileRoute("/admin/messages")({ component: MessagesScreen });
