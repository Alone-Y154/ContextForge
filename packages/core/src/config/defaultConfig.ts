import type { ContextForgeConfig } from "./configSchema.js";
import type { ProjectAnalysis, AITool } from "../types.js";
import type { LoadedPack } from "../registry/registrySchema.js";
import { DEFAULT_REGISTRY_SOURCES } from "../registry/loadRegistry.js";

export const DEFAULT_TOOLS: AITool[] = ["codex", "claude", "cursor", "copilot"];

export function createConfig(
  analysis: ProjectAnalysis,
  packs: LoadedPack[],
  tools: AITool[] = DEFAULT_TOOLS,
  registries: string[] = DEFAULT_REGISTRY_SOURCES
): ContextForgeConfig {
  return {
    version: "0.1.0",
    registries,
    tools,
    packs: packs.map((pack) => pack.name),
    packageManager: analysis.packageManager,
    generatedFiles: []
  };
}
