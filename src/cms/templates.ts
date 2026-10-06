import { z } from "zod";
import * as f from "@/cms/fields";

/**
 * Informations propres à un modèle de page (affichées dans les listes du site),
 * avec leurs champs verrouillés.
 */
export const TEMPLATE_META: Record<string, z.ZodTypeAny> = {
  ville: z.object({
    name: f.string({ label: "Nom de la commune", max: 60, locked: true }),
    hubText: f.text({ label: "Texte court (page Zones d'intervention)", max: 300 }),
    main: f.boolean({ label: "Siège de l'entreprise", locked: true }),
  }),
  realisation: z.object({
    cardTitle: f.string({ label: "Titre court (cartes et listes)", max: 90 }),
    city: f.string({ label: "Commune", max: 60 }),
    type: f.string({ label: "Type de travaux", max: 60 }),
    summary: f.text({ label: "Résumé (cartes)", max: 300 }),
    image: f.image({ label: "Photo de la carte" }),
  }),
};

export const TEMPLATE_LABELS: Record<string, string> = {
  home: "Accueil",
  service: "Savoir-faire",
  free: "Page libre",
  contact: "Contact",
  zonesHub: "Liste des villes",
  ville: "Page ville",
  realisationsHub: "Liste de réalisations",
  realisation: "Réalisation",
  legal: "Page légale",
};
