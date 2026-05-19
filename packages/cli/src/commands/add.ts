import {
  addPackToConfig,
  cacheRemotePacks,
  findPack,
  loadConfig,
  loadRegistry,
  packMatchesProject,
  readPackageJson,
  saveConfig,
  syncProject
} from "@contextforge/core";
import pc from "picocolors";
import { formatGeneratedFiles } from "../format.js";
import { resolveRegistrySources, type RegistryCommandOptions } from "../registryOptions.js";

export async function addCommand(
  packName: string,
  options: RegistryCommandOptions = {}
): Promise<void> {
  const root = process.cwd();
  const config = await loadConfig(root);
  const registrySources = resolveRegistrySources(config, options);
  const registry = await loadRegistry({ root, sources: registrySources });
  const pack = findPack(registry, packName);

  if (!pack) {
    throw new Error(`Unknown pack "${packName}".`);
  }

  const packageJson = await readPackageJson(root);
  const compatible = await packMatchesProject(pack, root, packageJson);
  const alreadyInstalled = config.packs.includes(packName);
  const nextConfig = {
    ...addPackToConfig(config, packName),
    registries: registrySources
  };

  if (!compatible) {
    console.log(
      pc.yellow(
        `${packName} does not match the current project detection hints. Adding it anyway; run doctor if this was intentional.`
      )
    );
  }

  await cacheRemotePacks(root, [pack]);
  await saveConfig(root, nextConfig);
  const result = await syncProject(root, nextConfig);

  console.log(
    alreadyInstalled
      ? pc.yellow(`${packName} was already installed. Synced generated files.`)
      : pc.green(`Added ${packName}.`)
  );
  console.log(formatGeneratedFiles(result.generatedFiles));
}
