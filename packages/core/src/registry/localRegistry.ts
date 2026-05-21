import path from "node:path";
import fs from "fs-extra";
import {
  PackManifestSchema,
  type InstalledPack,
  type PackFile,
  type PackFileType
} from "./registrySchema.js";

async function readOptional(filePath: string): Promise<string | undefined> {
  return (await fs.pathExists(filePath)) ? fs.readFile(filePath, "utf8") : undefined;
}

function normalizePackFilePath(file: PackFile): string {
  return file.path.split(/[\\/]/u).join(path.sep);
}

export async function loadCachedPack(packRoot: string): Promise<InstalledPack | null> {
  const manifestPath = path.join(packRoot, "pack.json");

  if (!(await fs.pathExists(manifestPath))) {
    return null;
  }

  const manifest = PackManifestSchema.parse(await fs.readJson(manifestPath));
  const files: Partial<Record<PackFileType, string>> = {};

  for (const file of manifest.files) {
    const content = await readOptional(path.join(packRoot, normalizePackFilePath(file)));

    if (content !== undefined) {
      files[file.type] = content;
    }
  }

  return {
    manifest,
    files
  };
}

export async function loadCachedPacks(packsRoot: string): Promise<InstalledPack[]> {
  if (!(await fs.pathExists(packsRoot))) {
    return [];
  }

  const entries = await fs.readdir(packsRoot, { withFileTypes: true });
  const packs: InstalledPack[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const pack = await loadCachedPack(path.join(packsRoot, entry.name));

    if (pack) {
      packs.push(pack);
    }
  }

  return packs.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}
