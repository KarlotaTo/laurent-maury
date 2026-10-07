import { outlineOf } from "@/cms/outline";
import type { BlockInstance, Page } from "@/cms/types";

/**
 * Score SEO d'une page, sur 100, calculé à partir de son contenu.
 * Barème validé par Charlotte (06/10/2026).
 */

/**
 * Barème du score, avec son explication : source unique pour le calcul et pour la page
 * pédagogique du back-office (Configuration › Comprendre le score SEO).
 */
export const SCORE_CRITERIA = [
  {
    id: "keyword",
    label: "Expression clé bien placée",
    max: 25,
    rule: "5 points par emplacement où l'expression apparaît : titre Google, titre principal (H1), description Google, premier paragraphe, adresse de la page.",
    why: "Google vérifie que la page répond clairement à la recherche. Ces cinq emplacements sont ceux qu'il lit en priorité pour comprendre le sujet de la page.",
    how: "Choisissez ce que vos clients tapent vraiment (le métier et la ville, ex. « parquet Bouloc »), puis glissez-la naturellement dans ces emplacements. Les mots de même famille comptent (« peintre » ≈ « peinture ») ; le nom de la commune n'est pas exigé dans l'adresse d'une page qui couvre tout le secteur.",
  },
  {
    id: "title",
    label: "Titre Google entre 30 et 60 caractères",
    max: 15,
    rule: "15 points entre 30 et 60 caractères, 8 points entre 20 et 70, sinon 0.",
    why: "C'est le lien bleu cliquable dans Google : trop court, il ne dit pas assez ; trop long, Google le coupe.",
    how: "Le métier, la ville, puis le nom de l'entreprise : « Parquet massif et pose de sols à Bouloc | Maury Laurent ».",
  },
  {
    id: "h1",
    label: "Un seul titre principal (H1)",
    max: 15,
    rule: "15 points si la page a exactement un H1, non vide.",
    why: "Le H1 annonce le sujet de la page. Zéro ou plusieurs H1 brouillent ce signal.",
    how: "Gardez un seul bloc « Haut de page » par page. Son titre et son début de titre invisible forment le H1.",
  },
  {
    id: "description",
    label: "Description Google entre 120 et 160 caractères",
    max: 10,
    rule: "10 points entre 120 et 160 caractères, 5 points entre 70 et 200, sinon 0.",
    why: "Elle s'affiche sous le titre dans Google. Elle ne fait pas monter la page, mais elle donne envie (ou non) de cliquer.",
    how: "Ce que vous faites, où, et un argument concret (devis gratuit, depuis 1994, un seul interlocuteur).",
  },
  {
    id: "alt",
    label: "Toutes les photos ont une description",
    max: 10,
    rule: "Points proportionnels au nombre de photos décrites (5 caractères minimum).",
    why: "Google ne voit pas les photos : il lit leur description. Elle sert aussi aux personnes malvoyantes et à Google Images.",
    how: "Décrivez ce qu'on voit, avec le lieu si possible : « Salon rénové avec mur graphique noir à Bouloc ».",
  },
  {
    id: "words",
    label: "Au moins 300 mots",
    max: 10,
    rule: "10 points à partir de 300 mots, proportionnel en dessous. Les questions fréquentes affichées sur la page comptent.",
    why: "Une page trop courte répond rarement bien à une question. 300 mots est une convention, pas une loi : la qualité compte plus que la longueur.",
    how: "Expliquez votre façon de travailler, vos chantiers, les questions de vos clients. Évitez le remplissage.",
  },
  {
    id: "h2",
    label: "Au moins 2 sections (H2)",
    max: 5,
    rule: "5 points à partir de 2 titres de section, 2 points pour un seul.",
    why: "Les sections aident Google et les lecteurs à parcourir la page.",
    how: "Les blocs du site créent les H2 tout seuls : chaque bloc avec un titre est une section.",
  },
  {
    id: "links",
    label: "Au moins 2 liens vers d'autres pages du site",
    max: 5,
    rule: "5 points à partir de 2 liens internes différents, 2 points pour un seul.",
    why: "Les liens guident les visiteurs et indiquent à Google quelles pages sont liées et importantes.",
    how: "Dans un paragraphe, écrivez [texte du lien](/adresse-de-la-page), par exemple [nos réalisations](/realisations).",
  },
  {
    id: "unique",
    label: "Expression clé propre à cette page",
    max: 5,
    rule: "5 points si aucune autre page du site ne vise la même expression.",
    why: "Deux pages qui visent la même expression se font concurrence dans Google (on parle de cannibalisation).",
    how: "Une expression par page : « peintre Fronton » pour la page Fronton, « parquet Bouloc » pour la page Sols et parquets.",
  },
] as const;

