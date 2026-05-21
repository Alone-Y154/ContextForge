import {
  fetchRegistry,
  findPackSummary,
  installPackAndSync,
  loadConfig,
  type ContextForgeConfig
} from "@contextforge/core";
import pc from "picocolors";
import { formatGeneratedFiles } from "../format.js";
import { resolveRegistryUrl, type RegistryCommandOptions } from "../registryOptions.js";

type AddOptions = RegistryCommandOptions & {
  force?: boolean;
  dryRun?: boolean;
};

async function loadOptionalConfig(root: string): Promise<ContextForgeConfig | undefined> {
  try {
    return await loadConfig(root);
  } catch {
    return undefined;
  }
}

export async function addCommand(packName: string, options: AddOptions = {}): Promise<void> {
  const root = process.cwd();
  const config = await loadOptionalConfig(root);
  const registryUrl = resolveRegistryUrl(config, options);
  const registry = await fetchRegistry(registryUrl);
  const summary = findPackSummary(registry, packName);

  if (!summary) {
    throw new Error(`Unknown ContextForge pack "${packName}". Run \`npx @contextforge/cli list\` to see available packs.`);
  }

  const alreadyConfigured = config?.installedPacks.includes(packName) ?? false;

  if (alreadyConfigured && !options.force) {
    console.log(pc.yellow(`${packName} is already installed. Run \`npx @contextforge/cli sync\` to refresh it.`));
    return;
  }

  if (options.dryRun) {
    console.log(pc.cyan(`Dry run: ${packName} would be downloaded from ${registryUrl}.`));
    console.log(pc.dim(`Pack path: ${summary.path}`));
    return;
  }

  const result = await installPackAndSync(root, registryUrl, packName, {
    force: options.force,
    dryRun: false
  });

  console.log(
    result.alreadyInstalled
      ? pc.green(`Reinstalled ${packName}.`)
      : pc.green(`Added ${packName}.`)
  );
  console.log(formatGeneratedFiles(result.generatedFiles));
}
