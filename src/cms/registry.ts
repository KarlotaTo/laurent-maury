import type { BlockDef } from "@/cms/types";
import * as sections from "@/cms/blocks/sections";
import * as realisationBlocks from "@/cms/blocks/realisations";

/** Tous les blocs disponibles sur ce site, par type. */
export const blockRegistry: Record<string, BlockDef> = Object.fromEntries(
  [...Object.values(sections), ...Object.values(realisationBlocks)].map((def) => [def.type, def as unknown as BlockDef]),
);
