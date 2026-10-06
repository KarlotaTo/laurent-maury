import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Phone, ChevronDown, Clock } from "lucide-react";
import { useSite } from "@/cms/context";
import { hasPhone, telHref, isOpen } from "@/cms/site-data";
import { nav, expertises } from "@/data/navigation";

function OpenBadge({ className = "" }: { className?: string }) {
  const site = useSite().general;
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    setOpen(isOpen(site));
    const id = setInterval(() => setOpen(isOpen(site)), 60000);
    return () => clearInterval(id);
  }, []);
  if (open === null) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] tracking-wide ${
        open
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      } ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-slate-400"}`} />
      {open ? "Ouvert" : "Fermé"}
      <span className="text-muted-foreground">· {site.hours.range}</span>
    </span>
  );
}

export function Header() {
  const site = useSite().general;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileDrop, setMobileDrop] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDrop = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropOpen(true);
  };
  const closeDrop = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setDropOpen(false), 120);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-500 ${
        scrolled ? "border-line bg-background/95 backdrop-blur" : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex items-baseline gap-3">
            <span className="font-display text-2xl leading-none tracking-tight text-ink">
              Maury <span className="text-accent">Laurent</span>
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:inline">
              Depuis {site.since}
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          <div
            className="relative"
            onMouseEnter={openDrop}
            onMouseLeave={closeDrop}
          >
            <button
              type="button"
              aria-expanded={dropOpen}
              aria-haspopup="true"
              onClick={() => setDropOpen((v) => !v)}
              onFocus={openDrop}
              className="flex items-center gap-1.5 text-[13px] tracking-wide text-ink-soft transition-colors hover:text-ink"
            >
              Expertises
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-300 ${dropOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <div
              className={`absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-4 transition-all duration-200 ${
                dropOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-1 opacity-0"
              }`}
            >
              <div className="border border-line bg-background shadow-[0_24px_60px_-24px_rgba(20,28,45,0.35)]">
                {expertises.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setDropOpen(false)}
                    className="group flex items-center justify-between border-b border-line px-5 py-3.5 text-[13px] tracking-wide text-ink-soft transition-colors last:border-b-0 hover:bg-sand hover:text-ink"
                    activeProps={{ className: "text-accent" }}
                  >
                    {item.label}
                    <span className="h-px w-4 bg-accent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="link-underline text-[13px] tracking-wide text-ink-soft transition-colors hover:text-ink"
              activeProps={{ className: "text-accent" }}
            >
              {item.label}
            </Link>
          ))}
          <OpenBadge className="hidden xl:inline-flex" />
        </nav>

        <div className="flex items-center gap-3">
          {hasPhone(site) && (
            <a
              href={telHref(site)}
              className="group relative hidden h-10 w-10 items-center justify-center overflow-hidden border border-line text-ink transition-all duration-300 hover:w-auto lg:flex"
              aria-label={`Appeler ${site.name} au ${site.phone}`}
              title={site.phone}
            >
              <Phone className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap px-0 text-sm opacity-0 transition-all duration-300 group-hover:max-w-[12rem] group-hover:px-2 group-hover:opacity-100">
                {site.phone}
              </span>
            </a>
          )}
          <Link
            to="/contact"
            className="hidden items-center bg-accent px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-accent-foreground transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Demander un devis
          </Link>
          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center border border-line text-ink lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-background lg:hidden">
          <nav className="mx-auto flex max-w-[1400px] flex-col px-5 py-2 lg:px-10">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="border-b border-line py-4 text-sm text-ink-soft"
            >
              Accueil
            </Link>
            <button
              type="button"
              aria-expanded={mobileDrop}
              onClick={() => setMobileDrop((v) => !v)}
              className="flex items-center justify-between border-b border-line py-4 text-sm text-ink-soft"
            >
              Expertises
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${mobileDrop ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {mobileDrop &&
              expertises.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="border-b border-line py-3.5 pl-4 text-sm text-muted-foreground"
                >
                  {item.label}
                </Link>
              ))}
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 text-sm text-ink-soft"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center justify-between border-b border-line py-4 text-sm text-ink-soft">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Horaires
              </span>
              <OpenBadge />
            </div>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-5 mb-4 bg-accent px-5 py-4 text-center text-[11px] uppercase tracking-[0.2em] text-accent-foreground"
            >
              Demander un devis
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
