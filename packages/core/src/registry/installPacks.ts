import path from "node:path";
import fs from "fs-extra";
import { PROJECT_PACK_CACHE } from "./loadRegistry.js";
import {
  fetchPackFile,
  fetchPackManifest,
  fetchRegistry,
  findPackSummary,
  resolvePackUrl
} from "./remoteRegistry.js";
import type { InstalledPack, PackFile, PackFileType, PackManifest, RegistryPackSummary } from "./registrySchema.js";

function normalizeRelativePath(relativePath: string): string {
  return relativePath.split(/[\\/]/u).join(path.sep);
}

function packRoot(projectRoot: string, packName: string): string {
  return path.join(projectRoot, PROJECT_PACK_CACHE, packName);
}

function packFilePath(projectRoot: string, packName: string, file: PackFile): string {
  return path.join(packRoot(projectRoot, packName), normalizeRelativePath(file.path));
}

export async function downloadPackToContextForge(
  projectRoot: string,
  packName: string,
  packManifest: PackManifest,
  packUrl: string,
  timeoutMs?: number
): Promise<InstalledPack> {
  const root = packRoot(projectRoot, packName);
  const files: Partial<Record<PackFileType, string>> = {};

  await fs.ensureDir(root);
  await fs.writeFile(path.join(root, "pack.json"), `${JSON.stringify(packManifest, null, 2)}\n`);

  for (const file of packManifest.files) {
    const content = await fetchPackFile(packUrl, file, timeoutMs);
    const targetPath = packFilePath(projectRoot, packName, file);

    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, content);
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
  projectRoot: string,
  registryUrl: string,
  packName: string,
  options: InstallPackOptions = {}
): Promise<InstallPackResult> {
  const registry = await fetchRegistry(registryUrl, options.timeoutMs);
  const summary = findPackSummary(registry, packName);

  if (!summary) {
    throw new Error(`Unknown ContextForge pack: ${packName}`);
  }

  const alreadyInstalled = await fs.pathExists(path.join(packRoot(projectRoot, packName), "pack.json"));
  const packUrl = resolvePackUrl(registryUrl, summary.path);
  const manifest = await fetchPackManifest(packUrl, options.timeoutMs);

  if (alreadyInstalled && !options.force) {
    return {
      installed: false,
      alreadyInstalled: true,
      packName,
      manifest,
      summary,
      packUrl
    };
  }

  if (!options.dryRun) {
    await downloadPackToContextForge(projectRoot, packName, manifest, packUrl, options.timeoutMs);
  }

  return {
    installed: !options.dryRun,
    alreadyInstalled,
    packName,
    manifest,
    summary,
    packUrl
  };
}
