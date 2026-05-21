import type { ProjectAnalysis } from "../types.js";
import {
  DEFAULT_CORE_PACKS,
  DEFAULT_TOOLS,
  type AITool,
  type ContextForgeConfig
} from "./configSchema.js";
import { OFFICIAL_REGISTRY_URL } from "../registry/loadRegistry.js";

export { DEFAULT_CORE_PACKS, DEFAULT_TOOLS };

export function createConfig(
  _analysis: ProjectAnalysis,
  packs: { name: string }[],
  tools: AITool[] = DEFAULT_TOOLS,
  registry = OFFICIAL_REGISTRY_URL
): ContextForgeConfig {
  return {
    version: "0.1.0",
    registry,
    tools,
    installedPacks: [...new Set(packs.map((pack) => pack.name))],
    defaultCorePacks: [...DEFAULT_CORE_PACKS],
    generatedFiles: []
  };
}
