import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { useSite } from "@/cms/context";
import { hasPhone, telHref } from "@/cms/site-data";
import { nav } from "@/data/navigation";

export function Footer() {
  const { general: site, zones: communes } = useSite();
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <p className="font-display text-3xl leading-none">
              Maury <span className="text-[oklch(0.72_0.12_25)]">Laurent</span>
            </p>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            {site.footerText}
          </p>
        </div>

        <div className="lg:col-span-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/50">
            Savoir-faire
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            {nav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-primary-foreground/80 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/50">
            Secteurs
          </p>
          <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
            {communes.map((c) => (
              <li key={c.slug}>{c.name}</li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/50">
            Contact
          </p>
          <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
            <li>{site.address}</li>
            <li>
              {hasPhone(site) ? (
                <a href={telHref(site)} className="hover:text-white">
                  {site.phone}
                </a>
              ) : (
                <span className="text-primary-foreground/50">[Téléphone à compléter]</span>
              )}
            </li>
            <li>
              {site.email ? (
                <a href={`mailto:${site.email}`} className="hover:text-white">
                  {site.email}
                </a>
              ) : (
                <span className="text-primary-foreground/50">[Email à compléter]</span>
              )}
            </li>
            <li className="flex items-center gap-2 pt-1">
              <Clock className="h-3.5 w-3.5 text-primary-foreground/50" aria-hidden="true" />
              <span>{site.hours.days} · {site.hours.range}</span>
            </li>
          </ul>
          <Link
            to="/contact"
            className="mt-7 inline-flex bg-[oklch(0.5_0.15_25)] px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-white hover:opacity-90"
          >
            Demander un devis
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-6 text-xs text-primary-foreground/50 sm:flex-row sm:justify-between lg:px-10">
          <p>
            © {new Date().getFullYear()} {site.name} — Peinture, décoration et rénovation à{" "}
            {site.city}.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/charte-utilisation" className="hover:text-white">
              Charte d'utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
