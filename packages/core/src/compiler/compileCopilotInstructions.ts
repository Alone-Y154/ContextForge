import type { ProjectAnalysis } from "../types.js";
import type { LoadedPack } from "../registry/registrySchema.js";

export function compileCopilotInstructions(analysis: ProjectAnalysis, packs: LoadedPack[]): string {
  const enabledPacks = packs.filter((pack) => pack.outputs.copilotInstruction);

  return [
    "# ContextForge Copilot Instructions",
    "",
    `Project framework: ${analysis.framework}. Language: ${analysis.language}.`,
    "",
    ...enabledPacks.flatMap((pack) => [
      `## ${pack.title}`,
      "",
      (pack.files.copilot ?? pack.files.rules).trim(),
      ""
    ])
  ].join("\n");
}
