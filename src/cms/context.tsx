import { createContext, useContext, type ReactNode } from "react";
import type { SiteContext } from "@/cms/site-data";

const SiteCtx = createContext<SiteContext | null>(null);

export function SiteProvider({ value, children }: { value: SiteContext; children: ReactNode }) {
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

/** Coordonnées, communes, réalisations… du site en cours (chargés depuis la base). */
export function useSite(): SiteContext {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error("useSite : contexte du site absent");
  return ctx;
}
