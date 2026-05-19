import path from "node:path";
import { loadLocalRegistry } from "./localRegistry.js";
import { loadRemoteRegistry } from "./remoteRegistry.js";
import type { LoadedPack } from "./registrySchema.js";

export const OFFICIAL_REGISTRY_SOURCE = "official";
export const OFFICIAL_REGISTRY_URL = "https://registry.contextforge.dev/index.json";
export const DEFAULT_REGISTRY_SOURCES = [OFFICIAL_REGISTRY_SOURCE];
export const PROJECT_PACK_CACHE = ".contextforge/packs";

export type LoadRegistryOptions = {
  root?: string;
  sources?: string[];
  timeoutMs?: number;
};

function mergePacks(packs: LoadedPack[]): LoadedPack[] {
  const byName = new Map<string, LoadedPack>();

  for (const pack of packs) {
    if (!byName.has(pack.name)) {
      byName.set(pack.name, pack);
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function loadRegistrySource(source: string, timeoutMs?: number): Promise<LoadedPack[]> {
  if (source === OFFICIAL_REGISTRY_SOURCE) {
    try {
      return await loadRemoteRegistry(OFFICIAL_REGISTRY_URL, timeoutMs ?? 1_500);
    } catch {
      return [];
    }
  }

  return loadRemoteRegistry(source, timeoutMs);
}

export async function loadRegistry(
  input: string | LoadRegistryOptions = {}
): Promise<LoadedPack[]> {
  if (typeof input === "string") {
    return mergePacks(await loadLocalRegistry(input, "local"));
  }

  const sources = input.sources ?? DEFAULT_REGISTRY_SOURCES;
  const packs: LoadedPack[] = [];

  if (input.root) {
    packs.push(...(await loadLocalRegistry(path.join(input.root, PROJECT_PACK_CACHE), "project-cache")));
  }

  for (const source of sources) {
    packs.push(...(await loadRegistrySource(source, input.timeoutMs)));
  }

  return mergePacks(packs);
}
