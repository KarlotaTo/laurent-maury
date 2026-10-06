import { Component, Fragment, type ReactNode } from "react";
import { blockRegistry } from "@/cms/registry";
import type { Background, BlockInstance } from "@/cms/types";

export type BlockProblem = { blockId: string; type: string; reason: string };

/** Signale un bloc écarté (console côté serveur ; plus tard, journal du back-office). */
export function reportBlockProblem(problem: BlockProblem) {
  console.warn(`[cms] bloc ${problem.type} (${problem.blockId}) non affiché : ${problem.reason}`);
}

/** Vérifie un bloc : le bloc est-il connu, ses données sont-elles valides ? */
export function checkBlock(block: BlockInstance) {
  const def = blockRegistry[block.type];
  if (!def) return { ok: false as const, reason: "type de bloc inconnu" };
  const parsed = def.schema.safeParse(block.data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, reason: `${first?.path.join(".") || "données"} : ${first?.message}` };
  }
  const background: Background =
    block.background && def.backgrounds.includes(block.background)
      ? block.background
      : (def.backgrounds[0] ?? "light");
  return { ok: true as const, def, data: parsed.data, background };
}

/** Un bloc qui plante au rendu disparaît sans emporter le reste de la page. */
class BlockBoundary extends Component<{ block: BlockInstance; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    reportBlockProblem({ blockId: this.props.block.id, type: this.props.block.type, reason: String(error) });
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function PageBlocks({ blocks }: { blocks: BlockInstance[] }) {
  return (
    <>
      {blocks.map((block) => {
        if (block.hidden) return null;
        const checked = checkBlock(block);
        if (!checked.ok) {
          reportBlockProblem({ blockId: block.id, type: block.type, reason: checked.reason });
          return null;
        }
        return (
          <BlockBoundary key={block.id} block={block}>
            <Fragment>{checked.def.render({ data: checked.data, background: checked.background })}</Fragment>
          </BlockBoundary>
        );
      })}
    </>
  );
}
