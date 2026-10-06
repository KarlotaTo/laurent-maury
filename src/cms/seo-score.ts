import { outlineOf } from "@/cms/outline";
import type { BlockInstance, Page } from "@/cms/types";

/**
 * Score SEO d'une page, sur 100, calculé à partir de son contenu.
 * Barème validé par Charlotte (06/10/2026).
 */

export type SeoCheck = { id: string; label: string; points: number; max: number; ok: boolean; advice: string };
export type SeoScore = { score: number; checks: SeoCheck[]; words: number };

type ScoredPage = { path: string; seo: Page["seo"]; blocks: BlockInstance[] };

/** Minuscules, sans accents ni ponctuation : pour comparer des expressions. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const plain = (text: string) => text.replace(/\*\*|\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
const SKIP_KEYS = new Set(["src", "href", "link", "id", "type", "format", "layout", "kind", "focus", "category"]);

/** Tous les textes visibles d'un ensemble de blocs (hors adresses, identifiants, réglages). */
function texts(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(plain(value));
  else if (Array.isArray(value)) value.forEach((v) => texts(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) if (!SKIP_KEYS.has(k)) texts(v, out);
  }
  return out;
}

function images(value: unknown, out: { src: string; alt: string }[] = []) {
  if (Array.isArray(value)) value.forEach((v) => images(v, out));
  else if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o["src"] === "string" && "alt" in o) out.push({ src: String(o["src"]), alt: String(o["alt"] ?? "") });
    else Object.values(o).forEach((v) => images(v, out));
  }
  return out;
}

function internalLinks(value: unknown, out: Set<string> = new Set()) {
  if (typeof value === "string") {
    for (const m of value.matchAll(/\]\((\/[^)\s]*)\)/g)) out.add(m[1]!);
  } else if (Array.isArray(value)) value.forEach((v) => internalLinks(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if ((k === "href" || k === "link") && typeof v === "string" && v.startsWith("/")) out.add(v);
      else internalLinks(v, out);
    }
  }
  return out;
}

/** Premier paragraphe de la page : introduction du haut de page, sinon premier texte long. */
function firstParagraph(blocks: BlockInstance[]): string {
  for (const b of blocks) {
    if (b.hidden) continue;
    const d = (b.data ?? {}) as Record<string, unknown>;
    for (const key of ["intro", "lead", "text"]) if (typeof d[key] === "string" && String(d[key]).length > 40) return plain(String(d[key]));
    const paragraphs = d["paragraphs"];
    if (Array.isArray(paragraphs) && typeof paragraphs[0] === "string") return plain(paragraphs[0]);
  }
  return "";
}

/** L'expression est-elle présente (tous ses mots significatifs, dans n'importe quel ordre) ? */
export function contains(text: string, keyword: string): boolean {
  const words = normalize(keyword).split(" ").filter((w) => w.length > 2);
  if (!words.length) return false;
  const hay = ` ${normalize(text)} `;
  return words.every((w) => hay.includes(` ${w}`) );
}

