import { z } from "zod";

export const PackSchema = z.object({
  name: z.string().min(1),
  version: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["framework", "database", "testing", "security", "ui", "workflow"]),
  detect: z
    .object({
      files: z.array(z.string()).optional(),
      packages: z.array(z.string()).optional()
    })
    .optional(),
  outputs: z.object({
    globalRules: z.boolean().default(true),
    skill: z.boolean().default(false),
    cursorRule: z.boolean().default(true),
    copilotInstruction: z.boolean().default(true)
  })
});

export type Pack = z.infer<typeof PackSchema>;

export type LoadedPack = Pack & {
  directory: string;
  source: "project-cache" | "remote" | "local";
  registryUrl?: string;
  files: {
    rules: string;
    skill?: string;
    cursor?: string;
    copilot?: string;
  };
};

export const RemotePackFilesSchema = z.object({
  pack: z.string().optional(),
  rules: z.string().optional(),
  skill: z.string().optional(),
  cursor: z.string().optional(),
  copilot: z.string().optional()
});

export const RemotePackEntrySchema = z
  .object({
    name: z.string().min(1),
    version: z.string().optional(),
    baseUrl: z.string().optional(),
    pack: PackSchema.optional(),
    files: RemotePackFilesSchema.optional()
  })
  .refine((entry) => Boolean(entry.baseUrl || entry.pack || entry.files?.pack), {
    message: "Remote pack entry must include baseUrl, inline pack metadata, or files.pack"
  });

export const RemoteRegistryIndexSchema = z.object({
  version: z.string().default("1"),
  packs: z.array(RemotePackEntrySchema)
});

export type RemoteRegistryIndex = z.infer<typeof RemoteRegistryIndexSchema>;
