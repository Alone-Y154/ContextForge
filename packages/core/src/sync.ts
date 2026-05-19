import path from "node:path";
import { compileOutputs } from "./compiler/compileOutputs.js";
import { writeGeneratedFiles } from "./compiler/writeGeneratedFiles.js";
import type { ContextForgeConfig } from "./config/configSchema.js";
import { loadConfig } from "./config/loadConfig.js";
import { saveConfig } from "./config/saveConfig.js";
import { detectProject } from "./detect/detectProject.js";
import { cacheRemotePacks, saveInstalledPacks } from "./registry/installPacks.js";
import { loadRegistry } from "./registry/loadRegistry.js";
import { resolvePacks } from "./registry/resolvePack.js";
import type { GeneratedFile, ProjectAnalysis } from "./types.js";

export type SyncResult = {
  root: string;
  analysis: ProjectAnalysis;
  generatedFiles: string[];
  outputs: GeneratedFile[];
  config: ContextForgeConfig;
};

export async function syncProject(
  root: string,
  providedConfig?: ContextForgeConfig
): Promise<SyncResult> {
  const resolvedRoot = path.resolve(root);
  const analysis = await detectProject(resolvedRoot);
  const config = providedConfig ?? (await loadConfig(resolvedRoot));
  const registry = await loadRegistry({
    root: resolvedRoot,
    sources: config.registries
  });
  const packs = resolvePacks(config.packs, registry);
  await cacheRemotePacks(resolvedRoot, packs);
  await saveInstalledPacks(resolvedRoot, packs);
  const outputs = compileOutputs(config, packs, analysis);
  const generatedFiles = await writeGeneratedFiles(resolvedRoot, outputs);
  const nextConfig = {
    ...config,
    packageManager: config.packageManager === "unknown" ? analysis.packageManager : config.packageManager,
    generatedFiles
  };

  await saveConfig(resolvedRoot, nextConfig);

  return {
    root: resolvedRoot,
    analysis,
    generatedFiles,
    outputs,
    config: nextConfig
  };
}
