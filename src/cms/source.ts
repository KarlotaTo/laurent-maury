import { CMS_CONFIG } from "@/cms/config";
import { fallbackData, validPages } from "@/cms/fallback";
import type { SiteData } from "@/cms/site-data";

/**
 * Chargement des contenus publiés depuis la base (côté serveur).
 * - mémoire de quelques secondes pour rester rapide ;
 * - si la base ne répond pas, dernière version connue, sinon contenus livrés avec le site.
 */
let cache: { data: SiteData; at: number } | null = null;
let inflight: Promise<SiteData> | null = null;

async function rest<T>(path: string): Promise<T> {
  const response = await fetch(`${CMS_CONFIG.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: CMS_CONFIG.supabaseAnonKey, Authorization: `Bearer ${CMS_CONFIG.supabaseAnonKey}` },
    signal: AbortSignal.timeout(CMS_CONFIG.timeoutMs),
  });
  if (!response.ok) throw new Error(`base : ${response.status}`);
  return (await response.json()) as T;
}

async function fetchSiteData(): Promise<SiteData> {
  const site = `site_id=eq.${CMS_CONFIG.siteId}`;
  const [versions, settings, redirects] = await Promise.all([
    rest<{ snapshot: unknown }[]>(`page_versions?select=snapshot&${site}`),
    rest<{ key: string; value: unknown }[]>(`site_settings?select=key,value&${site}`),
    rest<SiteData["redirects"]>(`redirects?select=from_path,to_path,status&${site}`).catch(() => []),
  ]);
  const pages = validPages(versions.map((v, i) => [`version ${i}`, v.snapshot] as [string, unknown]));
  if (pages.length === 0) throw new Error("aucune page publiée dans la base");
  const setting = <T>(key: string, fallback: T): T => (settings.find((s) => s.key === key)?.value as T) ?? fallback;
  return {
    pages,
    general: setting("general", fallbackData.general),
    avis: setting<{ avis: SiteData["avis"] }>("avis", { avis: fallbackData.avis }).avis,
    engagements: setting<{ engagements: SiteData["engagements"] }>("engagements", { engagements: fallbackData.engagements }).engagements,
    faq: setting<{ items: SiteData["faq"] }>("faq", { items: fallbackData.faq }).items,
    tracking: setting("tracking", fallbackData.tracking),
    redirects,
    technique: setting("technique", fallbackData.technique),
    source: "base",
  };
}

export async function loadSiteData(): Promise<SiteData> {
  if (cache && Date.now() - cache.at < CMS_CONFIG.cacheMs) return cache.data;
  inflight ??= fetchSiteData()
    .then((data) => {
      cache = { data, at: Date.now() };
      return data;
    })
    .catch((error: unknown) => {
      console.warn(`[cms] base injoignable, ${cache ? "dernière version connue" : "contenus de secours"} : ${String(error)}`);
      return cache?.data ?? fallbackData;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Vide la mémoire (après une publication depuis le back-office). */
export function forgetSiteData() {
  cache = null;
}
