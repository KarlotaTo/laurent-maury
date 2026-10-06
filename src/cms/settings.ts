import { z } from "zod";
import * as f from "@/cms/fields";

/**
 * Réglages du site modifiables dans le back-office, avec leurs règles.
 * Chaque réglage est un enregistrement de la table site_settings.
 */
export const SETTINGS_SCHEMAS = {
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
export const SETTING_LABELS: Record<SettingKey, string> = { avis: "Avis clients", faq: "Questions fréquentes" };
