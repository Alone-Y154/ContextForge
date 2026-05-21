import type { InstalledPack } from "../registry/registrySchema.js";
import type { GeneratedFile } from "../types.js";

export function compileSkills(packs: InstalledPack[]): GeneratedFile[] {
  return packs
    .filter((pack) => pack.manifest.outputs.skill && pack.files.skill)
    .map((pack) => ({
      path: `.contextforge/skills/${pack.manifest.name}/SKILL.md`,
      content: pack.files.skill?.trim() ?? ""
    }));
}
