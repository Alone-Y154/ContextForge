import { fetchRegistry, listRegistryPacks } from "@contextforge/core";
import pc from "picocolors";
import { resolveRegistryUrl, type RegistryCommandOptions } from "../registryOptions.js";

export async function listCommand(options: RegistryCommandOptions = {}): Promise<void> {
  const registryUrl = resolveRegistryUrl(undefined, options);
  const registry = await fetchRegistry(registryUrl);
  const packs = listRegistryPacks(registry);
  const topics = new Map<string, typeof packs>();

  for (const pack of packs) {
    const topicPacks = topics.get(pack.topic) ?? [];
    topicPacks.push(pack);
    topics.set(pack.topic, topicPacks);
  }

  console.log(pc.bold("ContextForge Registry"));
  console.log(pc.dim(registryUrl));
  console.log("");

  for (const [topic, topicPacks] of topics) {
    console.log(pc.bold(topic));
    for (const pack of topicPacks) {
      console.log(`  ${pc.green(pack.name)} - ${pack.title}`);
      if (pack.description) {
        console.log(`    ${pc.dim(pack.description)}`);
      }
    }
    console.log("");
  }
}
