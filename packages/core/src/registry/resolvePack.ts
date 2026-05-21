import path from "node:path";
import fg from "fast-glob";
import fs from "fs-extra";
import type { PackageManager, ProjectAnalysis } from "../types.js";
import { hasPackage, readPackageJson, type PackageJson } from "../project/packageJson.js";
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

async function hasDetectFile(root: string, filePattern: string): Promise<boolean> {
  if (filePattern.includes("*")) {
    const matches = await fg(filePattern, {
      cwd: root,
      onlyFiles: false,
      dot: true
    });

    return matches.length > 0;
  }

  return fs.pathExists(path.join(root, filePattern));
}

function hasDetectHints(pack: LoadedPack): boolean {
  return Boolean(pack.detect?.files?.length || pack.detect?.packages?.length);
}

export async function recommendPacks(
  analysis: ProjectAnalysis,
  registry: LoadedPack[]
): Promise<LoadedPack[]> {
  const packageJson = await readPackageJson(analysis.root);
  const recommended: LoadedPack[] = [];

  for (const pack of registry) {
    if (pack.name === "env-secrets") {
      recommended.push(pack);
      continue;
    }

    if (hasDetectHints(pack) && (await packMatchesProject(pack, analysis.root, packageJson))) {
      recommended.push(pack);
    }
  }

  return recommended;
}

export async function packMatchesProject(
  pack: LoadedPack,
  root: string,
  packageJson: PackageJson | null
): Promise<boolean> {
  const fileChecks = await Promise.all(
    pack.detect?.files?.map((filePattern) => hasDetectFile(root, filePattern)) ?? []
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
