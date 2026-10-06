import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchPages, type PageRow } from "@/admin/pages-data";
import { useAdminSession } from "@/admin/session";
import { adminDb } from "@/admin/supabase";
import { btnGhost } from "@/admin/ui";
import { CMS_CONFIG } from "@/cms/config";

export function DashboardScreen() {
  const { session } = useAdminSession();
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const [newMessages, setNewMessages] = useState<number | null>(null);
  const [recentMessages, setRecentMessages] = useState<number | null>(null);
  useEffect(() => {
    fetchPages().then(setPages, () => setPages([]));
    const db = adminDb();
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    void db.from("messages").select("id", { count: "exact", head: true }).eq("site_id", CMS_CONFIG.siteId).eq("status", "new")
      .then(({ count }) => setNewMessages(count ?? 0));
    void db.from("messages").select("id", { count: "exact", head: true }).eq("site_id", CMS_CONFIG.siteId).neq("status", "spam").gte("created_at", since)
      .then(({ count }) => setRecentMessages(count ?? 0));
  }, []);
  const published = pages?.filter((p) => p.published_version_id).length;
  const drafts = pages?.filter((p) => !p.published_version_id).length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-background p-7">
        <h1 className="font-display text-4xl">Bonjour</h1>
        <p className="mt-1 text-muted-foreground">Connectée en tant que {session?.user.email}. Que souhaitez-vous faire aujourd'hui ?</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/admin/pages" className={btnGhost}>Modifier une page</Link>
          <Link to="/admin/messages" className={btnGhost}>Voir les messages</Link>
          <Link to="/admin/medias" className={btnGhost}>Ajouter des photos</Link>
          <Link to="/admin/avis" className={btnGhost}>Ajouter un avis</Link>
        </div>
      </section>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <Stat label="Pages publiées" value={published ?? "…"} />
        <Stat label="Brouillons" value={drafts ?? "…"} />
        <Stat label="Demandes de devis (30 j)" value={recentMessages ?? "…"} />
        <Stat label="Messages à traiter" value={newMessages ?? "…"} />
        <Stat label="Visites Google (30 j)" value="Bientôt" muted />
      </div>
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: string | number; muted?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-background p-5">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className={`mt-1.5 ${muted ? "text-lg text-muted-foreground" : "text-3xl font-medium"}`}>{value}</p>
    </div>
  );
}
