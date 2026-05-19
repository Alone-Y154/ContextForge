import path from "node:path";
import fs from "fs-extra";
import { PackSchema, type LoadedPack } from "./registrySchema.js";

export type LocalRegistrySource = LoadedPack["source"];

export async function loadLocalRegistry(
  registryRoot: string,
  source: LocalRegistrySource
): Promise<LoadedPack[]> {
  if (!(await fs.pathExists(registryRoot))) {
    return [];
  }

  const entries = await fs.readdir(registryRoot, { withFileTypes: true });
  const packs: LoadedPack[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const directory = path.join(registryRoot, entry.name);
    const packPath = path.join(directory, "pack.json");

    if (!(await fs.pathExists(packPath))) {
      continue;
    }

    const parsed = PackSchema.parse(await fs.readJson(packPath));
    const readOptional = async (fileName: string): Promise<string | undefined> => {
      const filePath = path.join(directory, fileName);
      return (await fs.pathExists(filePath)) ? fs.readFile(filePath, "utf8") : undefined;
    };

    const rules = await readOptional("rules.md");

    if (!rules) {
      throw new Error(`Pack "${parsed.name}" is missing rules.md`);
    }

    packs.push({
      ...parsed,
      directory,
      source,
      files: {
        rules,
        skill: await readOptional("skill.md"),
        cursor: await readOptional("cursor.mdc"),
        copilot: await readOptional("copilot.md")
      }
    });
  }

  return packs;
}
