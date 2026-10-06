import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchPages, type PageRow } from "@/admin/pages-data";
import { useAdminSession } from "@/admin/session";
import { btnGhost } from "@/admin/ui";

export function DashboardScreen() {
  const { session } = useAdminSession();
  const [pages, setPages] = useState<PageRow[] | null>(null);
  useEffect(() => {
    fetchPages().then(setPages, () => setPages([]));
  }, []);
  const published = pages?.filter((p) => p.published_version_id).length;
  const drafts = pages?.filter((p) => !p.published_version_id).length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-background p-7">
        <h1 className="font-display text-4xl">Bonjour</h1>
        <p className="mt-1 text-muted-foreground">Connectée en tant que {session?.user.email}. Que souhaitez-vous faire aujourd'hui ?</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/admin/pages" className={btnGhost}>Voir les pages du site</Link>
        </div>
      </section>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <Stat label="Pages publiées" value={published ?? "…"} />
        <Stat label="Brouillons" value={drafts ?? "…"} />
        <Stat label="Demandes de devis (30 j)" value="Bientôt" muted />
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
