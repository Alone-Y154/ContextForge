import {
  PackManifestSchema,
  RegistryIndexSchema,
  type PackFile,
  type PackManifest,
  type RegistryIndex,
  type RegistryPackSummary
} from "./registrySchema.js";

const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchText(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function resolvePackUrl(registryUrl: string, packPath: string): string {
  return new URL(packPath, registryUrl).toString();
}

export function resolvePackFileUrl(packUrl: string, filePath: string): string {
  return new URL(filePath, packUrl).toString();
}

export async function fetchRegistry(
  registryUrl: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<RegistryIndex> {
  const content = await fetchText(registryUrl, timeoutMs);
  return RegistryIndexSchema.parse(JSON.parse(content));
}

export async function fetchPackManifest(
  packUrl: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<PackManifest> {
  const content = await fetchText(packUrl, timeoutMs);
  return PackManifestSchema.parse(JSON.parse(content));
}

export function findPackSummary(
  registry: RegistryIndex,
  packName: string
): RegistryPackSummary | undefined {
  return registry.packs.find((pack) => pack.name === packName);
}

export async function fetchPackFile(
  packUrl: string,
  file: PackFile,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<string> {
  return fetchText(resolvePackFileUrl(packUrl, file.path), timeoutMs);
}

function sortRegistryPacks(registry: RegistryIndex): RegistryPackSummary[] {
  return [...registry.packs].sort((a, b) => a.topic.localeCompare(b.topic) || a.name.localeCompare(b.name));
}

export function listRegistryPacks(registry: RegistryIndex): RegistryPackSummary[];
export function listRegistryPacks(registryUrl: string): Promise<RegistryPackSummary[]>;
export function listRegistryPacks(
  input: RegistryIndex | string
): RegistryPackSummary[] | Promise<RegistryPackSummary[]> {
  if (typeof input === "string") {
    return fetchRegistry(input).then(sortRegistryPacks);
  }

  return sortRegistryPacks(input);
}

export function searchRegistryPacks(
  registry: RegistryIndex,
  query: string
): RegistryPackSummary[];
export function searchRegistryPacks(
  registryUrl: string,
  query: string
): Promise<RegistryPackSummary[]>;
export function searchRegistryPacks(
  input: RegistryIndex | string,
  query: string
): RegistryPackSummary[] | Promise<RegistryPackSummary[]> {
  if (typeof input === "string") {
    return fetchRegistry(input).then((registry) => searchRegistryPacks(registry, query));
  }

  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return sortRegistryPacks(input);
  }

  return sortRegistryPacks(input).filter((pack) =>
    [pack.name, pack.title, pack.description, pack.topic]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}
