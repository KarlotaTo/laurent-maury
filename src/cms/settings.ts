import { z } from "zod";
import * as f from "@/cms/fields";

/**
 * Réglages du site modifiables dans le back-office, avec leurs règles.
 * Chaque réglage est un enregistrement de la table site_settings.
 */
export const TRACKING_PATTERNS = {
  gtm: /^GTM-[A-Z0-9]{4,10}$/,
  ga4: /^G-[A-Z0-9]{4,15}$/,
  clarity: /^[a-z0-9]{6,15}$/,
  googleVerification: /^[A-Za-z0-9_-]{20,100}$/,
  bingVerification: /^[A-Fa-f0-9]{32}$/,
} as const;

export const SETTINGS_SCHEMAS = {
  general: z.object({
    name: f.string({ label: "Nom de l'entreprise", max: 80, locked: true }),
    baseline: f.string({ label: "Activité (sous le nom)", max: 80 }),
    description: f.text({ label: "Présentation pour Google (fiche entreprise)", max: 300 }),
    phone: f.string({ label: "Téléphone", max: 20 }),
    email: f.string({ label: "E-mail", max: 120 }),
    address: f.string({ label: "Adresse courte (pied de page, contact)", max: 120 }),
    streetAddress: f.string({ label: "Rue", max: 120 }),
    postalCode: f.string({ label: "Code postal", max: 10 }),
    city: f.string({ label: "Ville", max: 60 }),
    region: f.string({ label: "Département ou région", max: 60 }),
    since: f.number({ label: "Année de création", min: 1800, max: 2100 }),
    hours: z.object({
      days: f.string({ label: "Jours d'ouverture (affichés)", max: 60 }),
      range: f.string({ label: "Horaires (affichés)", max: 60 }),
      openHour: f.number({ label: "Heure d'ouverture (badge « Ouvert »)", min: 0, max: 23 }),
      closeHour: f.number({ label: "Heure de fermeture (badge « Ouvert »)", min: 1, max: 24 }),
    }),
    footerText: f.text({ label: "Texte du pied de page", max: 400 }),
  }),
  tracking: z.object({
    gtm: f.identifier({ label: "Google Tag Manager (conteneur)", pattern: TRACKING_PATTERNS.gtm, example: "GTM-ABC1234" }),
    ga4: f.identifier({ label: "Google Analytics 4 (ID de mesure)", pattern: TRACKING_PATTERNS.ga4, example: "G-ABC123DEF4", help: "Inutile si GA4 est déjà configuré dans Tag Manager. Exemple : G-ABC123DEF4" }),
    clarity: f.identifier({ label: "Microsoft Clarity (ID du projet)", pattern: TRACKING_PATTERNS.clarity, example: "abc123def4" }),
    googleVerification: f.identifier({ label: "Google Search Console (code de validation)", pattern: TRACKING_PATTERNS.googleVerification, example: "le contenu de la balise google-site-verification", help: "Dans Search Console : Ajouter une propriété › Préfixe d'URL › Balise HTML, puis copiez uniquement la valeur de content=\"…\"." }),
    bingVerification: f.identifier({ label: "Bing Webmaster Tools (code de validation)", pattern: TRACKING_PATTERNS.bingVerification, example: "32 caractères (balise msvalidate.01)" }),
  }),
  avis: z.object({
    avis: f.list(
      z.object({
        author: f.string({ label: "Nom du client", max: 80 }),
        rating: f.number({ label: "Note sur 5", min: 1, max: 5 }),
        date: f.string({ label: "Date (ex. il y a 3 mois)", max: 40 }),
        text: f.text({ label: "Avis", max: 1200 }),
      }),
      { label: "Avis clients", min: 0, max: 60, itemLabel: "Avis" },
    ),
  }),
  faq: z.object({
    items: f.list(
      z.object({
        question: f.string({ label: "Question", max: 160 }),
        answer: f.rich({ label: "Réponse", max: 1500, help: "**gras**, *italique*, [lien](/page-du-site), retour à la ligne" }),
        category: f.string({ label: "Thème (facultatif, ex. Peinture, Devis)", max: 40, optional: true }),
      }),
      { label: "Questions fréquentes", min: 0, max: 100, itemLabel: "Question" },
    ),
  }),
} as const;

export type SettingKey = keyof typeof SETTINGS_SCHEMAS;
export const SETTING_LABELS: Record<SettingKey, string> = {
  avis: "Avis clients",
  faq: "Questions fréquentes",
  general: "Coordonnées et horaires",
  tracking: "Outils d'analyse et de suivi",
};
