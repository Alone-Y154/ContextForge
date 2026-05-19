import type { ProjectAnalysis } from "../types.js";
import type { GeneratedFile } from "../types.js";
import type { LoadedPack } from "../registry/registrySchema.js";
import { GENERATED_BLOCK_END, GENERATED_BLOCK_START } from "../fs/updateGeneratedBlock.js";

function withCursorFrontmatter(description: string, content: string): string {
  return [
    "---",
    `description: ${description}`,
    "alwaysApply: true",
    "---",
    "",
    GENERATED_BLOCK_START,
    content.trim(),
    GENERATED_BLOCK_END
  ].join("\n");
}

export function compileCursorRules(analysis: ProjectAnalysis, packs: LoadedPack[]): GeneratedFile[] {
  const files: GeneratedFile[] = [
    {
      path: ".cursor/rules/contextforge.mdc",
      content: withCursorFrontmatter(
        "ContextForge generated project overview",
        [
          "# ContextForge Project Context",
          "",
          `- Framework: ${analysis.framework}`,
          `- Language: ${analysis.language}`,
          `- Package manager: ${analysis.packageManager}`,
          `- Active packs: ${packs.map((pack) => pack.name).join(", ") || "none"}`
        ].join("\n")
      )
    }
  ];

  for (const pack of packs.filter((item) => item.outputs.cursorRule)) {
    files.push({
      path: `.cursor/rules/${pack.name}.mdc`,
      content: withCursorFrontmatter(
        pack.description.replace(/:/g, "-"),
        (pack.files.cursor ?? pack.files.rules).trim()
      )
    });
  }

  return files;
}
