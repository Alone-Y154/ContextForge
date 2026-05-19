import path from "node:path";
import fs from "fs-extra";

export type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export async function readPackageJson(root: string): Promise<PackageJson | null> {
  const packageJsonPath = path.join(root, "package.json");

  if (!(await fs.pathExists(packageJsonPath))) {
    return null;
  }

  return fs.readJson(packageJsonPath) as Promise<PackageJson>;
}

export function hasPackage(packageJson: PackageJson | null, packageName: string): boolean {
  if (!packageJson) {
    return false;
  }

  return Boolean(
    packageJson.dependencies?.[packageName] ||
      packageJson.devDependencies?.[packageName] ||
      packageJson.peerDependencies?.[packageName] ||
      packageJson.optionalDependencies?.[packageName]
  );
}

export function hasScript(packageJson: PackageJson | null, scriptName: string): boolean {
  return Boolean(packageJson?.scripts?.[scriptName]);
}
