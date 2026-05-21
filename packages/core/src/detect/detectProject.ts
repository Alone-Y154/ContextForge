import path from "node:path";
import fg from "fast-glob";
import fs from "fs-extra";
import { detectAITools } from "./detectAITools.js";
import { detectDatabase } from "./detectDatabase.js";
import { detectFramework } from "./detectFramework.js";
import { detectPackageManager } from "./detectPackageManager.js";
import { hasPackage, readPackageJson } from "../project/packageJson.js";
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
  const [packageManager, framework, database, aiTools, packageJson] = await Promise.all([
    detectPackageManager(resolvedRoot),
    detectFramework(resolvedRoot),
    detectDatabase(resolvedRoot),
    detectAITools(resolvedRoot),
    readPackageJson(resolvedRoot)
  ]);

  const [typescript, tailwindConfig, componentsJson, vitestConfig, jestConfig, playwrightConfig] =
    await Promise.all([
    fs.pathExists(path.join(resolvedRoot, "tsconfig.json")),
    hasAny(resolvedRoot, ["tailwind.config.{js,ts,mjs,mts,cjs,cts}"]),
    fs.pathExists(path.join(resolvedRoot, "components.json")),
    hasAny(resolvedRoot, ["vitest.config.{js,ts,mjs,mts,cjs,cts}"]),
    hasAny(resolvedRoot, ["jest.config.{js,ts,mjs,mts,cjs,cts}", "jest.config.json"]),
    hasAny(resolvedRoot, ["playwright.config.{js,ts,mjs,mts,cjs,cts}"])
  ]);
  const tailwind = tailwindConfig || hasPackage(packageJson, "tailwindcss");
  const shadcn =
    componentsJson || hasPackage(packageJson, "shadcn") || hasPackage(packageJson, "shadcn-ui");
  const vitest = vitestConfig || hasPackage(packageJson, "vitest");
  const jest = jestConfig || hasPackage(packageJson, "jest");
  const playwright =
    playwrightConfig ||
    hasPackage(packageJson, "@playwright/test") ||
    hasPackage(packageJson, "playwright");

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
