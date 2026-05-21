import { OFFICIAL_REGISTRY_URL, type ContextForgeConfig } from "@contextforge/core";

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
  const configured = config?.registry ? [config.registry] : [OFFICIAL_REGISTRY_URL];
  return [...new Set([...(options?.registry ?? []), ...envRegistries(), ...configured])];
}

export function resolveRegistryUrl(config?: ContextForgeConfig, options?: RegistryCommandOptions): string {
  return resolveRegistrySources(config, options)[0] ?? OFFICIAL_REGISTRY_URL;
}
