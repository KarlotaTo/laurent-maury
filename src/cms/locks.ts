import { z } from "zod";
import { fieldMeta } from "@/cms/fields";

/**
 * Champs verrouillés : relève, pour une valeur conforme à un schéma, les valeurs
 * des champs marqués « locked » (chemin → valeur sérialisée).
 * Sert à vérifier qu'un compte non super-admin ne les a pas modifiés.
 */
function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  for (let i = 0; i < 10; i++) {
    const def = current._def as { innerType?: z.ZodTypeAny; schema?: z.ZodTypeAny };
    const next = def.innerType ?? def.schema;
    if (!next) break;
    current = next;
  }
  return current;
}

export function lockedValues(schema: z.ZodTypeAny, value: unknown, path = ""): Map<string, string> {
  const out = new Map<string, string>();
  const meta = fieldMeta(schema);
  if (meta?.locked) {
    out.set(path || "(racine)", JSON.stringify(value ?? null));
    return out;
  }
  const inner = unwrap(schema);
  if (inner instanceof z.ZodObject) {
    const shape = inner.shape as Record<string, z.ZodTypeAny>;
    const obj = (value ?? {}) as Record<string, unknown>;
    for (const [key, child] of Object.entries(shape)) {
      for (const [p, v] of lockedValues(child, obj[key], path ? `${path}.${key}` : key)) out.set(p, v);
    }
  } else if (inner instanceof z.ZodArray) {
    const items = Array.isArray(value) ? value : [];
    items.forEach((item, i) => {
      for (const [p, v] of lockedValues(inner.element as z.ZodTypeAny, item, `${path}[${i}]`)) out.set(p, v);
    });
  }
  return out;
}

/** Chemins des champs verrouillés dont la valeur a changé entre deux versions d'un bloc. */
export function changedLockedFields(schema: z.ZodTypeAny, before: unknown, after: unknown): string[] {
  const a = lockedValues(schema, before);
  const b = lockedValues(schema, after);
  const paths = new Set([...a.keys(), ...b.keys()]);
  return [...paths].filter((p) => a.get(p) !== b.get(p));
}
