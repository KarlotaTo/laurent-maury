import { useEffect, useState } from "react";
import { FieldEditor } from "@/admin/form/FieldEditor";
import { useAdminSession } from "@/admin/session";
import { adminDb } from "@/admin/supabase";
import { btnPrimary, ErrorNote, SuccessNote } from "@/admin/ui";
import { saveSetting } from "@/cms/admin-server";
import { CMS_CONFIG } from "@/cms/config";
import { SETTINGS_SCHEMAS, SETTING_LABELS, type SettingKey } from "@/cms/settings";

const INTRO: Record<SettingKey, string> = {
  avis: "Les avis affichés sur le site (page d'accueil et blocs « Avis clients »). Recopiez-les fidèlement depuis votre fiche Google : un avis inventé est interdit et sanctionné.",
  general: "Coordonnées reprises partout sur le site : en-tête, pied de page, page Contact, mentions légales et fiche entreprise lue par Google.",
  tracking: "Connectez vos outils de mesure. Saisissez seulement les identifiants : le site les installe lui-même, et ne les active qu'après l'acceptation des cookies par le visiteur (RGPD). Les codes de validation Search Console et Bing sont ajoutés aux pages pour prouver que le site vous appartient.",
  faq: "Les questions et réponses affichées par les blocs « Questions fréquentes ». Le thème permet d'afficher sur une page seulement les questions qui la concernent. Google peut les montrer directement dans ses résultats.",
};

/** Écran d'une liste du site (avis, questions fréquentes) : modifier, ajouter, réordonner, enregistrer. */
export function SettingListScreen({ settingKey }: { settingKey: SettingKey }) {
  const { session, role } = useAdminSession();
  const schema = SETTINGS_SCHEMAS[settingKey];
  const [saved, setSaved] = useState<unknown>(null);
  const [value, setValue] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void adminDb()
      .from("site_settings")
      .select("value")
      .eq("site_id", CMS_CONFIG.siteId)
      .eq("key", settingKey)
      .maybeSingle()
      .then(({ data }) => {
        const empty: Record<SettingKey, unknown> = { avis: { avis: [] }, faq: { items: [] }, tracking: {}, general: {} };
        const initial = data?.value ?? empty[settingKey];
        setSaved(initial);
        setValue(structuredClone(initial));
      });
  }, [settingKey]);

  const dirty = JSON.stringify(saved) !== JSON.stringify(value);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (value === null) return <p className="py-16 text-center text-muted-foreground">Chargement…</p>;
  const canEdit = role === "super" || role === "admin";
  const parsed = schema.safeParse(value);
  const errors = new Map<string, string>();
  if (!parsed.success) for (const i of parsed.error.issues) errors.set(i.path.join("."), i.message);

  const save = async () => {
    setBusy(true);
    setProblems([]);
    setNotice(null);
    try {
      const token = (await adminDb().auth.getSession()).data.session?.access_token ?? session?.access_token ?? "";
      const result = await saveSetting({ data: { token, key: settingKey, value } });
      if (!result.ok) return setProblems(result.problems);
      setSaved(structuredClone(value));
      setNotice("Enregistré : visible sur le site dans les 30 secondes.");
    } catch (e) {
      setProblems([e instanceof Error ? e.message : "Enregistrement impossible."]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">{SETTING_LABELS[settingKey]}</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-muted-foreground">{INTRO[settingKey]}</p>
        </div>
        {canEdit ? (
          <button type="button" disabled={!dirty || busy || !parsed.success} onClick={() => void save()} className={btnPrimary}>
            {busy ? "Enregistrement…" : "Enregistrer et publier"}
          </button>
        ) : null}
      </div>
      {problems.length ? <ErrorNote>{problems.join(" ")}</ErrorNote> : null}
      {notice ? <SuccessNote>{notice}</SuccessNote> : null}
      {!parsed.success && dirty ? <ErrorNote>Certains champs sont à compléter : ils sont signalés en rouge.</ErrorNote> : null}
      <div className="rounded-2xl border border-line bg-background p-5">
        <FieldEditor schema={schema} value={value} path="" onChange={setValue} inheritedLock={!canEdit}
          env={{ canUnlock: false, errors, pages: [], images: [] }} />
      </div>
    </section>
  );
}