export function seoScore(page: ScoredPage, otherPages: ScoredPage[] = []): SeoScore {
  const blocks = page.blocks.filter((b) => !b.hidden);
  const outline = outlineOf(blocks);
  const h1s = outline.filter((h) => h.level === "h1");
  const h2s = outline.filter((h) => h.level === "h2" && h.text);
  const allText = texts(blocks.map((b) => b.data)).join(" ");
  const words = allText.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  const imgs = images(blocks.map((b) => b.data)).filter((i) => i.src);
  const missingAlt = imgs.filter((i) => i.alt.trim().length < 5).length;
  const links = internalLinks(blocks.map((b) => b.data));
  links.delete(page.path);
  const title = page.seo.title ?? "";
  const description = page.seo.description ?? "";
  const keyword = page.seo.focusKeyword?.trim() ?? "";

  const checks: SeoCheck[] = [];
  const add = (id: string, label: string, max: number, points: number, advice: string) =>
    checks.push({ id, label, max, points: Math.round(points), ok: points >= max, advice });

  // 1. Expression clé (25 points, 5 par emplacement)
  if (!keyword) {
    add("keyword", "Expression clé", 25, 0, "Indiquez l'expression que vos clients tapent dans Google (ex. « peintre Bouloc ») dans l'onglet SEO.");
  } else {
    const spots = [
      ["titre Google", contains(title, keyword)],
      ["H1", h1s.some((h) => contains(h.text, keyword))],
      ["description Google", contains(description, keyword)],
      ["premier paragraphe", contains(firstParagraph(blocks), keyword)],
      ["adresse de la page", contains(page.path.replace(/[-/]/g, " "), keyword)],
    ] as const;
    const missing = spots.filter(([, ok]) => !ok).map(([where]) => where);
    add("keyword", "Expression clé bien placée", 25, (spots.length - missing.length) * 5,
      missing.length ? `Absente de : ${missing.join(", ")}.` : "Présente dans le titre, le H1, la description, l'introduction et l'adresse.");
  }

  // 2. Titre Google (15)
  const t = title.length;
  add("title", "Titre Google entre 30 et 60 caractères", 15, t >= 30 && t <= 60 ? 15 : t >= 20 && t <= 70 ? 8 : 0,
    t < 30 ? `Trop court (${t} caractères) : précisez le métier et la ville.` : t > 60 ? `Trop long (${t} caractères) : Google le coupera.` : `${t} caractères.`);

  // 3. Un seul H1 (15)
  add("h1", "Un seul titre principal (H1)", 15, h1s.length === 1 && h1s[0]!.text ? 15 : 0,
    h1s.length === 0 ? "Aucun H1 : ajoutez un bloc « Haut de page »." : h1s.length > 1 ? `${h1s.length} H1 : gardez un seul bloc « Haut de page ».` : h1s[0]!.text ? "Un H1." : "Le H1 est vide.");

  // 4. Description Google (10)
  const d = description.length;
  add("description", "Description Google entre 120 et 160 caractères", 10, d >= 120 && d <= 160 ? 10 : d >= 70 && d <= 200 ? 5 : 0,
    d < 120 ? `Trop courte (${d} caractères) : donnez envie de cliquer.` : d > 160 ? `Trop longue (${d} caractères) : Google la coupera.` : `${d} caractères.`);

  // 5. Descriptions des photos (10)
  add("alt", "Toutes les photos ont une description", 10, imgs.length === 0 ? 10 : ((imgs.length - missingAlt) / imgs.length) * 10,
    missingAlt ? `${missingAlt} photo(s) sans description suffisante (5 caractères minimum).` : imgs.length ? `${imgs.length} photo(s) décrite(s).` : "Aucune photo.");

  // 6. Volume de contenu (10)
  add("words", "Au moins 300 mots", 10, words >= 300 ? 10 : (words / 300) * 10,
    words >= 300 ? `${words} mots.` : `${words} mots : développez votre savoir-faire, vos chantiers, votre secteur.`);

  // 7. Sections H2 (5)
  add("h2", "Au moins 2 sections (H2)", 5, h2s.length >= 2 ? 5 : h2s.length === 1 ? 2 : 0,
    h2s.length >= 2 ? `${h2s.length} sections.` : "Structurez la page en sections avec des titres.");

  // 8. Liens internes (5)
  add("links", "Au moins 2 liens vers d'autres pages du site", 5, links.size >= 2 ? 5 : links.size === 1 ? 2 : 0,
    links.size >= 2 ? `${links.size} liens.` : "Ajoutez des liens vers vos savoir-faire, réalisations ou villes : [texte](/page).");

  // 9. Pas de cannibalisation (5)
  const rival = keyword ? otherPages.find((p) => p.path !== page.path && p.seo.focusKeyword && normalize(p.seo.focusKeyword) === normalize(keyword)) : undefined;
  add("unique", "Expression clé propre à cette page", 5, keyword && !rival ? 5 : 0,
    !keyword ? "Pas d'expression clé." : rival ? `Déjà visée par ${rival.path} : les deux pages se feraient concurrence dans Google.` : "Aucune autre page ne vise cette expression.");

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  return { score: Math.min(100, Math.round(score)), checks, words };
}

export const scoreColor = (score: number) => (score >= 80 ? "vert" : score >= 50 ? "orange" : "rouge");

const STOP = new Set(["d", "l", "de", "du", "des", "la", "le", "les", "un", "une", "et", "en", "pour", "avec", "sur", "au", "aux", "a", "à", "chez", "dans"]);

/** Expression clé suggérée à partir d'un titre (« Rénovation d'une salle de bains à Fronton » → « rénovation salle bains fronton »). */
export function suggestKeyword(title: string): string {
  return title
    .toLowerCase()
    .replace(/[’']/g, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w && !STOP.has(w))
    .slice(0, 5)
    .join(" ");
}
