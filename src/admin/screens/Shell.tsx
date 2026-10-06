import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ROLE_LABELS, useAdminSession } from "@/admin/session";
import { btnGhost, SiteWordmark } from "@/admin/ui";

type NavItem = { label: string; to?: string; soon?: boolean };
const NAV: { title: string; items: NavItem[] }[] = [
  { title: "Tableau de bord", items: [{ label: "Accueil du back-office", to: "/admin" }] },
  {
    title: "Votre site",
    items: [
      { label: "Pages", to: "/admin/pages" },
      { label: "Avis clients", soon: true },
      { label: "Questions fréquentes", soon: true },
    ],
  },
  { title: "Vos contacts", items: [{ label: "Messages", soon: true }] },
  { title: "Vos médias", items: [{ label: "Médiathèque", soon: true }] },
  { title: "Navigation", items: [{ label: "Menus du site", soon: true }] },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { session, role, signOut } = useAdminSession();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/admin" ? path === "/admin" || path === "/admin/" : path.startsWith(to));

  return (
    <div className="min-h-screen bg-[oklch(0.965_0.006_85)] text-ink">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-baseline gap-3.5">
            <SiteWordmark className="text-3xl [&_span]:text-[oklch(0.78_0.08_25)]" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/70">Administration</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer" className={`${btnGhost} border-white/25 bg-transparent text-primary-foreground hover:bg-white/10`}>
              Voir le site ↗
            </a>
            <div className="text-right text-[13px] leading-tight">
              <div>{session?.user.email}</div>
              <div className="text-primary-foreground/70">{role ? ROLE_LABELS[role] : ""}</div>
            </div>
            <button type="button" onClick={() => void signOut()} className={`${btnGhost} border-white/25 bg-transparent text-primary-foreground hover:bg-white/10`}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-6 px-6 py-6">
        <nav aria-label="Menu du back-office" className="w-full max-w-[280px] flex-[1_1_240px] rounded-2xl border border-line bg-background p-4">
          {NAV.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="mb-2 px-3 font-display text-xl font-semibold text-[#8A6A4F]">{group.title}</p>
              {group.items.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex min-h-10 items-center rounded-lg px-3 text-[15px] transition-colors ${
                      isActive(item.to) ? "bg-accent/10 font-medium text-accent" : "text-ink-soft hover:bg-sand"
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span key={item.label} className="flex min-h-10 items-center justify-between rounded-lg px-3 text-[15px] text-muted-foreground/70">
                    {item.label}
                    <span className="rounded-full bg-sand px-2 py-0.5 text-[11px]">bientôt</span>
                  </span>
                ),
              )}
            </div>
          ))}
          <span className="flex min-h-11 items-center justify-center rounded-lg bg-[#8A6A4F]/60 text-[14px] font-medium text-white">
            Configuration · bientôt
          </span>
        </nav>
        <main className="min-w-0 flex-[999_1_560px]">{children}</main>
      </div>
    </div>
  );
}
