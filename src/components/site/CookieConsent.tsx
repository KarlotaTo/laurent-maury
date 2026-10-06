import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CONSENT_EVENT, CONSENT_KEY } from "@/components/site/Tracking";

type ConsentChoice = "accepted" | "refused";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(CONSENT_KEY) === null);
    } catch {
      setVisible(true);
    }
  }, []);

  const saveChoice = (choice: ConsentChoice) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // stockage indisponible (navigation privée) : le choix vaut pour la page en cours
    }
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Consentement aux cookies"
      className="fixed inset-x-4 bottom-20 z-[70] mx-auto max-w-3xl border border-primary/15 bg-background shadow-[0_20px_60px_-20px_var(--color-primary)] sm:bottom-6"
    >
      <div className="flex gap-4 p-5 sm:items-center sm:p-6">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center bg-primary text-primary-foreground sm:flex">
          <Cookie className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-medium text-ink">Votre confidentialité</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez accepter ou
            refuser les cookies non essentiels.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Refuser les cookies non essentiels"
          className="absolute right-2 top-2 text-muted-foreground sm:hidden"
          onClick={() => saveChoice("refused")}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="flex border-t border-line">
        <Button
          type="button"
          variant="ghost"
          className="h-12 flex-1 rounded-none border-r border-line text-xs uppercase tracking-[0.14em] text-ink hover:bg-sand hover:text-ink"
          onClick={() => saveChoice("refused")}
        >
          Refuser
        </Button>
        <Button
          type="button"
          className="h-12 flex-1 rounded-none bg-accent text-xs uppercase tracking-[0.14em] text-accent-foreground shadow-none hover:bg-accent/90"
          onClick={() => saveChoice("accepted")}
        >
          Accepter
        </Button>
      </div>
    </aside>
  );
}