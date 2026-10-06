import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, MapPin, Star } from "lucide-react";
import { z } from "zod";
import * as f from "@/cms/fields";
import { defineBlock } from "@/cms/types";
import { Rich } from "@/components/site/Rich";
import { Section, Eyebrow, SectionTitle, Lead, CtaPair, PageHero, PrestationList, FinalCta } from "@/components/site/ui";
import { InterventionMap } from "@/components/site/InterventionMap";
import { site, communes, avis, engagements, expertises, hasPhone, telHref } from "@/data/site";
import { BeforeAfterSlider } from "@/components/site/BeforeAfterSlider";
import { realisations } from "@/data/realisations";
import { zones } from "@/data/zones";
import { ContactForm } from "@/components/site/ContactForm";

/**
 * Bibliothèque de blocs de Maury Laurent.
 * Chaque rendu reprend à l'identique une section dessinée du site : le client
 * ne remplit que des champs, la mise en page reste celle du site.
 */

const titleSeoPrefix = f.string({
  label: "Début du titre lu par Google (invisible à l'écran)",
  max: 80,
  optional: true,
  locked: true,
});

const item = (titleMax: number, textMax: number) =>
  z.object({
    title: f.string({ label: "Titre", max: titleMax }),
    text: f.rich({ label: "Texte", max: textMax }),
  });

/* ---------- Hauts de page ---------- */

