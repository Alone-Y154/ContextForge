import { loadConfig, syncProject } from "@contextforge/core";
import pc from "picocolors";
import { formatGeneratedFiles } from "../format.js";
import { resolveRegistrySources, type RegistryCommandOptions } from "../registryOptions.js";

export async function syncCommand(options: RegistryCommandOptions = {}): Promise<void> {
  const root = process.cwd();
  const config = await loadConfig(root);
  const result = await syncProject(root, {
    ...config,
    registries: resolveRegistrySources(config, options)
  });

  console.log(pc.green("ContextForge synced."));
  console.log(formatGeneratedFiles(result.generatedFiles));
}
