import { fetchRegistry, searchRegistryPacks } from "@contextforge/core";
import pc from "picocolors";
import { resolveRegistryUrl, type RegistryCommandOptions } from "../registryOptions.js";

export async function searchCommand(query: string, options: RegistryCommandOptions = {}): Promise<void> {
  const registryUrl = resolveRegistryUrl(undefined, options);
  const registry = await fetchRegistry(registryUrl);
  const results = searchRegistryPacks(registry, query);

  if (results.length === 0) {
    console.log(pc.yellow(`No packs found for "${query}".`));
    return;
  }

  console.log(pc.bold(`ContextForge packs matching "${query}"`));
  console.log("");

  for (const pack of results) {
    console.log(`${pc.green(pack.name)} ${pc.dim(`[${pack.topic}]`)}`);
    console.log(`  ${pack.title}`);
    if (pack.description) {
      console.log(`  ${pc.dim(pack.description)}`);
    }
  }
}
