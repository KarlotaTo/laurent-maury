import { createFileRoute } from "@tanstack/react-router";
import { AdminRoot } from "@/admin/AdminRoot";

/** Back-office : rendu uniquement dans le navigateur, jamais indexé. */
export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Administration" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminRoot,
});
