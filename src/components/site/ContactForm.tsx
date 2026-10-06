import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Clock } from "lucide-react";
import { Section } from "@/components/site/ui";
import { useSite } from "@/cms/context";
import { submitContact } from "@/cms/contact-server";
import { hasPhone, telHref, isOpen } from "@/cms/site-data";

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

const inputClass =
  "w-full border border-line bg-background px-4 py-3.5 text-[15px] text-ink placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none";

/** Formulaire de demande de devis et colonne coordonnées / horaires de la page Contact. */
export function ContactForm({ horairesNote, bonASavoir }: { horairesNote: string; bonASavoir: string[] }) {
  const { general: site, zones: communes } = useSite();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedAt = useRef(Date.now());

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "");
    setSending(true);
    setError(null);
    try {
      const result = await submitContact({
        data: {
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          city: get("city"),
          workType: get("type"),
          message: get("message"),
          website: get("website"),
          elapsedMs: Date.now() - openedAt.current,
        },
      });
      if (result.ok) setSent(true);
      else setError(result.error);
    } catch {
      setError("L'envoi n'a pas abouti. Réessayez ou appelez-nous directement.");
    } finally {
      setSending(false);
    }
  };

  return (
      <Section>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {sent ? (
              <div className="border border-line bg-sand p-10">
                <Check className="h-8 w-8 text-accent" aria-hidden="true" />
                <h2 className="mt-5 text-3xl">Votre demande est envoyée</h2>
                <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted-foreground">
                  Merci ! Nous revenons vers vous rapidement pour organiser une visite sur place.
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="website">Ne pas remplir</label>
                  <input id="website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Nom
                    </label>
                    <input id="name" name="name" required autoComplete="name" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Téléphone
                    </label>
                    <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </label>
                  <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Commune
                    </label>
                    <select id="city" name="city" className={inputClass} defaultValue="">
                      <option value="" disabled>
                        Choisir
                      </option>
                      {communes.map((c) => (
                        <option key={c.slug} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="autre">Autre commune</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="type" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Type de travaux
                    </label>
                    <select id="type" name="type" className={inputClass} defaultValue="">
                      <option value="">À définir ensemble</option>
                      <option value="peinture">Peinture & décoration</option>
                      <option value="sols">Sols & parquets</option>
                      <option value="murs">Murs & revêtements</option>
                      <option value="renovation">Rénovation intérieure</option>
                      <option value="facades">Façades & extérieur</option>
                      <option value="entretien">Entretien & bâti</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Votre projet
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    placeholder="Pièces concernées, état actuel, rendu souhaité, délais éventuels…"
                    className={inputClass}
                  />
                </div>
                {error ? (
                  <p role="alert" className="text-[15px] text-accent">{error}</p>
                ) : null}
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-accent px-8 py-4 text-[11px] uppercase tracking-[0.2em] text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? "Envoi en cours…" : "Envoyer ma demande"}
                </button>
              </form>
            )}
          </div>

          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="border border-line bg-sand p-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Coordonnées
              </p>
              <p className="mt-4 font-display text-2xl">{site.name}</p>
              <p className="mt-2 text-[15px] text-muted-foreground">{site.address}</p>
              <ul className="mt-6 space-y-3 text-[15px]">
                <li>
                  {hasPhone(site) ? (
                    <a href={telHref(site)} className="text-ink underline-offset-4 hover:underline">
                      {site.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">[Téléphone à compléter]</span>
                  )}
                </li>
                <li>
                  {site.email ? (
                    <a href={`mailto:${site.email}`} className="text-ink underline-offset-4 hover:underline">
                      {site.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">[Email à compléter]</span>
                  )}
                </li>
              </ul>
            </div>
            <div className="mt-6 border border-line bg-sand p-8">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Horaires
                </p>
                <OpenBadge />
              </div>
              <div className="mt-4 flex items-start gap-3 text-[15px] text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <p>
                  {site.hours.days}
                  <br />
                  <span className="text-ink">{site.hours.range}</span>
                </p>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                {horairesNote}
              </p>
            </div>
            <div className="mt-6 border border-line p-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Bon à savoir
              </p>
              <ul className="mt-4 space-y-3 text-[15px] text-muted-foreground">
                {bonASavoir.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>
  );
}
