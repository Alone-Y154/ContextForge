import type { GeneratedFile } from "../types.js";
import type { LoadedPack } from "../registry/registrySchema.js";
import { GENERATED_BLOCK_END, GENERATED_BLOCK_START } from "../fs/updateGeneratedBlock.js";

function escapeYaml(value: string): string {
  return value.replace(/"/g, '\\"');
}

export function compileSkills(packs: LoadedPack[]): GeneratedFile[] {
  return packs
    .filter((pack) => pack.outputs.skill)
    .map((pack) => ({
      path: `.agents/skills/${pack.name}/SKILL.md`,
      content: [
        "---",
        `name: ${pack.name}`,
        `description: "${escapeYaml(pack.description)}"`,
        "---",
        "",
        GENERATED_BLOCK_START,
        (pack.files.skill ?? pack.files.rules).trim(),
        GENERATED_BLOCK_END
      ].join("\n")
    }));
}
