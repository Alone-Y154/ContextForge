import path from "node:path";
import fs from "fs-extra";
import { PROJECT_PACK_CACHE } from "./loadRegistry.js";
import type { LoadedPack, Pack } from "./registrySchema.js";

const INSTALLED_PACKS_PATH = ".contextforge/installed-packs.json";

function packJson(pack: LoadedPack): Pack {
  return {
    name: pack.name,
    version: pack.version,
    title: pack.title,
    description: pack.description,
    category: pack.category,
    detect: pack.detect,
    outputs: pack.outputs
  };
}

async function writePack(root: string, pack: LoadedPack): Promise<void> {
  const packRoot = path.join(root, PROJECT_PACK_CACHE, pack.name);

  await fs.ensureDir(packRoot);
  await fs.writeFile(path.join(packRoot, "pack.json"), `${JSON.stringify(packJson(pack), null, 2)}\n`);
  await fs.writeFile(path.join(packRoot, "rules.md"), pack.files.rules);

  const optionalFiles: Array<[string, string | undefined]> = [
    ["skill.md", pack.files.skill],
    ["cursor.mdc", pack.files.cursor],
    ["copilot.md", pack.files.copilot]
  ];

  for (const [fileName, content] of optionalFiles) {
    if (content) {
      await fs.writeFile(path.join(packRoot, fileName), content);
    }
  }
}

export async function cacheRemotePacks(root: string, packs: LoadedPack[]): Promise<void> {
  for (const pack of packs) {
    if (pack.source === "remote") {
      await writePack(root, pack);
    }
  }
}

export async function saveInstalledPacks(root: string, packs: LoadedPack[]): Promise<void> {
  const metadataPath = path.join(root, INSTALLED_PACKS_PATH);
  const metadata = {
    version: "1",
    packs: packs.map((pack) => ({
      name: pack.name,
      version: pack.version ?? "0.0.0",
      source: pack.source,
      registryUrl: pack.registryUrl
    }))
  };

  await fs.ensureDir(path.dirname(metadataPath));
  await fs.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}
