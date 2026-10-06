import type { BlockDef } from "@/cms/types";
import * as sections from "@/cms/blocks/sections";

/** Tous les blocs disponibles sur ce site, par type. */
export const blockRegistry: Record<string, BlockDef> = Object.fromEntries(
  Object.values(sections).map((def) => [def.type, def as unknown as BlockDef]),
);
