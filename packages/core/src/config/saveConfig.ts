import path from "node:path";
import fs from "fs-extra";
import type { ContextForgeConfig } from "./configSchema.js";
import { CONFIG_PATH } from "./loadConfig.js";

export async function saveConfig(root: string, config: ContextForgeConfig): Promise<void> {
  const configPath = path.join(root, CONFIG_PATH);
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

export function addPackToConfig(config: ContextForgeConfig, packName: string): ContextForgeConfig {
  return {
    ...config,
    installedPacks: [...new Set([...config.installedPacks, packName])]
  };
}