export const hero = defineBlock({
  type: "hero",
  label: "Haut de page",
  description: "Surtitre, titre, introduction, boutons de devis et photo",
  backgrounds: ["light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    titleSeoPrefix,
    title: f.string({ label: "Titre principal", max: 90 }),
    intro: f.text({ label: "Introduction", max: 420 }),
    image: f.image({ label: "Photo" }).optional(),
    chantier: f.list(item(40, 220), { label: "« Sur le chantier »", min: 0, max: 4, itemLabel: "Point" }),
  }),
  example: {
    eyebrow: "Savoir-faire",
    titleSeoPrefix: "",
    title: "Titre de la page",
    intro: "Une introduction de deux ou trois phrases qui présente la page.",
    chantier: [],
  },
  render: ({ data }) => (
    <PageHero
      eyebrow={data.eyebrow}
      title={
        <>
          {data.titleSeoPrefix ? <span className="sr-only">{data.titleSeoPrefix} : </span> : null}
          {data.title}
        </>
      }
      intro={data.intro}
      image={data.image?.src}
      imageAlt={data.image?.alt}
      extra={
        data.chantier.length > 0 ? (
          <div className="mt-12 border-t border-line pt-8">
            <p className="eyebrow">Sur le chantier</p>
            <ul className="mt-6 space-y-5">
              {data.chantier.map((point) => (
                <li key={point.title} className="grid gap-1 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <span className="text-[15px] font-medium text-ink">{point.title}</span>
                  <span className="text-[15px] leading-relaxed text-muted-foreground">
                    <Rich text={point.text} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : undefined
      }
    />
  ),
});

export const heroHome = defineBlock({
  type: "heroHome",
  label: "Grand haut de page",
  description: "Titre sur plusieurs lignes, introduction, téléphone et photo pleine largeur",
  backgrounds: ["light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 60 }),
    titleSeoPrefix,
    title: f.rich({ label: "Titre principal", max: 120, help: "Un retour à la ligne = une ligne à l'écran. *mot* = en italique rouge." }),
    intro: f.text({ label: "Introduction", max: 420 }),
    image: f.image({ label: "Grande photo" }),
  }),
  example: {
    eyebrow: "Artisan rénovation",
    titleSeoPrefix: "",
    title: "Un titre,\n*sur deux* lignes",
    intro: "Une introduction de deux ou trois phrases.",
    image: { src: "/images/hero-interieur.jpg", alt: "Description de la photo" },
  },
  render: ({ data }) => (
    <section className="relative">
      <div className="mx-auto max-w-[1400px] px-5 pt-10 lg:px-10 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="fade-up lg:col-span-6">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h1 className="mt-6 text-[3.25rem] leading-[0.98] tracking-tight lg:text-[5.5rem]">
              {data.titleSeoPrefix ? <span className="sr-only">{data.titleSeoPrefix} : </span> : null}
              <Rich text={data.title} emClassName="italic text-accent" />
            </h1>
          </div>
          <div className="lg:col-span-6 lg:pb-3">
            <p className="max-w-xl text-[17px] leading-relaxed text-muted-foreground">{data.intro}</p>
            <div className="mt-8">
              <CtaPair />
            </div>
            {hasPhone() && (
              <a href={telHref()} className="mt-6 inline-block text-sm text-ink">
                ou appelez le <span className="text-accent">{site.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-[1400px] px-5 lg:px-10">
        <img
          src={data.image.src}
          alt={data.image.alt}
          width={1600}
          height={1104}
          className="h-[52vh] w-full object-cover lg:h-[76vh]"
        />
      </div>
    </section>
  ),
});

/* ---------- Textes ---------- */

const pageLink = z.object({
  href: f.link({ label: "Page liée" }),
  label: f.string({ label: "Texte du lien", max: 50 }),
});

export const textTitle = defineBlock({
  type: "textTitle",
  label: "Titre et texte",
  description: "Titre à gauche, un ou deux paragraphes à droite, lien facultatif",
  backgrounds: ["light", "sand", "dark"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.rich({ label: "Titre", max: 160 }),
    lead: f.rich({ label: "Paragraphe principal", max: 700 }),
    text: f.rich({ label: "Second paragraphe", max: 700, optional: true }),
    link: pageLink.optional(),
  }),
  example: {
    eyebrow: "Surtitre",
    title: "Un titre qui pose une question ?",
    lead: "Le paragraphe principal répond à la question.",
    text: "",
  },
  render: ({ data, background }) =>
    background === "dark" ? (
      <Section tone="dark">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="eyebrow text-primary-foreground/60">{data.eyebrow}</p>
            <h2 className="mt-5 text-4xl leading-[1.06] lg:text-6xl">
              <Rich text={data.title} />
            </h2>
          </div>
          <div className="lg:col-span-6">
            <p className="text-[17px] leading-relaxed text-primary-foreground/70">
              <Rich text={data.lead} />
            </p>
            {data.text ? (
              <p className="mt-6 text-[17px] leading-relaxed text-primary-foreground/70">
                <Rich text={data.text} />
              </p>
            ) : null}
          </div>
        </div>
      </Section>
    ) : (
      <Section tone={background}>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <SectionTitle>
              <Rich text={data.title} />
            </SectionTitle>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Lead>
              <Rich text={data.lead} />
            </Lead>
            {data.text ? (
              <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
                <Rich text={data.text} />
              </p>
            ) : null}
            {data.link ? (
              <Link
                to={data.link.href}
                className="link-underline mt-8 inline-block text-sm uppercase tracking-[0.18em] text-ink"
              >
                {data.link.label}
              </Link>
            ) : null}
          </div>
        </div>
      </Section>
    ),
});

export const feature = defineBlock({
  type: "feature",
  label: "Mise en avant",
  description: "Bloc sombre : titre, texte, étapes numérotées, lien et photo",
  backgrounds: ["dark"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.rich({ label: "Titre", max: 120 }),
    text: f.rich({ label: "Texte", max: 500 }),
    steps: f.list(f.string({ label: "Étape", max: 60 }), { label: "Étapes numérotées", min: 0, max: 7, itemLabel: "Étape" }),
    link: pageLink.optional(),
    image: f.image({ label: "Photo" }),
  }),
  example: {
    eyebrow: "Surtitre",
    title: "Un titre fort",
    text: "Un texte court qui développe le titre.",
    steps: ["Première étape", "Deuxième étape", "Troisième étape"],
    image: { src: "/images/atelier.jpg", alt: "Description de la photo" },
  },
  render: ({ data }) => (
    <Section tone="dark">
      <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <p className="eyebrow text-primary-foreground/60">{data.eyebrow}</p>
          <h2 className="mt-5 text-4xl leading-[1.06] lg:text-6xl">
            <Rich text={data.title} />
          </h2>
          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-primary-foreground/70">
            <Rich text={data.text} />
          </p>
          {data.steps.length > 0 ? (
            <ul className="mt-10 space-y-4 border-t border-white/15 pt-8 text-[15px] text-primary-foreground/80">
              {data.steps.map((s, i) => (
                <li key={s} className="flex gap-5">
                  <span className="text-[oklch(0.72_0.12_25)] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
          {data.link ? (
            <div className="mt-10">
              <Link to={data.link.href} className="link-underline text-sm uppercase tracking-[0.18em]">
                {data.link.label}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="lg:col-span-6">
          <img
            src={data.image.src}
            alt={data.image.alt}
            loading="lazy"
            width={1408}
            height={1008}
            className="w-full object-cover"
          />
        </div>
      </div>
    </Section>
  ),
});

/* ---------- Listes ---------- */

export const prestations = defineBlock({
  type: "prestations",
  label: "Prestations",
  description: "Liste de prestations en cartes titre et texte",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    items: f.list(
      z.object({ title: f.string({ label: "Titre", max: 50 }), text: f.text({ label: "Texte", max: 450 }) }),
      { label: "Prestations", min: 2, max: 8, itemLabel: "Prestation" },
    ),
  }),
  example: {
    eyebrow: "Prestations",
    title: "Nos prestations",
    items: [
      { title: "Première prestation", text: "Description de la prestation." },
      { title: "Deuxième prestation", text: "Description de la prestation." },
    ],
  },
  render: ({ data, background }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <SectionTitle>{data.title}</SectionTitle>
      <div className="mt-14">
        <PrestationList items={data.items} />
      </div>
    </Section>
  ),
});

export const engagementsGrid = defineBlock({
  type: "engagements",
  label: "Engagements",
  description: "Grille de 3 à 9 engagements avec trait rouge",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    items: f.list(
      z.object({ title: f.string({ label: "Titre", max: 50 }), text: f.text({ label: "Texte", max: 260 }) }),
      { label: "Engagements", min: 3, max: 9, itemLabel: "Engagement" },
    ),
  }),
  example: {
    eyebrow: "Engagements",
    title: "Ce sur quoi vous pouvez compter",
    items: [
      { title: "Premier engagement", text: "Description." },
      { title: "Deuxième engagement", text: "Description." },
      { title: "Troisième engagement", text: "Description." },
    ],
  },
  render: ({ data, background }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <SectionTitle>{data.title}</SectionTitle>
      <div className="mt-14 grid gap-px border border-line bg-line md:grid-cols-3">
        {data.items.map((e) => (
          <article key={e.title} className="bg-background p-8 lg:p-10">
            <h3 className="rule-accent text-2xl">{e.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{e.text}</p>
          </article>
        ))}
      </div>
    </Section>
  ),
});

export const steps = defineBlock({
  type: "steps",
  label: "Étapes numérotées",
  description: "Titre à gauche, étapes numérotées à droite",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    items: f.list(
      z.object({ title: f.string({ label: "Étape", max: 50 }), text: f.string({ label: "Détail", max: 200 }) }),
      { label: "Étapes", min: 3, max: 7, itemLabel: "Étape" },
    ),
  }),
  example: {
    eyebrow: "Méthode",
    title: "Comment se déroule un chantier ?",
    items: [
      { title: "Visite", text: "Détail de l'étape." },
      { title: "Devis", text: "Détail de l'étape." },
      { title: "Chantier", text: "Détail de l'étape." },
    ],
  },
  render: ({ data, background }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <SectionTitle>{data.title}</SectionTitle>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ol className="divide-y divide-line border-y border-line">
            {data.items.map(({ title, text }, i) => (
              <li key={title} className="flex gap-6 py-5">
                <span className="font-display text-2xl text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium text-ink">{title}</p>
                  <p className="mt-1 text-[15px] text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  ),
});

export const serviceCards = defineBlock({
  type: "serviceCards",
  label: "Cartes savoir-faire",
  description: "Grille de cartes avec photo, chacune menant à une page",
  backgrounds: ["sand", "light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    items: f.list(
      z.object({
        link: f.link({ label: "Page liée" }),
        label: f.string({ label: "Titre", max: 40 }),
        text: f.string({ label: "Texte", max: 120 }),
        image: f.image({ label: "Photo" }),
      }),
      { label: "Cartes", min: 3, max: 9, itemLabel: "Carte" },
    ),
  }),
  example: {
    eyebrow: "Savoir-faire",
    title: "Nos savoir-faire",
    items: [1, 2, 3].map((n) => ({
      link: "/",
      label: `Savoir-faire ${n}`,
      text: "Une phrase de présentation.",
      image: { src: "/images/parquet.jpg", alt: "Description de la photo" },
    })),
  },
  render: ({ data, background }) => (
    <Section tone={background === "light" ? "light" : "sand"}>
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <SectionTitle>{data.title}</SectionTitle>
      <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((e) => (
          <Link key={e.link} to={e.link} className="group block">
            <div className="overflow-hidden">
              <img
                src={e.image.src}
                alt={e.image.alt}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <h3 className="mt-6 flex items-center gap-2 text-2xl">
              {e.label}
              <ArrowUpRight className="h-4 w-4 text-accent opacity-0 transition-opacity group-hover:opacity-100" />
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{e.text}</p>
          </Link>
        ))}
      </div>
    </Section>
  ),
});

/* ---------- Blocs alimentés automatiquement ---------- */

export const realisationsList = defineBlock({
  type: "realisationsList",
  label: "Liste de réalisations",
  description: "Les réalisations publiées, en cartes",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    linkLabel: f.string({ label: "Texte du lien « toutes les réalisations »", max: 50 }),
    limit: f.number({ label: "Nombre de réalisations affichées", min: 2, max: 12 }),
  }),
  example: { eyebrow: "Réalisations", title: "Nos réalisations", linkLabel: "Toutes les réalisations", limit: 6 },
  render: ({ data, background }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <SectionTitle>{data.title}</SectionTitle>
        </div>
        <Link to="/realisations" className="link-underline text-sm uppercase tracking-[0.18em] text-ink">
          {data.linkLabel}
        </Link>
      </div>
      <div className="mt-14 grid gap-px border border-line bg-line md:grid-cols-2">
        {realisations.slice(0, data.limit).map((r) => (
          <Link
            key={r.slug}
            to="/realisations/$slug"
            params={{ slug: r.slug }}
            className="group bg-background p-8 transition-colors hover:bg-sand lg:p-10"
          >
            {r.images[0] ? (
              <div className="overflow-hidden">
                <img
                  src={r.images[0].src}
                  alt={r.images[0].alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            ) : null}
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-accent">{r.type}</p>
            <h3 className="mt-3 text-2xl leading-snug">{r.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{r.city}</p>
          </Link>
        ))}
      </div>
    </Section>
  ),
});

export const reviews = defineBlock({
  type: "reviews",
  label: "Avis clients",
  description: "Les avis de la liste « Avis clients »",
  backgrounds: ["sand", "light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    note: f.string({ label: "Mention à droite", max: 40 }),
  }),
  example: { eyebrow: "Avis clients", title: "La parole de nos clients", note: "Avis Google" },
  render: ({ data, background }) => (
    <Section tone={background === "light" ? "light" : "sand"}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <SectionTitle>{data.title}</SectionTitle>
        </div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{data.note}</p>
      </div>
      <div className="mt-14 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
        {avis.map((a) => (
          <figure key={a.author} className="flex flex-col bg-background p-8 lg:p-10">
            <div className="flex items-center gap-1 text-accent" aria-label={`${a.rating} étoiles sur 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4" fill={i < a.rating ? "currentColor" : "none"} strokeWidth={1.5} />
              ))}
            </div>
            <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-muted-foreground">
              «&nbsp;{a.text}&nbsp;»
            </blockquote>
            <figcaption className="mt-6 border-t border-line pt-4">
              <p className="font-display text-lg">{a.author}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Avis Google · {a.date}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  ),
});

export const communesSummary = defineBlock({
  type: "communesSummary",
  label: "Communes (résumé)",
  description: "Texte à gauche, liste des communes à droite",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    lead: f.text({ label: "Texte", max: 400 }),
    linkLabel: f.string({ label: "Texte du lien", max: 50 }),
  }),
  example: { eyebrow: "Zones d'intervention", title: "Où nous intervenons", lead: "Un texte court.", linkLabel: "Voir toutes les communes" },
  render: ({ data, background }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <SectionTitle>{data.title}</SectionTitle>
          <Lead className="mt-6">{data.lead}</Lead>
          <Link
            to="/zones-intervention"
            className="link-underline mt-8 inline-block text-sm uppercase tracking-[0.18em] text-ink"
          >
            {data.linkLabel}
          </Link>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {communes.map((c) => (
              <li
                key={c.slug}
                className="group flex items-center gap-4 bg-background p-5 transition-colors last:sm:col-span-2 hover:bg-sand"
              >
                <span className="flex size-10 shrink-0 items-center justify-center border border-line text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-primary-foreground">
                  <MapPin className="size-4" strokeWidth={1.5} />
                </span>
                <p className="font-display text-2xl">{c.name}</p>
                {c.main && (
                  <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-accent">Siège de l'entreprise</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  ),
});

export const communesGrid = defineBlock({
  type: "communesGrid",
  label: "Communes et carte",
  description: "Toutes les pages villes en cartes, avec la carte d'intervention",
  backgrounds: ["light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
  }),
  example: { eyebrow: "Communes", title: "Où nous travaillons" },
  render: ({ data }) => (
    <Section>
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <SectionTitle>{data.title}</SectionTitle>
      <div className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {communes.map((c) => (
          <Link
            key={c.slug}
            to="/zones-intervention/$commune"
            params={{ commune: c.slug }}
            className="group flex flex-col gap-4 bg-background p-7 transition-colors hover:bg-sand lg:last:col-span-3"
          >
            <div className="flex items-center gap-5">
              <span className="flex size-12 shrink-0 items-center justify-center border border-line text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-primary-foreground">
                <MapPin className="size-5" strokeWidth={1.5} />
              </span>
              <h3 className="text-2xl">{c.name}</h3>
              {c.main && (
                <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-accent">Siège de l'entreprise</span>
              )}
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {zones.find((z) => z.slug === c.slug)?.hubText}
            </p>
            <span className="text-[11px] uppercase tracking-[0.18em] text-accent">Voir la page {c.name} →</span>
          </Link>
        ))}
      </div>
      <InterventionMap />
    </Section>
  ),
});

/* ---------- Contact ---------- */

export const contactCta = defineBlock({
  type: "contactCta",
  label: "Bloc contact",
  description: "Arguments, titre, texte et formulaire de demande de devis",
  backgrounds: ["sand"],
  schema: z.object({
    title: f.string({ label: "Titre", max: 80 }),
    text: f.text({ label: "Texte", max: 320 }),
  }),
  example: { title: "Parlons de votre projet", text: "Une visite sur place, puis un devis détaillé." },
  render: ({ data }) => <FinalCta title={data.title} text={data.text} />,
});

export const contactForm = defineBlock({
  type: "contactForm",
  label: "Formulaire de contact",
  description: "Formulaire de demande de devis, coordonnées et horaires",
  backgrounds: ["light"],
  schema: z.object({
    horairesNote: f.text({ label: "Note sous les horaires", max: 240 }),
    bonASavoir: f.list(f.string({ label: "Point", max: 80 }), { label: "« Bon à savoir »", min: 1, max: 5, itemLabel: "Point" }),
  }),
  example: { horairesNote: "Nous vous rappelons pendant les heures d'ouverture.", bonASavoir: ["Visite sur place avant tout devis"] },
  render: ({ data }) => <ContactForm horairesNote={data.horairesNote} bonASavoir={data.bonASavoir} />,
});

/* ---------- Pages villes ---------- */

export const zoneHero = defineBlock({
  type: "zoneHero",
  label: "Haut de page ville",
  description: "Fil d'Ariane, titre, introduction, boutons devis et réalisations, photo verticale",
  backgrounds: ["light"],
  schema: z.object({
    parentLabel: f.string({ label: "Libellé du fil d'Ariane (page parente)", max: 40, locked: true }),
    name: f.string({ label: "Nom de la commune", max: 40, locked: true }),
    eyebrow: f.string({ label: "Surtitre", max: 60 }),
    title: f.string({ label: "Titre principal", max: 90 }),
    intro: f.text({ label: "Introduction", max: 420 }),
    image: f.image({ label: "Photo" }),
  }),
  example: {
    parentLabel: "Zones d'intervention",
    name: "Commune",
    eyebrow: "Artisan rénovation · Commune",
    title: "Entreprise de rénovation à Commune",
    intro: "Une introduction de deux ou trois phrases sur la commune.",
    image: { src: "/images/renovation.jpg", alt: "Description de la photo" },
  },
  render: ({ data }) => (
    <section className="border-b border-line bg-background">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pt-16 pb-20 lg:grid-cols-12 lg:px-10 lg:pt-24 lg:pb-28">
        <div className="lg:col-span-7">
          <nav aria-label="Fil d'Ariane" className="mb-6 text-xs text-muted-foreground">
            <Link to="/zones-intervention" className="hover:text-accent">{data.parentLabel}</Link>
            <span className="mx-2">/</span>
            <span>{data.name}</span>
          </nav>
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <h1 className="mt-5 text-5xl leading-[1.03] lg:text-7xl">{data.title}</h1>
          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted-foreground">{data.intro}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/contact" className="inline-flex bg-accent px-7 py-4 text-[11px] uppercase tracking-[0.2em] text-accent-foreground hover:opacity-90">
              Demander un devis
            </Link>
            <Link to="/realisations" className="inline-flex border border-primary bg-primary px-7 py-4 text-[11px] uppercase tracking-[0.2em] text-primary-foreground hover:bg-ink">
              Voir les réalisations
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5">
          <img src={data.image.src} alt={data.image.alt} fetchPriority="high" className="aspect-[4/5] h-full w-full object-cover" />
        </div>
      </div>
    </section>
  ),
});

export const localIntro = defineBlock({
  type: "localIntro",
  label: "Texte local et projets",
  description: "Titre, paragraphes, puis 0 à 6 projets numérotés",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    paragraphs: f.list(f.text({ label: "Paragraphe", max: 700 }), { label: "Paragraphes", min: 1, max: 5, itemLabel: "Paragraphe" }),
    projects: f.list(
      z.object({ title: f.string({ label: "Titre", max: 50 }), text: f.text({ label: "Texte", max: 260 }) }),
      { label: "Projets types", min: 0, max: 6, itemLabel: "Projet" },
    ),
  }),
  example: { eyebrow: "Commune", title: "Un titre local", paragraphs: ["Un paragraphe."], projects: [] },
  render: ({ data, background }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <SectionTitle>{data.title}</SectionTitle>
        </div>
        <div className="space-y-6 lg:col-span-6 lg:col-start-7">
          {data.paragraphs.map((p) => (
            <Lead key={p.slice(0, 20)}>{p}</Lead>
          ))}
        </div>
      </div>
      {data.projects.length > 0 ? (
        <div className="mt-14 grid gap-px border border-line bg-line md:grid-cols-3">
          {data.projects.map((p, i) => (
            <article key={p.title} className="bg-background p-8">
              <span className="text-sm text-accent">0{i + 1}</span>
              <h3 className="mt-3 text-2xl">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{p.text}</p>
            </article>
          ))}
        </div>
      ) : null}
    </Section>
  ),
});

export const linkedServices = defineBlock({
  type: "linkedServices",
  label: "Savoir-faire liés",
  description: "Cartes vers les pages savoir-faire, avec un texte propre à la page",
  backgrounds: ["sand", "light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    items: f.list(
      z.object({
        link: f.link({ label: "Page savoir-faire" }),
        label: f.string({ label: "Titre", max: 40 }),
        text: f.text({ label: "Texte", max: 260 }),
        image: f.image({ label: "Photo" }),
      }),
      { label: "Savoir-faire", min: 1, max: 9, itemLabel: "Savoir-faire" },
    ),
  }),
  example: {
    eyebrow: "Savoir-faire",
    title: "Les travaux réalisés",
    items: [{ link: "/peinture-decoration", label: "Peinture & décoration", text: "Un texte.", image: { src: "/images/peinture-decorative.jpg", alt: "Description" } }],
  },
  render: ({ data, background }) => (
    <Section tone={background === "light" ? "light" : "sand"}>
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <SectionTitle>{data.title}</SectionTitle>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((e) => (
          <Link key={e.link} to={e.link} className="group flex flex-col border border-line bg-background">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={e.image.src} alt={e.image.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="text-2xl">{e.label}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted-foreground">{e.text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent">
                Découvrir <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  ),
});

const photo = f.image({ label: "Photo" });

export const showcase = defineBlock({
  type: "showcase",
  label: "Réalisation en avant / après",
  description: "Texte et lien à gauche, comparateur avant / après et photo à droite",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 60 }),
    title: f.string({ label: "Titre", max: 120 }),
    lead: f.text({ label: "Texte", max: 500 }),
    link: z.object({ href: f.link({ label: "Réalisation liée" }), label: f.string({ label: "Texte du bouton", max: 40 }) }),
    before: photo,
    after: photo,
    beforeLabel: f.string({ label: "Étiquette avant", max: 20 }),
    afterLabel: f.string({ label: "Étiquette après", max: 20 }),
    extra: f.image({ label: "Photo complémentaire" }).optional(),
  }),
  example: {
    eyebrow: "Réalisation",
    title: "Une rénovation en images",
    lead: "Un texte court.",
    link: { href: "/realisations", label: "Voir la réalisation" },
    before: { src: "/images/renovation.jpg", alt: "Avant" },
    after: { src: "/images/hero-interieur.jpg", alt: "Après" },
    beforeLabel: "Avant",
    afterLabel: "Après",
  },
  render: ({ data, background }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <SectionTitle>{data.title}</SectionTitle>
          <Lead className="mt-6">{data.lead}</Lead>
          <Link to={data.link.href} className="mt-8 inline-flex items-center gap-2 bg-primary px-7 py-4 text-[11px] uppercase tracking-[0.2em] text-primary-foreground hover:bg-ink">
            {data.link.label} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="lg:col-span-7">
          <BeforeAfterSlider
            beforeImage={data.before.src}
            afterImage={data.after.src}
            beforeLabel={data.beforeLabel}
            afterLabel={data.afterLabel}
            beforeAlt={data.before.alt}
            afterAlt={data.after.alt}
          />
          {data.extra ? (
            <img src={data.extra.src} alt={data.extra.alt} loading="lazy" className="mt-6 aspect-[16/9] w-full object-cover" />
          ) : null}
        </div>
      </div>
    </Section>
  ),
});

export const stepsBand = defineBlock({
  type: "stepsBand",
  label: "Étapes en bandeau",
  description: "Bloc sombre : titre, texte et étapes côte à côte",
  backgrounds: ["dark"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    text: f.text({ label: "Texte", max: 500 }),
    items: f.list(
      z.object({ title: f.string({ label: "Étape", max: 40 }), text: f.text({ label: "Détail", max: 200 }) }),
      { label: "Étapes", min: 3, max: 6, itemLabel: "Étape" },
    ),
  }),
  example: {
    eyebrow: "Un seul interlocuteur",
    title: "Une rénovation suivie de A à Z",
    text: "Un texte court.",
    items: [
      { title: "Visite", text: "Détail." },
      { title: "Devis", text: "Détail." },
      { title: "Chantier", text: "Détail." },
    ],
  },
  render: ({ data }) => (
    <Section tone="dark">
      <p className="eyebrow">{data.eyebrow}</p>
      <h2 className="mt-5 max-w-3xl text-4xl leading-[1.08] lg:text-5xl">{data.title}</h2>
      <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-primary-foreground/80">{data.text}</p>
      <ol className="mt-14 grid gap-px bg-primary-foreground/15 sm:grid-cols-2 lg:grid-cols-5">
        {data.items.map((step, i) => (
          <li key={step.title} className="bg-primary p-7">
            <span className="text-sm text-primary-foreground/60">Étape {i + 1}</span>
            <h3 className="mt-3 text-xl">{step.title}</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-primary-foreground/75">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  ),
});

export const sharedEngagements = defineBlock({
  type: "sharedEngagements",
  label: "Engagements de l'entreprise",
  description: "Les engagements communs à tout le site (réglage « Engagements »), avec liens utiles",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    showLinks: f.boolean({ label: "Afficher les liens vers l'entreprise, les réalisations et les zones" }),
  }),
  example: { eyebrow: "Pourquoi nous ?", title: "Les engagements de l'entreprise", showLinks: true },
  render: ({ data, background }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <SectionTitle>{data.title}</SectionTitle>
      <div className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {engagements.map((e) => (
          <article key={e.title} className="bg-background p-8">
            <h3 className="text-2xl">{e.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{e.text}</p>
          </article>
        ))}
      </div>
      {data.showLinks ? (
        <p className="mt-10 text-[15px] text-muted-foreground">
          En savoir plus sur <Link to="/entreprise" className="text-accent underline">l'entreprise</Link>, ses{" "}
          <Link to="/realisations" className="text-accent underline">réalisations</Link> et l'ensemble des{" "}
          <Link to="/zones-intervention" className="text-accent underline">zones d'intervention</Link>.
        </p>
      ) : null}
    </Section>
  ),
});

export const neighbours = defineBlock({
  type: "neighbours",
  label: "Communes voisines",
  description: "Liens vers les pages des communes voisines et vers les savoir-faire",
  backgrounds: ["sand", "light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    communes: f.list(f.string({ label: "Commune", max: 60 }), {
      label: "Communes voisines",
      min: 1,
      max: 9,
      itemLabel: "Commune",
      locked: true,
    }),
  }),
  example: { eyebrow: "Secteur", title: "Interventions dans les communes voisines", communes: ["bouloc"] },
  render: ({ data, background }) => (
    <Section tone={background === "light" ? "light" : "sand"}>
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <SectionTitle>{data.title}</SectionTitle>
      <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-3">
        {data.communes.map((slug) => {
          const zone = zones.find((x) => x.slug === slug);
          if (!zone) return null;
          return (
            <Link key={slug} to="/zones-intervention/$commune" params={{ commune: slug }} className="group flex items-center gap-4 bg-background p-6 hover:bg-sand">
              <MapPin className="size-5 text-accent" strokeWidth={1.5} />
              <span className="text-xl">{zone.h1}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13px] uppercase tracking-[0.14em]">
        {expertises.map((e) => (
          <Link key={e.to} to={e.to} className="text-muted-foreground hover:text-accent">{e.label}</Link>
        ))}
      </div>
    </Section>
  ),
});
