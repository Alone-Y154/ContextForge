import path from "node:path";
import fg from "fast-glob";
import fs from "fs-extra";
import type { ProjectFramework } from "../types.js";

async function hasDirectory(root: string, relativePath: string): Promise<boolean> {
  const statPath = path.join(root, relativePath);

  if (!(await fs.pathExists(statPath))) {
    return false;
  }

  return (await fs.stat(statPath)).isDirectory();
}

export async function detectFramework(root: string): Promise<ProjectFramework> {
  if ((await hasDirectory(root, "src/app")) || (await hasDirectory(root, "app"))) {
    return "next-app-router";
  }

  if ((await hasDirectory(root, "src/pages")) || (await hasDirectory(root, "pages"))) {
    return "next-pages-router";
  }

  const viteConfigs = await fg("vite.config.{js,ts,mjs,mts,cjs,cts}", {
    cwd: root,
    onlyFiles: true,
    dot: true
  });

  if (viteConfigs.length > 0) {
    return "vite-react";
  }

  return "unknown";
}
