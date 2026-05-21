import {
  fetchPackFile,
  fetchPackManifest,
  fetchRegistry,
  findPackSummary,
  resolvePackUrl
} from "./remoteRegistry.js";
import type { InstalledPack, PackFileType, PackManifest, RegistryPackSummary } from "./registrySchema.js";

export async function downloadPackToContextForge(
  _projectRoot: string,
  _packName: string,
  packManifest: PackManifest,
  packUrl: string,
  timeoutMs?: number
): Promise<InstalledPack> {
  const files: Partial<Record<PackFileType, string>> = {};

  for (const file of packManifest.files) {
    const content = await fetchPackFile(packUrl, file, timeoutMs);
    files[file.type] = content;
  }

  return {
    manifest: packManifest,
    packUrl,
    files
  };
}

export type InstallPackOptions = {
  force?: boolean;
  dryRun?: boolean;
  timeoutMs?: number;
};

export type InstallPackResult = {
  installed: boolean;
  alreadyInstalled: boolean;
  packName: string;
  manifest?: PackManifest;
  summary?: RegistryPackSummary;
  packUrl?: string;
};

export async function installPack(
  _projectRoot: string,
  registryUrl: string,
  packName: string,
  options: InstallPackOptions = {}
): Promise<InstallPackResult> {
  const registry = await fetchRegistry(registryUrl, options.timeoutMs);
  const summary = findPackSummary(registry, packName);

  if (!summary) {
    throw new Error(`Unknown ContextForge pack: ${packName}`);
  }

  const packUrl = resolvePackUrl(registryUrl, summary.path);
  const manifest = await fetchPackManifest(packUrl, options.timeoutMs);

  return {
    installed: !options.dryRun,
    alreadyInstalled: false,
    packName,
    manifest,
    summary,
    packUrl
  };
}
