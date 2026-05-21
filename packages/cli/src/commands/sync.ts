import { loadConfig, syncProject } from "@contextforge/core";
import pc from "picocolors";
import { formatGeneratedFiles } from "../format.js";
import { resolveRegistryUrl, type RegistryCommandOptions } from "../registryOptions.js";

export async function syncCommand(options: RegistryCommandOptions = {}): Promise<void> {
  const root = process.cwd();
  const config = await loadConfig(root);
  const registry = resolveRegistryUrl(config, options);
  const result = await syncProject(root, {
    ...config,
    registry
  });

  console.log(pc.green("ContextForge synced."));
  console.log(formatGeneratedFiles(result.generatedFiles));
}
