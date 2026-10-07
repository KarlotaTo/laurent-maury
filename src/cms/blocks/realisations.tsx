import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { z } from "zod";
import * as f from "@/cms/fields";
import { defineBlock } from "@/cms/types";
import { BeforeAfterSlider } from "@/components/site/BeforeAfterSlider";
import { ProjectGallery } from "@/components/site/ProjectGallery";
import { Rich } from "@/components/site/Rich";
import { Section, Eyebrow, SectionTitle, CtaPair } from "@/components/site/ui";
import { Button } from "@/components/ui/button";

/** Blocs des pages Réalisations : récits de chantier, avant / après, galeries. */

const linkCls = "text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent";

const paragraphs = (max: number) =>
  f.list(f.rich({ label: "Paragraphe", max: 900, help: "**gras**, *italique*, [texte du lien](/adresse-de-la-page)" }), {
    label: "Paragraphes",
    min: 1,
    max,
    itemLabel: "Paragraphe",
  });

const sizedImage = f.sizedImage({ label: "Photo" });

const beforeAfterSchema = z.object({
  before: f.image({ label: "Photo avant" }),
  after: f.image({ label: "Photo après" }),
  beforeLabel: f.string({ label: "Étiquette avant", max: 20, optional: true }),
  afterLabel: f.string({ label: "Étiquette après", max: 20, optional: true }),
});

function Prose({ children }: { children: ReactNode }) {
  return <div className="space-y-5 text-[17px] leading-relaxed text-muted-foreground">{children}</div>;
}

function Figure({ src, alt, caption, className = "" }: { src: string; alt: string; caption: string; className?: string }) {
  return (
    <figure>
      <img src={src} alt={alt} loading="lazy" className={`w-full object-cover ${className}`} />
      <figcaption className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

const FORMATS = {
  portrait: "aspect-[4/5]",
  vertical: "aspect-[3/4]",
  large: "aspect-[16/9]",
  paysage: "aspect-[4/3] lg:aspect-[16/9]",
} as const;

const figureSchema = z.object({
  image: f.image({ label: "Photo" }),
  caption: f.string({ label: "Légende", max: 120 }),
  format: f.select({
    label: "Format",
    options: [
      { value: "portrait", label: "Portrait" },
      { value: "vertical", label: "Vertical" },
      { value: "large", label: "Large" },
      { value: "paysage", label: "Paysage" },
    ] as const,
  }),
});

/* ---------- Page générale ---------- */

export const heroSplit = defineBlock({
  type: "heroSplit",
  label: "Haut de page avec photo",
  description: "Titre, introduction et boutons à gauche, photo à droite",
  backgrounds: ["light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre principal", max: 120 }),
    intro: f.text({ label: "Introduction", max: 500 }),
    image: f.image({ label: "Photo" }),
  }),
  example: {
    eyebrow: "Réalisations",
    title: "Nos réalisations",
    intro: "Une introduction.",
    image: { src: "/images/hero-interieur.webp", alt: "Description" },
  },
  render: ({ data, ctx }) => (
    <section className="border-b border-line bg-background">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pt-16 pb-20 lg:grid-cols-12 lg:items-center lg:px-10 lg:pt-24 lg:pb-28">
        <div className="lg:col-span-6">
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <h1 className="mt-5 text-5xl leading-[1.05] lg:text-6xl">{data.title}</h1>
          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-muted-foreground">{data.intro}</p>
          <div className="mt-10">
            <CtaPair />
          </div>
        </div>
        <div className="lg:col-span-6">
          <img src={data.image.src} alt={data.image.alt} className="aspect-[4/3] w-full object-cover" />
        </div>
      </div>
    </section>
  ),
});

