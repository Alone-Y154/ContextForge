import path from "node:path";
import fs from "fs-extra";
import type { PackageManager, ProjectAnalysis } from "../types.js";
import { hasPackage, type PackageJson } from "../project/packageJson.js";
import type { LoadedPack } from "./registrySchema.js";

export function findPack(registry: LoadedPack[], packName: string): LoadedPack | undefined {
  return registry.find((pack) => pack.name === packName);
}

export function resolvePacks(packNames: string[], registry: LoadedPack[]): LoadedPack[] {
  const uniqueNames = [...new Set(packNames)];
  return uniqueNames.map((packName) => {
    const pack = findPack(registry, packName);

    if (!pack) {
      throw new Error(`Unknown ContextForge pack: ${packName}`);
    }

    return pack;
  });
}

export function recommendPacks(analysis: ProjectAnalysis, registry: LoadedPack[]): LoadedPack[] {
  const names = new Set<string>();

  names.add("env-secrets");

  if (analysis.framework === "next-app-router") {
    names.add("next-app-router");
  }

  if (analysis.database.prisma) {
    names.add("prisma-migrations");
  }

  if (analysis.styling.shadcn) {
    names.add("shadcn-ui");
  }

  if (analysis.testing.vitest || analysis.testing.jest || analysis.testing.playwright) {
    names.add("testing-workflow");
  }

  return resolvePacks(
    [...names].filter((name) => findPack(registry, name)),
    registry
  );
}

export async function packMatchesProject(
  pack: LoadedPack,
  root: string,
  packageJson: PackageJson | null
): Promise<boolean> {
  const fileChecks = await Promise.all(
    pack.detect?.files?.map((filePattern) => fs.pathExists(path.join(root, filePattern))) ?? []
  );
  const packageChecks =
    pack.detect?.packages?.map((packageName) => hasPackage(packageJson, packageName)) ?? [];

  const checks = [...fileChecks, ...packageChecks];
  return checks.length === 0 || checks.some(Boolean);
}

export function packageManagerLabel(packageManager: PackageManager): string {
  const labels: Record<PackageManager, string> = {
    pnpm: "pnpm",
    npm: "npm",
    yarn: "Yarn",
    bun: "Bun",
    unknown: "Unknown"
  };

  return labels[packageManager];
}
