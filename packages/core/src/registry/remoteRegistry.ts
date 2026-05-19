import {
  PackSchema,
  RemoteRegistryIndexSchema,
  type LoadedPack,
  type RemoteRegistryIndex
} from "./registrySchema.js";

const DEFAULT_TIMEOUT_MS = 10_000;

async function fetchText(url: string, required: boolean, timeoutMs: number): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      if (!required && response.status === 404) {
        return undefined;
      }

      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  } catch (error) {
    if (!required) {
      return undefined;
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function resolveUrl(value: string | undefined, baseUrl: string): string | undefined {
  return value ? new URL(value, baseUrl).toString() : undefined;
}

function defaultPackFile(baseUrl: string | undefined, fileName: string): string | undefined {
  return baseUrl ? new URL(fileName, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString() : undefined;
}

export async function loadRemoteRegistry(
  registryUrl: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<LoadedPack[]> {
  const indexText = await fetchText(registryUrl, true, timeoutMs);
  const index = RemoteRegistryIndexSchema.parse(JSON.parse(indexText ?? "{}")) as RemoteRegistryIndex;
  const packs: LoadedPack[] = [];

  for (const entry of index.packs) {
    const baseUrl = resolveUrl(entry.baseUrl, registryUrl);
    const packUrl = resolveUrl(entry.files?.pack, registryUrl) ?? defaultPackFile(baseUrl, "pack.json");
    const rawPack =
      entry.pack ??
      (packUrl ? JSON.parse((await fetchText(packUrl, true, timeoutMs)) ?? "{}") : undefined);

    const parsed = PackSchema.parse({
      ...rawPack,
      name: rawPack?.name ?? entry.name,
      version: rawPack?.version ?? entry.version
    });

    const rulesUrl = resolveUrl(entry.files?.rules, registryUrl) ?? defaultPackFile(baseUrl, "rules.md");

    if (!rulesUrl) {
      throw new Error(`Remote pack "${entry.name}" is missing a rules.md URL.`);
    }

    packs.push({
      ...parsed,
      directory: baseUrl ?? registryUrl,
      source: "remote",
      registryUrl,
      files: {
        rules: (await fetchText(rulesUrl, true, timeoutMs)) ?? "",
        skill: await fetchText(
          resolveUrl(entry.files?.skill, registryUrl) ?? defaultPackFile(baseUrl, "skill.md") ?? "",
          false,
          timeoutMs
        ),
        cursor: await fetchText(
          resolveUrl(entry.files?.cursor, registryUrl) ?? defaultPackFile(baseUrl, "cursor.mdc") ?? "",
          false,
          timeoutMs
        ),
        copilot: await fetchText(
          resolveUrl(entry.files?.copilot, registryUrl) ?? defaultPackFile(baseUrl, "copilot.md") ?? "",
          false,
          timeoutMs
        )
      }
    });
  }

  return packs;
}
