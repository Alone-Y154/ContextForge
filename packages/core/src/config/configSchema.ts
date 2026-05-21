import { z } from "zod";
import { OFFICIAL_REGISTRY_URL } from "../registry/loadRegistry.js";

export const ToolSchema = z.enum(["codex", "claude", "cursor", "copilot"]);
export type AITool = z.infer<typeof ToolSchema>;

export const DEFAULT_TOOLS: AITool[] = ["codex", "claude", "cursor", "copilot"];

export const DEFAULT_CORE_PACKS = [
  "verification-before-completion",
  "systematic-debugging",
  "code-review",
  "git-workflow",
  "dependency-management",
  "diataxis-docs"
] as const;

const CurrentConfigSchema = z.object({
  version: z.string().default("0.1.0"),
  registry: z.string().default(OFFICIAL_REGISTRY_URL),
  tools: z.array(ToolSchema).default(DEFAULT_TOOLS),
  installedPacks: z.array(z.string()).default([]),
  defaultCorePacks: z.array(z.string()).default([...DEFAULT_CORE_PACKS]),
  generatedFiles: z.array(z.string()).default([])
});

const LegacyConfigSchema = z.object({
  version: z.string().optional(),
  registries: z.array(z.string()).optional(),
  tools: z.array(ToolSchema).optional(),
  packs: z.array(z.string()).optional(),
  packageManager: z.string().optional(),
  generatedFiles: z.array(z.string()).optional()
});

export type ContextForgeConfig = z.infer<typeof CurrentConfigSchema>;

export function normalizeConfig(raw: unknown): ContextForgeConfig {
  const current = CurrentConfigSchema.safeParse(raw);

  if (current.success && "installedPacks" in (raw as Record<string, unknown>)) {
    return current.data;
  }

  const legacy = LegacyConfigSchema.safeParse(raw);

  if (legacy.success) {
    return CurrentConfigSchema.parse({
      version: legacy.data.version ?? "0.1.0",
      registry: legacy.data.registries?.find((source) => source !== "official") ?? OFFICIAL_REGISTRY_URL,
      tools: legacy.data.tools ?? DEFAULT_TOOLS,
      installedPacks: legacy.data.packs ?? [],
      defaultCorePacks: [...DEFAULT_CORE_PACKS],
      generatedFiles: legacy.data.generatedFiles ?? []
    });
  }

  return CurrentConfigSchema.parse(raw);
}

export const ConfigSchema = {
  parse: normalizeConfig
};