export const textMedia = defineBlock({
  type: "textMedia",
  label: "Texte et photos",
  description: "Titre et paragraphes, avec 0 à 2 photos légendées à droite, à gauche ou en dessous",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    paragraphs: paragraphs(5),
    layout: f.select({
      label: "Position des photos",
      options: [
        { value: "right", label: "À droite" },
        { value: "left", label: "À gauche" },
        { value: "below", label: "En dessous" },
      ] as const,
    }),
    figures: f.list(figureSchema, { label: "Photos", min: 0, max: 2, itemLabel: "Photo" }),
  }),
  example: { eyebrow: "Surtitre", title: "Un titre", paragraphs: ["Un paragraphe."], layout: "below", figures: [] },
  render: ({ data, background, ctx }) => {
    const text = (
      <>
        <Eyebrow>{data.eyebrow}</Eyebrow>
        <SectionTitle>{data.title}</SectionTitle>
        <div className="mt-8">
          <Prose>
            {data.paragraphs.map((p, i) => (
              <p key={i}>
                <Rich text={p} linkClassName={linkCls} />
              </p>
            ))}
          </Prose>
        </div>
      </>
    );
    const figures = data.figures.map((fig) => (
      <Figure key={fig.image.src} src={fig.image.src} alt={fig.image.alt} caption={fig.caption} className={FORMATS[fig.format]} />
    ));
    const tone = background === "sand" ? "sand" : "light";
    if (data.layout === "below" || data.figures.length === 0) {
      return (
        <Section tone={tone}>
          <div className="max-w-3xl">{text}</div>
          {data.figures.length > 0 ? <div className="mt-14">{figures}</div> : null}
        </Section>
      );
    }
    const media =
      data.figures.length > 1 ? <div className="grid grid-cols-2 gap-4 lg:col-span-6">{figures}</div> : null;
    if (data.layout === "left") {
      return (
        <Section tone={tone}>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {media ?? <div className="order-2 lg:order-1 lg:col-span-6">{figures}</div>}
            <div className="order-1 lg:order-2 lg:col-span-6">{text}</div>
          </div>
        </Section>
      );
    }
    return (
      <Section tone={tone}>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">{text}</div>
          {media ?? <div className="lg:col-span-6">{figures}</div>}
        </div>
      </Section>
    );
  },
});

export const beforeAfterWide = defineBlock({
  type: "beforeAfterWide",
  label: "Avant / après pleine largeur",
  description: "Titre, texte court et grand comparateur avant / après",
  backgrounds: ["sand", "light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    paragraphs: paragraphs(3),
    comparison: beforeAfterSchema,
  }),
  example: {
    eyebrow: "Avant / après",
    title: "Une transformation",
    paragraphs: ["Faites glisser le curseur."],
    comparison: { before: { src: "/images/renovation.webp", alt: "Avant" }, after: { src: "/images/hero-interieur.webp", alt: "Après" } },
  },
  render: ({ data, background, ctx }) => (
    <Section tone={background === "light" ? "light" : "sand"}>
      <div className="max-w-3xl">
        <Eyebrow>{data.eyebrow}</Eyebrow>
        <SectionTitle>{data.title}</SectionTitle>
        <div className="mt-8">
          <Prose>
            {data.paragraphs.map((p, i) => (
              <p key={i}>
                <Rich text={p} linkClassName={linkCls} />
              </p>
            ))}
          </Prose>
        </div>
      </div>
      <div className="mt-12">
        <BeforeAfterSlider
          beforeImage={data.comparison.before.src}
          afterImage={data.comparison.after.src}
          beforeLabel={data.comparison.beforeLabel || "Avant"}
          afterLabel={data.comparison.afterLabel || "Après"}
          beforeAlt={data.comparison.before.alt}
          afterAlt={data.comparison.after.alt}
          frameClassName="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[20/9]"
        />
      </div>
    </Section>
  ),
});

