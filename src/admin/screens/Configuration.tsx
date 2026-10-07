import { Link } from "@tanstack/react-router";
import { ArrowRightLeft, BarChart3, GraduationCap, Building2, Cookie, DatabaseBackup, Globe, LayoutTemplate, Lock, ScrollText, Search, Users } from "lucide-react";
import type { ComponentType } from "react";
import { useAdminSession } from "@/admin/session";

type Tile = { title: string; text: string; icon: ComponentType<{ className?: string }>; to?: string; locked?: boolean; soon?: boolean };

const SITE: Tile[] = [
  { title: "Coordonnées et horaires", text: "Téléphone, e-mail, adresse, horaires, pied de page", icon: Building2, to: "/admin/configuration/coordonnees" },
  { title: "Outils d'analyse et de suivi", text: "Google Analytics 4, Tag Manager, Search Console, Clarity, Bing", icon: BarChart3, to: "/admin/configuration/outils" },
  { title: "Redirections", text: "Rediriger une ancienne adresse (301, 302) ou signaler une page supprimée (410)", icon: ArrowRightLeft, to: "/admin/configuration/redirections" },
  { title: "Comprendre le score SEO", text: "Le barème critère par critère, et ce que le score ne mesure pas", icon: GraduationCap, to: "/admin/configuration/score-seo" },
  { title: "Utilisateurs", text: "Inviter un éditeur ou un contributeur", icon: Users, soon: true },
];

const TECH: Tile[] = [
  { title: "Domaine et indexation", text: "Adresse du site, HTTPS, visibilité dans Google", icon: Globe, locked: true },
  { title: "SEO global", text: "robots.txt, plan du site, données structurées", icon: Search, locked: true },
  { title: "Modèles et blocs", text: "Modèles de pages et bibliothèque de blocs", icon: LayoutTemplate, locked: true },
  { title: "Cookies et RGPD", text: "Bandeau de consentement, catégories de cookies", icon: Cookie, locked: true },
  { title: "Sauvegardes", text: "Sauvegarde quotidienne de la base, export des contenus", icon: DatabaseBackup, locked: true },
  { title: "Journal d'activité", text: "Qui a modifié quoi, et quand", icon: ScrollText, soon: true },
];

export function ConfigurationScreen() {
  const { role } = useAdminSession();
  const isSuper = role === "super";
  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl">Configuration</h1>
      <TileGroup title="Paramètres du site" tiles={SITE} isSuper={isSuper} />
      <TileGroup title="Paramètres techniques" tiles={TECH} isSuper={isSuper} note={isSuper ? undefined : "Accès réservé à l'administratrice du site"} />
    </div>
  );
}

function TileGroup({ title, tiles, isSuper, note }: { title: string; tiles: Tile[]; isSuper: boolean; note?: string | undefined }) {
  return (
    <section className="rounded-2xl border border-line bg-background p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-3xl">{title}</h2>
        {note ? <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-[12px] text-muted-foreground"><Lock className="size-3" /> {note}</span> : null}
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {tiles.map((t) => {
          const locked = t.locked && !isSuper;
          const disabled = locked || t.soon || !t.to;
          const body = (
            <>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${disabled ? "bg-[#E7E5E0] text-muted-foreground" : "bg-accent/10 text-accent"}`}>
                <t.icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className={`flex items-center gap-1.5 font-medium ${disabled ? "text-muted-foreground" : "text-ink"}`}>
                  {t.title}
                  {locked ? <Lock className="size-3.5" aria-label="Verrouillé" /> : null}
                  {t.soon ? <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-normal">bientôt</span> : null}
                </span>
                <span className="mt-0.5 block text-[13px] text-muted-foreground">{locked ? "Verrouillé par sécurité : géré par l'administratrice du site." : t.text}</span>
              </span>
            </>
          );
          const cls = `flex gap-3.5 rounded-xl border border-line p-4 text-left ${disabled ? "cursor-not-allowed bg-[#F3F2EE]" : "bg-[oklch(0.985_0.004_85)] hover:border-accent"}`;
          return disabled ? (
            <div key={t.title} className={cls} aria-disabled="true">{body}</div>
          ) : (
            <Link key={t.title} to={t.to!} className={cls}>{body}</Link>
          );
        })}
      </div>
    </section>
  );
}
