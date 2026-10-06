import { adminDb } from "@/admin/supabase";
import { CMS_CONFIG } from "@/cms/config";

export type PageRow = {
  id: string;
  key: string;
  path: string;
  parent_id: string | null;
  template: string;
  sort_order: number;
  label: string;
  in_menu: boolean;
  published_version_id: string | null;
  updated_at: string;
  draft?: { seo: import("@/cms/types").Page["seo"]; blocks: import("@/cms/types").BlockInstance[] };
};

export type TreeRow = PageRow & { depth: number };

/** Pages du site (brouillons compris), lues avec les droits de l'utilisateur connecté. */
export async function fetchPages(withDrafts = false): Promise<PageRow[]> {
  const { data, error } = await adminDb()
    .from("pages")
    .select(`id,key,path,parent_id,template,sort_order,label,in_menu,published_version_id,updated_at${withDrafts ? ",draft" : ""}`)
    .eq("site_id", CMS_CONFIG.siteId)
    .is("deleted_at", null)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data as unknown as PageRow[];
}

/** Ordonne les pages en arbre : chaque page suivie de ses enfants, sans limite de profondeur. */
export function toTree(pages: PageRow[]): TreeRow[] {
  const children = new Map<string | null, PageRow[]>();
  for (const p of pages) {
    const key = p.parent_id && pages.some((x) => x.id === p.parent_id) ? p.parent_id : null;
    children.set(key, [...(children.get(key) ?? []), p]);
  }
  const out: TreeRow[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const p of (children.get(parent) ?? []).sort((a, b) => a.sort_order - b.sort_order)) {
      out.push({ ...p, depth });
      if (depth < 20) walk(p.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
