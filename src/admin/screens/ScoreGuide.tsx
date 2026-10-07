import { Link } from "@tanstack/react-router";
import { SCORE_CRITERIA, SCORE_LIMITS } from "@/cms/seo-score";

/** Page pédagogique : comment le score SEO est calculé, et ce qu'il ne mesure pas. */
export function ScoreGuideScreen() {
  return (
    <section className="space-y-5">
      <p className="text-[13px] text-muted-foreground"><Link to="/admin/configuration" className="text-accent hover:underline">Configuration</Link> › Comprendre le score SEO</p>
      <div className="rounded-2xl border border-line bg-background p-6">
        <h1 className="font-display text-4xl">Comprendre le score SEO</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-soft">
          Chaque page reçoit une note sur 100, calculée en direct pendant que vous écrivez. Elle vérifie les bonnes pratiques que Google
          attend d'une page : un sujet clair, des titres bien structurés, des photos décrites, des liens entre les pages.
          C'est un <strong>garde-fou pour chaque page</strong>, pas une promesse de classement.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-[14px]">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">80 à 100 : page bien construite</span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">50 à 79 : à améliorer</span>
          <span className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-800">moins de 50 : à reprendre</span>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-background p-6">
        <h2 className="font-display text-3xl">Le barème, critère par critère</h2>
        <div className="mt-5 space-y-4">
          {SCORE_CRITERIA.map((c, i) => (
            <article key={c.id} className="rounded-xl border border-line p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-[17px] font-medium">{i + 1}. {c.label}</h3>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-medium text-primary">{c.max} points</span>
              </div>
              <dl className="mt-3 grid gap-3 text-[14px] leading-relaxed [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                <div><dt className="font-medium text-ink">Comment c'est compté</dt><dd className="mt-1 text-ink-soft">{c.rule}</dd></div>
                <div><dt className="font-medium text-ink">Pourquoi c'est important</dt><dd className="mt-1 text-ink-soft">{c.why}</dd></div>
                <div><dt className="font-medium text-ink">Comment bien faire</dt><dd className="mt-1 text-ink-soft">{c.how}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-muted-foreground">Total : {SCORE_CRITERIA.reduce((s, c) => s + c.max, 0)} points. Les pages légales (mentions, charte) ne sont pas notées : elles n'ont pas vocation à se positionner dans Google.</p>
      </div>

      <div className="rounded-2xl border border-line bg-background p-6">
        <h2 className="font-display text-3xl">Ce que le score ne mesure pas</h2>
        <p className="mt-2 max-w-3xl text-[15px] text-ink-soft">Une page à 100 peut être devancée par un concurrent : le classement dépend aussi de ce qui se passe en dehors de la page.</p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {SCORE_LIMITS.map(([title, text]) => (
            <li key={title} className="grid gap-1 py-3.5 text-[14px] sm:grid-cols-[16rem_1fr] sm:gap-6">
              <span className="font-medium text-ink">{title}</span>
              <span className="leading-relaxed text-ink-soft">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-line bg-background p-6">
        <h2 className="font-display text-3xl">Les titres H1, H2, H3</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-soft">
          Dans l'éditeur, chaque champ titre porte son niveau. Le <strong>H1</strong> est le titre principal (un seul par page),
          les <strong>H2</strong> sont les titres de section, les <strong>H3</strong> les titres des éléments d'une section
          (une prestation, un engagement). Ces niveaux sont fixés par chaque bloc pour garantir une structure correcte :
          vous n'avez pas à vous en soucier, il suffit de remplir les titres. L'étoile ★ signale les champs les plus lus par Google.
          L'onglet « SEO et Google » de chaque page montre son plan, tel que Google le lit.
        </p>
      </div>
    </section>
  );
}
