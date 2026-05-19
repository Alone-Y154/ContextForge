import { z } from "zod";
import { DEFAULT_REGISTRY_SOURCES } from "../registry/loadRegistry.js";

export const ToolSchema = z.enum(["codex", "claude", "cursor", "copilot"]);

export const ConfigSchema = z.object({
  version: z.string().default("0.1.0"),
  registries: z.array(z.string()).default(DEFAULT_REGISTRY_SOURCES),
  tools: z.array(ToolSchema).default(["codex", "claude", "cursor", "copilot"]),
  packs: z.array(z.string()).default([]),
  packageManager: z.enum(["pnpm", "npm", "yarn", "bun", "unknown"]).default("unknown"),
  generatedFiles: z.array(z.string()).default([])
});

export type ContextForgeConfig = z.infer<typeof ConfigSchema>;
