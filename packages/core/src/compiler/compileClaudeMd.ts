import type { ProjectAnalysis } from "../types.js";
import type { LoadedPack } from "../registry/registrySchema.js";
import { compileAgentsMd } from "./compileAgentsMd.js";

export function compileClaudeMd(analysis: ProjectAnalysis, packs: LoadedPack[]): string {
  return compileAgentsMd(analysis, packs).replace(
    "# ContextForge Instructions",
    "# ContextForge Claude Instructions"
  );
}
