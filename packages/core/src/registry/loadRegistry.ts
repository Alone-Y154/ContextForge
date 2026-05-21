import path from "node:path";
import { loadCachedPacks } from "./localRegistry.js";
import {
  fetchPackManifest,
  fetchRegistry,
  resolvePackUrl
} from "./remoteRegistry.js";
import type { InstalledPack, PackFileType, RegistryPackSummary } from "./registrySchema.js";

export const OFFICIAL_REGISTRY_SOURCE = "official";
export const OFFICIAL_REGISTRY_URL = "https://registry.contextforge.org/index.json";
export const DEFAULT_REGISTRY_SOURCES = [OFFICIAL_REGISTRY_SOURCE];
export const PROJECT_PACK_CACHE = ".contextforge/packs";

export type LoadRegistryOptions = {
  root?: string;
  sources?: string[];
  timeoutMs?: number;
};

function sourceToUrl(source: string): string {
  return source === OFFICIAL_REGISTRY_SOURCE ? OFFICIAL_REGISTRY_URL : source;
}

export async function loadRegistry(input: string | LoadRegistryOptions = {}) {
  if (typeof input === "string") {
    return fetchRegistry(input);
  }

  const source = input.sources?.[0] ?? OFFICIAL_REGISTRY_SOURCE;
  return fetchRegistry(sourceToUrl(source), input.timeoutMs);
}

export function registrySourceToUrl(source?: string): string {
  return sourceToUrl(source ?? OFFICIAL_REGISTRY_SOURCE);
}

export async function loadRemotePack(
  registryUrl: string,
  summary: RegistryPackSummary,
  timeoutMs?: number
): Promise<InstalledPack> {
  const packUrl = resolvePackUrl(registryUrl, summary.path);
  const manifest = await fetchPackManifest(packUrl, timeoutMs);

  return {
    manifest,
    summary,
    packUrl,
    files: {}
  };
}

export async function loadProjectPacks(root: string): Promise<InstalledPack[]> {
  return loadCachedPacks(path.join(root, PROJECT_PACK_CACHE));
}

export type { PackFileType };
