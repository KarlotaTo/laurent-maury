import { Link } from "@tanstack/react-router";
import { Phone, PenLine } from "lucide-react";
import { useSite } from "@/cms/context";
import { hasPhone, telHref } from "@/cms/site-data";

export function MobileCta() {
  const site = useSite().general;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 border-t border-line bg-background/95 backdrop-blur sm:hidden">
      {hasPhone(site) ? (
        <a
          href={telHref(site)}
          className="flex items-center justify-center gap-2 py-4 text-[12px] uppercase tracking-[0.16em] text-ink"
          aria-label={`Appeler ${site.name}`}
        >
          <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
          Appeler
        </a>
      ) : (
        <Link
          to="/contact"
          className="flex items-center justify-center gap-2 py-4 text-[12px] uppercase tracking-[0.16em] text-ink"
        >
          <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
          Nous joindre
        </Link>
      )}
      <Link
        to="/contact"
        className="flex items-center justify-center gap-2 bg-accent py-4 text-[12px] uppercase tracking-[0.16em] text-accent-foreground"
      >
        <PenLine className="h-4 w-4" aria-hidden="true" />
        Devis
      </Link>
    </div>
  );
}
