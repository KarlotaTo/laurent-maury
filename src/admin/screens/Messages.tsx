import { Mail, Phone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAdminSession } from "@/admin/session";
import { adminDb } from "@/admin/supabase";
import { btnGhost, ErrorNote } from "@/admin/ui";
import { CMS_CONFIG } from "@/cms/config";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  work_type: string | null;
  body: string;
  status: "new" | "done" | "spam";
  created_at: string;
};
type Filter = "new" | "done" | "spam";
const FILTERS: [Filter, string][] = [["new", "À traiter"], ["done", "Traités"], ["spam", "Indésirables"]];
const WORK_LABELS: Record<string, string> = {
  peinture: "Peinture & décoration",
  sols: "Sols & parquets",
  murs: "Murs & revêtements",
  renovation: "Rénovation intérieure",
  facades: "Façades & extérieur",
  entretien: "Entretien & bâti",
};

export function MessagesScreen() {
  const { role } = useAdminSession();
  const [filter, setFilter] = useState<Filter>("new");
  const [items, setItems] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await adminDb()
      .from("messages")
      .select("id,name,email,phone,city,work_type,body,status,created_at")
      .eq("site_id", CMS_CONFIG.siteId)
      .eq("status", filter)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    else setItems(data as Message[]);
  }, [filter]);
  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  const setStatus = async (m: Message, status: Filter) => {
    const { error } = await adminDb().from("messages").update({ status }).eq("id", m.id);
    if (error) setError(error.message);
    else void load();
  };

  if (role === "contributor") return <ErrorNote>Les messages sont réservés aux éditeurs et administrateurs.</ErrorNote>;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-display text-4xl">Messages</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">Les demandes envoyées depuis les formulaires du site, les plus récentes en premier.</p>
      </div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {FILTERS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={filter === key} type="button" onClick={() => setFilter(key)}
            className={`min-h-10 rounded-full px-4 text-[14px] ${filter === key ? "bg-primary text-primary-foreground" : "border border-line bg-background hover:bg-sand"}`}>
            {label}
          </button>
        ))}
      </div>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {!items ? <p className="py-10 text-center text-muted-foreground">Chargement…</p> : null}
      {items && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-background px-6 py-12 text-center">
          <p className="text-lg font-medium">{filter === "new" ? "Aucune nouvelle demande" : "Rien ici pour l'instant"}</p>
          <p className="mt-1 text-[14px] text-muted-foreground">Les demandes envoyées depuis le site arrivent ici automatiquement.</p>
        </div>
      ) : null}
      <div className="space-y-3">
        {items?.map((m) => (
          <article key={m.id} className="rounded-2xl border border-line bg-background p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[17px] font-medium">{m.name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleString("fr-FR")}
                  {m.city ? ` · ${m.city}` : ""}
                  {m.work_type ? ` · ${WORK_LABELS[m.work_type] ?? m.work_type}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent("Votre demande de devis")}`} className={btnGhost}><Mail className="size-4" /> Répondre</a>
                {m.phone ? <a href={`tel:${m.phone.replace(/\s/g, "")}`} className={btnGhost}><Phone className="size-4" /> {m.phone}</a> : null}
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{m.body}</p>
            <p className="mt-2 text-[13px] text-muted-foreground">{m.email}</p>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
              {m.status !== "done" ? <button type="button" onClick={() => void setStatus(m, "done")} className={btnGhost}>Marquer comme traité</button> : null}
              {m.status !== "new" ? <button type="button" onClick={() => void setStatus(m, "new")} className={btnGhost}>Remettre à traiter</button> : null}
              {m.status !== "spam" ? <button type="button" onClick={() => void setStatus(m, "spam")} className={`${btnGhost} text-muted-foreground`}>Indésirable</button> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