export const zonesLinks = defineBlock({
  type: "zonesLinks",
  label: "Secteur et communes",
  description: "Texte à gauche, liens vers les pages villes à droite",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    paragraphs: paragraphs(3),
  }),
  example: { eyebrow: "Secteur", title: "Où nous intervenons", paragraphs: ["Un paragraphe."] },
  render: ({ data, background, ctx }) => (
    <Section tone={background === "sand" ? "sand" : "light"}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <SectionTitle>{data.title}</SectionTitle>
          <div className="mt-8">
            <Prose>
              {data.paragraphs.map((p, i) => (
                <p key={i}>
                  <Rich text={p} linkClassName={linkCls} />
                </p>
              ))}
            </Prose>
          </div>
        </div>
        <ul className="grid content-start gap-px border border-line bg-line sm:grid-cols-2 lg:col-span-6">
          {ctx.zones.map((z) => (
            <li key={z.slug} className="bg-background">
              <Link
                to="/zones-intervention/$commune"
                params={{ commune: z.slug }}
                className="flex items-center justify-between p-6 transition-colors hover:bg-sand"
              >
                <span className="text-xl">{z.name}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-accent">{z.main ? "Siège" : "Voir →"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  ),
});

export const realisationsDetailed = defineBlock({
  type: "realisationsDetailed",
  label: "Fiches de réalisations",
  description: "Toutes les réalisations publiées, avec photo, résumé et bouton",
  backgrounds: ["sand", "light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
  }),
  example: { eyebrow: "Chantiers", title: "Explorer les réalisations" },
  render: ({ data, background, ctx }) => (
    <Section tone={background === "light" ? "light" : "sand"}>
      <Eyebrow>{data.eyebrow}</Eyebrow>
      <SectionTitle>{data.title}</SectionTitle>
      <div className="mt-14 grid gap-10 md:grid-cols-2">
        {ctx.realisations.map((r) => (
          <article key={r.slug} className="flex flex-col bg-background">
            <img src={r.image.src} alt={r.image.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="flex flex-1 flex-col p-8 lg:p-10">
              <p className="text-xs uppercase tracking-[0.18em] text-accent">{r.type}</p>
              <h3 className="mt-3 text-2xl leading-snug">{r.title}</h3>
              <p className="mt-1 text-sm font-medium text-ink">{r.city}</p>
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-muted-foreground">{r.summary}</p>
              <Link
                to="/realisations/$slug"
                params={{ slug: r.slug }}
                className="mt-8 inline-flex self-start border border-primary px-6 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Voir la réalisation
              </Link>
            </div>
          </article>
        ))}
      </div>
    </Section>
  ),
});

/* ---------- Page d'une réalisation ---------- */

export const projectHero = defineBlock({
  type: "projectHero",
  label: "Haut de page réalisation",
  description: "Retour aux réalisations, titre, introduction et grande photo",
  backgrounds: ["light"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 60 }),
    title: f.string({ label: "Titre principal", max: 120 }),
    intro: f.text({ label: "Introduction", max: 500 }),
    image: sizedImage,
    focus: f.select({
      label: "Cadrage de la photo",
      options: [
        { value: "center", label: "Centré" },
        { value: "upper", label: "Un peu plus haut" },
      ] as const,
    }),
  }),
  example: {
    eyebrow: "Réalisation · Commune",
    title: "Titre de la réalisation",
    intro: "Une introduction.",
    image: { src: "/images/renovation.webp", alt: "Description", width: 1600, height: 1200 },
    focus: "center",
  },
  render: ({ data, ctx }) => (
    <section className="bg-background text-ink">
      <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-10 lg:px-10 lg:pb-16 lg:pt-14">
        <Link to="/realisations" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Toutes les réalisations
        </Link>
        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow">{data.eyebrow}</p>
            <h1 className="mt-5 max-w-5xl text-5xl leading-[1.02] lg:text-7xl">{data.title}</h1>
          </div>
          <p className="text-[17px] leading-relaxed text-muted-foreground lg:col-span-4">{data.intro}</p>
        </div>
        <img
          src={data.image.src}
          alt={data.image.alt}
          width={data.image.width}
          height={data.image.height}
          fetchPriority="high"
          className={`mt-12 aspect-[4/3] w-full object-cover ${data.focus === "upper" ? "object-[50%_40%] " : ""}sm:aspect-[16/10] lg:aspect-[16/8]`}
        />
      </div>
    </section>
  ),
});

export const projectFacts = defineBlock({
  type: "projectFacts",
  label: "Informations du chantier",
  description: "Bandeau : lieu, type de projet, prestations…",
  backgrounds: ["sand"],
  schema: z.object({
    items: f.list(
      z.object({ label: f.string({ label: "Intitulé", max: 30 }), value: f.string({ label: "Valeur", max: 160 }) }),
      { label: "Informations", min: 1, max: 4, itemLabel: "Information" },
    ),
  }),
  example: { items: [{ label: "Lieu", value: "Commune" }] },
  render: ({ data, ctx }) => (
    <section className="border-y border-line bg-sand text-ink">
      <div className="mx-auto grid max-w-[1400px] gap-px bg-line px-5 sm:grid-cols-3 lg:px-10">
        {data.items.map(({ label, value }) => (
          <div key={label} className="bg-sand px-5 py-7 sm:px-8">
            <p className="text-[10px] uppercase tracking-[0.18em] text-accent">{label}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{value}</p>
          </div>
        ))}
      </div>
    </section>
  ),
});

function ProjectSection({ background, children }: { background: "light" | "sand"; children: ReactNode }) {
  return (
    <section className={background === "sand" ? "bg-sand text-ink" : "bg-background text-ink"}>
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-10 lg:py-28">{children}</div>
    </section>
  );
}

