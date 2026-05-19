import path from "node:path";
import fg from "fast-glob";
import fs from "fs-extra";
import { detectAITools } from "./detectAITools.js";
import { detectDatabase } from "./detectDatabase.js";
import { detectFramework } from "./detectFramework.js";
import { detectPackageManager } from "./detectPackageManager.js";
import type { ProjectAnalysis } from "../types.js";

async function hasAny(root: string, patterns: string[]): Promise<boolean> {
  const matches = await fg(patterns, {
    cwd: root,
    onlyFiles: true,
    dot: true
  });

  return matches.length > 0;
}

export async function detectProject(root: string): Promise<ProjectAnalysis> {
  const resolvedRoot = path.resolve(root);
  const [packageManager, framework, database, aiTools] = await Promise.all([
    detectPackageManager(resolvedRoot),
    detectFramework(resolvedRoot),
    detectDatabase(resolvedRoot),
    detectAITools(resolvedRoot)
  ]);

  const [typescript, tailwind, shadcn, vitest, jest, playwright] = await Promise.all([
    fs.pathExists(path.join(resolvedRoot, "tsconfig.json")),
    hasAny(resolvedRoot, ["tailwind.config.{js,ts,mjs,mts,cjs,cts}"]),
    fs.pathExists(path.join(resolvedRoot, "components.json")),
    hasAny(resolvedRoot, ["vitest.config.{js,ts,mjs,mts,cjs,cts}"]),
    hasAny(resolvedRoot, ["jest.config.{js,ts,mjs,mts,cjs,cts}", "jest.config.json"]),
    hasAny(resolvedRoot, ["playwright.config.{js,ts,mjs,mts,cjs,cts}"])
  ]);

  return {
    root: resolvedRoot,
    packageManager,
    framework,
    language: typescript ? "typescript" : "javascript",
    styling: {
      tailwind,
      shadcn
    },
    database,
    testing: {
      vitest,
      jest,
      playwright
    },
    aiTools
  };
}
