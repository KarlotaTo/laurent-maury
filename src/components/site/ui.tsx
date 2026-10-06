import { Link } from "@tanstack/react-router";
import { ClipboardCheck, Sparkles, UserRoundCheck } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { submitContact } from "@/cms/contact-server";

export function Section({
  children,
  className = "",
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "sand" | "dark";
}) {
  const tones = {
    light: "bg-background text-ink",
    sand: "bg-sand text-ink",
    dark: "bg-primary text-primary-foreground",
  };
  return (
    <section className={`${tones[tone]} ${className}`}>
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`mt-5 max-w-3xl text-4xl leading-[1.08] lg:text-5xl ${className}`}>
      {children}
    </h2>
  );
}

export function Lead({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`max-w-2xl text-[17px] leading-relaxed text-muted-foreground ${className}`}>
      {children}
    </p>
  );
}

export function CtaPair({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        to="/contact"
        className="inline-flex bg-accent px-7 py-4 text-[11px] uppercase tracking-[0.2em] text-accent-foreground transition-opacity hover:opacity-90"
      >
        Demander un devis
      </Link>
      <Link
        to="/contact"
        search={{ intent: "projet" }}
        className={`inline-flex border px-7 py-4 text-[11px] uppercase tracking-[0.2em] transition-colors ${
          tone === "dark"
            ? "border-white/30 text-primary-foreground hover:bg-white/10"
            : "border-primary bg-primary text-primary-foreground hover:bg-ink"
        }`}
      >
        Parler de votre projet
      </Link>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  extra,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  image?: string | undefined;
  imageAlt?: string | undefined;
  extra?: ReactNode;
}) {
  return (
    <section className="border-b border-line bg-background">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pt-16 pb-20 lg:grid-cols-12 lg:px-10 lg:pt-24 lg:pb-28">
        <div className="lg:col-span-7">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-5 text-5xl leading-[1.03] lg:text-7xl">{title}</h1>
          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted-foreground">{intro}</p>
          <div className="mt-10">
            <CtaPair />
          </div>
          {extra}
        </div>
        {image && (
          <div className="lg:col-span-5">
            <img
              src={image}
              alt={imageAlt ?? ""}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export function PrestationList({ items }: { items: { title: string; text: string }[] }) {
  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.title} className="bg-background p-8 lg:p-10">
          <h3 className="text-2xl">{item.title}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{item.text}</p>
        </article>
      ))}
    </div>
  );
}

export function FinalCta({
  title = "Parlons de votre projet",
  text = "Une visite sur place, un échange sur vos attentes, puis un devis détaillé poste par poste.",
}: {
  title?: string;
  text?: string;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedAt] = useState(() => Date.now());

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    setSending(true);
    setError(null);
    try {
      const result = await submitContact({
        data: { name: get("name"), email: get("email"), message: get("message"), website: get("website"), elapsedMs: Date.now() - openedAt },
      });
      if (result.ok) {
        setSent(true);
        form.reset();
      } else setError(result.error);
    } catch {
      setError("L'envoi n'a pas abouti. Réessayez ou appelez-nous directement.");
    } finally {
      setSending(false);
    }
  };

  const reassurances = [
    { icon: UserRoundCheck, label: "Interlocuteur unique" },
    { icon: Sparkles, label: "Chantier soigné" },
    { icon: ClipboardCheck, label: "Devis détaillé" },
  ];

  return (
    <section aria-labelledby="contact-heading">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-5 py-8 sm:grid-cols-3 lg:px-10">
          {reassurances.map(({ icon: Icon, label }) => (
            <div key={label} className="group flex items-center gap-4 sm:justify-center">
              <span className="flex size-11 shrink-0 items-center justify-center border border-primary-foreground/20 transition-colors group-hover:border-primary-foreground/45 group-hover:bg-primary-foreground/10">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="text-[12px] uppercase tracking-[0.16em] text-primary-foreground/90">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-sand text-ink">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 py-20 lg:grid-cols-12 lg:items-center lg:px-10 lg:py-24">
          <div className="lg:col-span-5">
            <p className="eyebrow">Contact</p>
            <h2 id="contact-heading" className="mt-5 text-4xl leading-[1.08] lg:text-6xl">
              {title}
            </h2>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              {text}
            </p>
          </div>

          <form
            onSubmit={(e) => void onSubmit(e)}
            className="grid gap-4 lg:col-span-6 lg:col-start-7 sm:grid-cols-2"
          >
            <label className="sr-only" htmlFor="final-contact-name">
              Nom complet
            </label>
            <input
              id="final-contact-name"
              name="name"
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              placeholder="Nom complet"
              className="min-h-12 w-full border border-line bg-background px-4 text-[15px] text-ink placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <label className="sr-only" htmlFor="final-contact-email">
              Adresse email
            </label>
            <input
              id="final-contact-email"
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              placeholder="Adresse email"
              className="min-h-12 w-full border border-line bg-background px-4 text-[15px] text-ink placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <label className="sr-only" htmlFor="final-contact-message">
              Votre projet
            </label>
            <textarea
              id="final-contact-message"
              name="message"
              required
              maxLength={1200}
              rows={4}
              placeholder="Décrivez brièvement votre projet…"
              className="w-full resize-none border border-line bg-background px-4 py-3 text-[15px] text-ink placeholder:text-muted-foreground/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:col-span-2"
            />

            <div className="sm:col-span-2">
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="final-contact-website">Ne pas remplir</label>
                <input id="final-contact-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="h-auto w-full rounded-none bg-accent px-8 py-4 text-[11px] uppercase tracking-[0.2em] text-accent-foreground shadow-none hover:bg-accent/90"
              >
                {sending ? "Envoi en cours…" : "Envoyer ma demande"}
              </Button>
              {sent && (
                <p className="mt-3 text-sm text-muted-foreground" role="status">
                  Merci, votre demande est envoyée : nous revenons vers vous rapidement.
                </p>
              )}
              {error && (
                <p className="mt-3 text-sm text-accent" role="alert">
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
