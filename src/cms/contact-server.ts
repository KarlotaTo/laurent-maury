import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CMS_CONFIG } from "@/cms/config";

/**
 * Demandes envoyées par les formulaires du site : vérifiées, filtrées (robots),
 * puis enregistrées dans les messages du back-office.
 */
const contactInput = z.object({
  name: z.string().trim().min(1, "Indiquez votre nom").max(100),
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  phone: z.string().trim().max(30).optional(),
  city: z.string().trim().max(80).optional(),
  workType: z.string().trim().max(80).optional(),
  message: z.string().trim().min(5, "Décrivez votre projet en quelques mots").max(2000),
  /** Champ invisible : rempli seulement par les robots. */
  website: z.string().max(200).optional(),
  /** Temps passé sur le formulaire (ms) : un humain met plus de 3 secondes. */
  elapsedMs: z.number().int().min(0).max(86_400_000),
});

const recent = new Map<string, number[]>();
function tooMany(key: string) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > 5;
}

export const submitContact = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof contactInput>) => input)
  .handler(async ({ data }) => {
    const parsed = contactInput.safeParse(data);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
    const d = parsed.data;
    // Robots : on répond « envoyé » sans rien enregistrer.
    if (d.website || d.elapsedMs < 3000) return { ok: true as const };
    if (tooMany(d.email.toLowerCase())) return { ok: false as const, error: "Trop de demandes envoyées. Réessayez dans quelques minutes ou appelez-nous." };
    const response = await fetch(`${CMS_CONFIG.supabaseUrl}/rest/v1/messages`, {
      method: "POST",
      headers: {
        apikey: CMS_CONFIG.supabaseAnonKey,
        Authorization: `Bearer ${CMS_CONFIG.supabaseAnonKey}`,
        "content-type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        site_id: CMS_CONFIG.siteId,
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        city: d.city || null,
        work_type: d.workType || null,
        body: d.message,
      }),
      signal: AbortSignal.timeout(6000),
    }).catch(() => null);
    if (!response?.ok) return { ok: false as const, error: "L'envoi n'a pas abouti. Réessayez ou appelez-nous directement." };
    return { ok: true as const };
  });
