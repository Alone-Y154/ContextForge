import type { InstalledPack } from "../registry/registrySchema.js";
import type { GeneratedFile } from "../types.js";

export function compileCursorRules(packs: InstalledPack[]): GeneratedFile[] {
  return packs
    .filter((pack) => pack.manifest.outputs.cursorRule && pack.files.cursor)
    .map((pack) => ({
      path: `.contextforge/agents/cursor/${pack.manifest.name}.md`,
      content: pack.files.cursor?.trim() ?? ""
    }));
}
