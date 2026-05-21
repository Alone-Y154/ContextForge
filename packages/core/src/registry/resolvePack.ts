import path from "node:path";
import fg from "fast-glob";
import fs from "fs-extra";
import { DEFAULT_CORE_PACKS } from "../config/configSchema.js";
import type { PackageManager, ProjectAnalysis } from "../types.js";
import { hasPackage, readPackageJson, type PackageJson } from "../project/packageJson.js";
import type { InstalledPack, PackManifest, RegistryIndex, RegistryPackSummary } from "./registrySchema.js";

export function findPack(registry: RegistryIndex, packName: string): RegistryPackSummary | undefined {
  return registry.packs.find((pack) => pack.name === packName);
}

export function mandatoryCorePacks(registry: RegistryIndex): RegistryPackSummary[] {
  return DEFAULT_CORE_PACKS.map((name) => findPack(registry, name)).filter(
    (pack): pack is RegistryPackSummary => Boolean(pack)
  );
}

export function missingMandatoryCorePacks(registry: RegistryIndex): string[] {
  return DEFAULT_CORE_PACKS.filter((name) => !findPack(registry, name));
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

export async function manifestMatchesProject(
  manifest: Pick<PackManifest, "detect">,
  root: string,
  packageJson: PackageJson | null
): Promise<boolean> {
  const fileChecks = await Promise.all(
    manifest.detect?.files?.map((filePattern) => hasDetectFile(root, filePattern)) ?? []
  );
  const packageChecks =
    manifest.detect?.packages?.map((packageName) => hasPackage(packageJson, packageName)) ?? [];

  const checks = [...fileChecks, ...packageChecks];
  return checks.length === 0 || checks.some(Boolean);
}

export function recommendPackNames(analysis: ProjectAnalysis): string[] {
  const names = new Set<string>();

  if (analysis.framework === "next-app-router") {
    names.add("nextjs-best-practices");
    names.add("react-performance");
    names.add("react-composition");
  }

  if (analysis.styling.tailwind || analysis.styling.shadcn) {
    names.add("shadcn-ui");
    names.add("tailwind-v4");
    names.add("ui-ux-design");
    names.add("frontend-aesthetics");
  }

  if (analysis.language === "typescript") {
    names.add("typescript-advanced-types");
  }

  if (analysis.services.supabase) {
    names.add("supabase");
    names.add("security-baseline");
  }

  return [...names];
}

export async function recommendPacks(
  analysis: ProjectAnalysis,
  registry: RegistryIndex
): Promise<RegistryPackSummary[]> {
  const recommendedNames = recommendPackNames(analysis);
  return recommendedNames
    .map((name) => findPack(registry, name))
    .filter((pack): pack is RegistryPackSummary => Boolean(pack));
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

export async function packMatchesProject(
  pack: InstalledPack,
  root: string,
  packageJson?: PackageJson | null
): Promise<boolean> {
  return manifestMatchesProject(pack.manifest, root, packageJson ?? (await readPackageJson(root)));
}

export function resolvePacks(packNames: string[], packs: InstalledPack[]): InstalledPack[] {
  return packNames.map((packName) => {
    const pack = packs.find((item) => item.manifest.name === packName);

    if (!pack) {
      throw new Error(`Unknown ContextForge pack: ${packName}`);
    }

    return pack;
  });
}
