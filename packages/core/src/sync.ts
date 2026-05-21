import path from "node:path";
import fs from "fs-extra";
import { generateToolOutputs } from "./compiler/generateToolOutputs.js";
import { type ContextForgeConfig } from "./config/configSchema.js";
import { loadConfig } from "./config/loadConfig.js";
import { saveConfig, addPackToConfig } from "./config/saveConfig.js";
import { updateContextForgeLock } from "./config/lockFile.js";
import { detectProject } from "./detect/detectProject.js";
import {
  downloadPackToContextForge,
  installPack,
  type InstallPackOptions,
  type InstallPackResult
} from "./registry/installPacks.js";
import {
  fetchPackManifest,
  fetchRegistry,
  findPackSummary,
  resolvePackUrl
} from "./registry/remoteRegistry.js";
import type { InstalledPack, RegistryPackSummary } from "./registry/registrySchema.js";
import type { GeneratedFile, ProjectAnalysis } from "./types.js";

export type SyncResult = {
  root: string;
  analysis: ProjectAnalysis;
  generatedFiles: string[];
  outputs: GeneratedFile[];
  config: ContextForgeConfig;
  installedPacks: InstalledPack[];
};

export type InstallAndSyncOptions = InstallPackOptions & {
  tools?: ContextForgeConfig["tools"];
};

export async function updateContextForgeConfig(
  projectRoot: string,
  packName: string,
  registryUrl: string,
  generatedFiles: string[]
): Promise<ContextForgeConfig> {
  const existing = await loadOptionalConfig(projectRoot);
  const config = addPackToConfig(
    existing ?? {
      version: "0.1.0",
      registry: registryUrl,
      tools: ["codex", "claude", "cursor", "copilot"],
      installedPacks: [],
      defaultCorePacks: [],
      generatedFiles: []
    },
    packName
  );
  const nextConfig = {
    ...config,
    registry: registryUrl,
    generatedFiles
  };

  await saveConfig(projectRoot, nextConfig);
  return nextConfig;
}

async function loadOptionalConfig(root: string): Promise<ContextForgeConfig | null> {
  try {
    return await loadConfig(root);
  } catch {
    return null;
  }
}

async function loadInstalledPackFromRegistry(
  projectRoot: string,
  registryUrl: string,
  summary: RegistryPackSummary,
  timeoutMs?: number
): Promise<InstalledPack> {
  const packUrl = resolvePackUrl(registryUrl, summary.path);
  const manifest = await fetchPackManifest(packUrl, timeoutMs);
  return downloadPackToContextForge(projectRoot, manifest.name, manifest, packUrl, timeoutMs);
}

async function removeLegacyPackCache(root: string): Promise<void> {
  await fs.remove(path.join(root, ".contextforge/packs"));
}

export async function syncInstalledPacks(
  projectRoot: string,
  providedConfig?: ContextForgeConfig
): Promise<SyncResult> {
  const root = path.resolve(projectRoot);
  const analysis = await detectProject(root);
  const previousConfig = await loadOptionalConfig(root);
  const config = providedConfig ?? (await loadConfig(root));
  const registry = await fetchRegistry(config.registry);
  const installed: InstalledPack[] = [];
  const missing: string[] = [];

  for (const packName of config.installedPacks) {
    const summary = findPackSummary(registry, packName);

    if (!summary) {
      missing.push(packName);
      continue;
    }

    installed.push(await loadInstalledPackFromRegistry(root, config.registry, summary));
  }

  await removeLegacyPackCache(root);

  const generatedFiles = await generateToolOutputs(
    root,
    installed,
    config,
    previousConfig?.generatedFiles ?? []
  );
  const nextConfig = {
    ...config,
    installedPacks: installed.map((pack) => pack.manifest.name),
    generatedFiles
  };

  await saveConfig(root, nextConfig);
  await updateContextForgeLock(
    root,
    config.registry,
    installed.map((pack) => ({
      manifest: pack.manifest,
      summary: registry.packs.find((summary) => summary.name === pack.manifest.name),
      packUrl: pack.packUrl
    }))
  );

  if (missing.length > 0) {
    throw new Error(`Installed packs missing from registry: ${missing.join(", ")}`);
  }

  return {
    root,
    analysis,
    generatedFiles,
    outputs: generatedFiles.map((file) => ({ path: file, content: "" })),
    config: nextConfig,
    installedPacks: installed
  };
}

export async function syncProject(
  root: string,
  providedConfig?: ContextForgeConfig
): Promise<SyncResult> {
  return syncInstalledPacks(root, providedConfig);
}

export async function installPackAndSync(
  projectRoot: string,
  registryUrl: string,
  packName: string,
  options: InstallAndSyncOptions = {}
): Promise<InstallPackResult & { generatedFiles: string[]; config?: ContextForgeConfig }> {
  const root = path.resolve(projectRoot);
  const config = await loadOptionalConfig(root);
  const result = await installPack(root, registryUrl, packName, options);

  if (result.alreadyInstalled && !options.force && config?.installedPacks.includes(packName)) {
    return {
      ...result,
      generatedFiles: [],
      config: config ?? undefined
    };
  }

  if (options.dryRun) {
    return {
      ...result,
      generatedFiles: [],
      config: config ?? undefined
    };
  }

  const nextConfig: ContextForgeConfig = {
    version: "0.1.0",
    registry: registryUrl,
    tools: options.tools ?? config?.tools ?? ["codex", "claude", "cursor", "copilot"],
    installedPacks: [...new Set([...(config?.installedPacks ?? []), packName])],
    defaultCorePacks: config?.defaultCorePacks ?? [],
    generatedFiles: config?.generatedFiles ?? []
  };

  const syncResult = await syncInstalledPacks(root, nextConfig);

  return {
    ...result,
    generatedFiles: syncResult.generatedFiles,
    config: syncResult.config
  };
}

export async function readInstalledPacks(projectRoot: string): Promise<InstalledPack[]> {
  const config = await loadConfig(projectRoot);
  const registry = await fetchRegistry(config.registry);
  const installed: InstalledPack[] = [];

  for (const packName of config.installedPacks) {
    const summary = findPackSummary(registry, packName);

    if (summary) {
      installed.push(await loadInstalledPackFromRegistry(projectRoot, config.registry, summary));
    }
  }

  return installed;
}

export async function pathExists(root: string, relativePath: string): Promise<boolean> {
  return fs.pathExists(path.join(root, relativePath));
}
