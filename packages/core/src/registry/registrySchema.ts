import { z } from "zod";

export const PackFileTypeSchema = z.enum([
  "rules",
  "agents",
  "claude",
  "skill",
  "cursor",
  "copilot"
]);

export type PackFileType = z.infer<typeof PackFileTypeSchema>;

export const RegistryPackSourceSchema = z
  .object({
    provider: z.string().optional(),
    license: z.string().optional()
  })
  .catchall(z.unknown())
  .optional();

export const RegistryPackSummarySchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  topic: z.string().min(1),
  description: z.string().default(""),
  path: z.string().min(1),
  source: RegistryPackSourceSchema
});

export const RegistryIndexSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  schemaVersion: z.string().optional(),
  description: z.string().optional(),
  topics: z.array(z.string()).default([]),
  packs: z.array(RegistryPackSummarySchema)
});

export const PackFileSchema = z.object({
  type: PackFileTypeSchema,
  path: z.string().min(1),
  output: z.string().optional(),
  mode: z.string().optional()
});

const PackOutputsSchema = z
  .object({
    globalRules: z.boolean().optional(),
    agentsInstruction: z.boolean().optional(),
    claudeInstruction: z.boolean().optional(),
    skill: z.boolean().optional(),
    cursorRule: z.boolean().optional(),
    copilotInstruction: z.boolean().optional()
  })
  .default({})
  .transform((outputs) => ({
    globalRules: outputs.globalRules ?? true,
    agentsInstruction: outputs.agentsInstruction ?? true,
    claudeInstruction: outputs.claudeInstruction ?? true,
    skill: outputs.skill ?? true,
    cursorRule: outputs.cursorRule ?? true,
    copilotInstruction: outputs.copilotInstruction ?? true
  }));

export const PackManifestSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  version: z.string().default("0.0.0"),
  topic: z.string().min(1),
  description: z.string().default(""),
  classification: z
    .enum(["always-referenced", "task-triggered", "permission-gated"])
    .default("task-triggered"),
  source: RegistryPackSourceSchema,
  detect: z
    .object({
      files: z.array(z.string()).optional(),
      packages: z.array(z.string()).optional()
    })
    .optional(),
  files: z.array(PackFileSchema).default([]),
  outputs: PackOutputsSchema
});

export type RegistryIndex = z.infer<typeof RegistryIndexSchema>;
export type RegistryPackSummary = z.infer<typeof RegistryPackSummarySchema>;
export type PackFile = z.infer<typeof PackFileSchema>;
export type PackManifest = z.infer<typeof PackManifestSchema>;

export type InstalledPack = {
  manifest: PackManifest;
  summary?: RegistryPackSummary;
  packUrl?: string;
  files: Partial<Record<PackFileType, string>>;
};

// Backwards-compatible aliases for older call sites/tests while the runtime now uses PackManifest.
export const PackSchema = PackManifestSchema;
export type Pack = PackManifest;
export type LoadedPack = InstalledPack & {
  directory: string;
  source: "project-cache" | "remote" | "local";
  registryUrl?: string;
  fileContents?: Partial<Record<PackFileType, string>>;
  filesByType?: Partial<Record<PackFileType, string>>;
};
