import type { ContextForgeConfig } from "../config/configSchema.js";
import type { LoadedPack } from "../registry/registrySchema.js";
import type { GeneratedFile, ProjectAnalysis } from "../types.js";
import { compileAgentsMd } from "./compileAgentsMd.js";
import { compileClaudeMd } from "./compileClaudeMd.js";
import { compileCopilotInstructions } from "./compileCopilotInstructions.js";
import { compileCursorRules } from "./compileCursorRules.js";
import { compileSkills } from "./compileSkills.js";

export function compileOutputs(
  config: ContextForgeConfig,
  packs: LoadedPack[],
  analysis: ProjectAnalysis
): GeneratedFile[] {
  const outputs: GeneratedFile[] = [];

  if (config.tools.includes("codex")) {
    outputs.push({ path: "AGENTS.md", content: compileAgentsMd(analysis, packs) });
    outputs.push(...compileSkills(packs));
  }

  if (config.tools.includes("claude")) {
    outputs.push({ path: "CLAUDE.md", content: compileClaudeMd(analysis, packs) });
  }

  if (config.tools.includes("cursor")) {
    outputs.push(...compileCursorRules(analysis, packs));
  }

  if (config.tools.includes("copilot")) {
    outputs.push({
      path: ".github/copilot-instructions.md",
      content: compileCopilotInstructions(analysis, packs)
    });
  }

  return outputs;
}
