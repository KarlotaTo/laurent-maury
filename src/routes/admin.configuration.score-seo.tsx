import { createFileRoute } from "@tanstack/react-router";
import { ScoreGuideScreen } from "@/admin/screens/ScoreGuide";

export const Route = createFileRoute("/admin/configuration/score-seo")({ component: ScoreGuideScreen });
