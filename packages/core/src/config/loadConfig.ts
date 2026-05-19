import path from "node:path";
import fs from "fs-extra";
import { ConfigSchema, type ContextForgeConfig } from "./configSchema.js";

export const CONFIG_PATH = ".contextforge/config.json";

export async function loadConfig(root: string): Promise<ContextForgeConfig> {
  const configPath = path.join(root, CONFIG_PATH);

  if (!(await fs.pathExists(configPath))) {
    throw new Error("ContextForge config not found. Run `contextforge init` first.");
  }

  return ConfigSchema.parse(await fs.readJson(configPath));
}
