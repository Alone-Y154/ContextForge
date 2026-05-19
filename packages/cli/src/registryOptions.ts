import { DEFAULT_REGISTRY_SOURCES, type ContextForgeConfig } from "@contextforge/core";

export type RegistryCommandOptions = {
  registry?: string[];
};

export function collectRegistryOption(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

function envRegistries(): string[] {
  return (process.env.CONTEXTFORGE_REGISTRY_URL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function resolveRegistrySources(
  config?: ContextForgeConfig,
  options?: RegistryCommandOptions
): string[] {
  const configured = config?.registries?.length ? config.registries : DEFAULT_REGISTRY_SOURCES;
  return [...new Set([...configured, ...envRegistries(), ...(options?.registry ?? [])])];
}