export const projectStory = defineBlock({
  type: "projectStory",
  label: "Récit de chantier",
  description: "Titre à gauche, paragraphes à droite, puis avant / après ou galerie facultatifs",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    paragraphs: paragraphs(6),
    comparison: beforeAfterSchema.optional(),
    gallery: f.list(sizedImage, { label: "Galerie", min: 0, max: 12, itemLabel: "Photo" }).optional(),
  }),
  example: { eyebrow: "Le projet", title: "Un titre", paragraphs: ["Un paragraphe."] },
  render: ({ data, background, ctx }) => (
    <ProjectSection background={background === "sand" ? "sand" : "light"}>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">{data.eyebrow}</p>
          <h2 className="mt-5 text-4xl leading-[1.08] lg:text-5xl">{data.title}</h2>
        </div>
        <div className="space-y-5 text-[17px] leading-relaxed text-muted-foreground lg:col-span-6 lg:col-start-7">
          {data.paragraphs.map((p, i) => (
            <p key={i}>
              <Rich text={p} linkClassName={linkCls} />
            </p>
          ))}
        </div>
      </div>
      {data.comparison ? (
        <BeforeAfterSlider
          className="mt-14"
          beforeImage={data.comparison.before.src}
          afterImage={data.comparison.after.src}
          {...(data.comparison.beforeLabel ? { beforeLabel: data.comparison.beforeLabel } : {})}
          {...(data.comparison.afterLabel ? { afterLabel: data.comparison.afterLabel } : {})}
          beforeAlt={data.comparison.before.alt}
          afterAlt={data.comparison.after.alt}
        />
      ) : null}
      {data.gallery && data.gallery.length > 0 ? (
        <div className="mt-14">
          <ProjectGallery images={data.gallery} />
        </div>
      ) : null}
    </ProjectSection>
  ),
});

export const projectGallery = defineBlock({
  type: "projectGallery",
  label: "Galerie photos",
  description: "Titre et galerie de photos qui s'agrandissent au clic",
  backgrounds: ["light", "sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 40 }),
    title: f.string({ label: "Titre", max: 120 }),
    images: f.list(sizedImage, { label: "Photos", min: 1, max: 24, itemLabel: "Photo" }),
  }),
  example: {
    eyebrow: "Galerie",
    title: "En images",
    images: [{ src: "/images/renovation.webp", alt: "Description", width: 1600, height: 1200 }],
  },
  render: ({ data, background, ctx }) => (
    <ProjectSection background={background === "sand" ? "sand" : "light"}>
      <p className="eyebrow">{data.eyebrow}</p>
      <h2 className="mt-5 text-4xl leading-[1.08] lg:text-5xl">{data.title}</h2>
      <div className="mt-12">
        <ProjectGallery images={data.images} />
      </div>
    </ProjectSection>
  ),
});

export const projectCta = defineBlock({
  type: "projectCta",
  label: "Appel à l'action de fin",
  description: "Titre, texte, liens vers les savoir-faire et bouton « Parler de votre projet »",
  backgrounds: ["sand"],
  schema: z.object({
    eyebrow: f.string({ label: "Surtitre", max: 60 }),
    title: f.string({ label: "Titre", max: 120 }),
    paragraphs: paragraphs(3),
    links: f.list(z.object({ href: f.link({ label: "Page" }), label: f.string({ label: "Texte du lien", max: 40 }) }), {
      label: "Liens",
      min: 0,
      max: 4,
      itemLabel: "Lien",
    }),
  }),
  example: { eyebrow: "Votre projet", title: "Un projet similaire ?", paragraphs: ["Un paragraphe."], links: [] },
  render: ({ data, ctx }) => (
    <section className="border-t border-line bg-sand text-ink">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-16 lg:grid-cols-12 lg:items-center lg:px-10 lg:py-20">
        <div className="lg:col-span-8">
          <p className="eyebrow">{data.eyebrow}</p>
          <h2 className="mt-5 text-4xl leading-[1.08] lg:text-5xl">{data.title}</h2>
          {data.paragraphs.map((p, i) => (
            <p key={i} className={`${i === 0 ? "mt-6" : "mt-4"} max-w-3xl text-[17px] leading-relaxed text-muted-foreground`}>
              <Rich text={p} linkClassName={linkCls} />
            </p>
          ))}
          {data.links.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {data.links.map((l) => (
                <Link key={l.href} to={l.href} className="link-underline text-ink">
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="lg:col-span-3 lg:col-start-10 lg:text-right">
          <Button asChild className="h-auto rounded-none bg-primary px-7 py-4 text-[11px] uppercase tracking-[0.2em] text-primary-foreground shadow-none hover:bg-ink">
            <Link to="/contact" search={{ intent: "projet" }}>
              Parler de votre projet
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  ),
});
