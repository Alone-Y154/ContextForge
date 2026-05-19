import path from "node:path";
import fs from "fs-extra";
import type { PackageManager } from "../types.js";

export async function detectPackageManager(root: string): Promise<PackageManager> {
  const checks: Array<[PackageManager, string]> = [
    ["pnpm", "pnpm-lock.yaml"],
    ["npm", "package-lock.json"],
    ["yarn", "yarn.lock"],
    ["bun", "bun.lockb"],
    ["bun", "bun.lock"]
  ];

  for (const [manager, fileName] of checks) {
    if (await fs.pathExists(path.join(root, fileName))) {
      return manager;
    }
  }

  return "unknown";
}
