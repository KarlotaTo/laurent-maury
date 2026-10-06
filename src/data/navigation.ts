/** Structure de navigation du site (liens fixes, gérés dans le code).
 */
export const expertises = [
  { to: "/peinture-decoration", label: "Peinture & décoration" },
  { to: "/sols-parquets", label: "Sols & parquets" },
  { to: "/murs-revetements", label: "Murs & revêtements" },
  { to: "/renovation-interieure", label: "Rénovation intérieure" },
  { to: "/facades-exterieur", label: "Façades & extérieur" },
  { to: "/entretien-bati", label: "Entretien & bâti" },
] as const;
export const nav = [
  { to: "/realisations", label: "Réalisations" },
  { to: "/entreprise", label: "L'entreprise" },
  { to: "/zones-intervention", label: "Zones d'intervention" },
] as const;