/** Ce que le score ne mesure pas, et qui compte pourtant pour le classement. */
export const SCORE_LIMITS = [
  ["Le choix des expressions", "Le score vérifie qu'une expression est bien placée, pas qu'elle est réellement recherchée. Validez-les avec Google Keyword Planner, puis Search Console une fois le site en ligne."],
  ["La fiche Google Business Profile", "Pour un artisan local, c'est souvent le premier levier : catégories, photos, horaires, réponses aux avis."],
  ["Les avis clients", "Leur nombre, leur fraîcheur et leur contenu pèsent beaucoup dans le référencement local."],
  ["La notoriété du site", "Les liens venant d'autres sites (annuaires, partenaires, fournisseurs, presse locale)."],
  ["La cohérence des coordonnées", "Même nom, même adresse, même téléphone partout : site, fiche Google, annuaires."],
  ["La vitesse et le mobile", "Mesurés par Google : à vérifier avec PageSpeed Insights une fois le site sur son domaine."],
  ["La concurrence", "Le même score ne donne pas le même classement à Bouloc qu'à Toulouse : tout dépend des autres sites qui visent la même recherche."],
] as const;

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

/** Racine d'un mot : 5 lettres (6 pour les mots longs) — « peintre » ≈ « peinture », mais « intérieure » ≠ « intervention ». */
const stem = (w: string) => (w.length >= 8 ? w.slice(0, 6) : w.length >= 6 ? w.slice(0, 5) : w);

/** Mots significatifs d'une expression (plus de 2 lettres). */
const keywordWords = (keyword: string) => normalize(keyword).split(" ").filter((w) => w.length > 2);

function hasWord(text: string, word: string): boolean {
  return ` ${normalize(text)} `.includes(` ${stem(word)}`);
}

/** L'expression est-elle présente (tous ses mots significatifs, dans n'importe quel ordre, à la racine près) ? */
export function contains(text: string, keyword: string): boolean {
  const words = keywordWords(keyword);
  return words.length > 0 && words.every((w) => hasWord(text, w));
}

/**
 * Adresse de la page : au moins la moitié des mots de l'expression, hors noms de communes
 * (une page qui couvre tout le secteur n'a pas à porter la ville dans son adresse).
 * La page d'accueil en est dispensée.
 */
function pathMatches(path: string, keyword: string, places: string[]): boolean {
  if (path === "/") return true;
  const placeWords = new Set(places.flatMap((p) => keywordWords(p)));
  const words = keywordWords(keyword).filter((w) => !placeWords.has(w));
  const target = path.replace(/[-/]/g, " ");
  if (words.length === 0) return keywordWords(keyword).some((w) => hasWord(target, w));
  const found = words.filter((w) => hasWord(target, w)).length;
  return found >= Math.max(1, Math.ceil(words.length / 2));
}

export type ScoreOptions = {
  /** Noms des communes du site (non exigés dans l'adresse d'une page). */
  places?: string[];
  /** Questions fréquentes du site : comptées dans le texte des pages qui les affichent. */
  faq?: { question: string; answer: string; category?: string | undefined }[];
};

export function seoScore(page: ScoredPage, otherPages: ScoredPage[] = [], options: ScoreOptions = {}): SeoScore {
  const blocks = page.blocks.filter((b) => !b.hidden);
  const outline = outlineOf(blocks);
  const h1s = outline.filter((h) => h.level === "h1");
  const h2s = outline.filter((h) => h.level === "h2" && h.text);
  const faqShown = blocks.some((b) => b.type === "faq") ? (options.faq ?? []).map((q) => `${q.question} ${plain(q.answer)}`) : [];
  const allText = [...texts(blocks.map((b) => b.data)), ...faqShown].join(" ");
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
      ["adresse de la page", pathMatches(page.path, keyword, options.places ?? [])],
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
