import path from "node:path";
import fs from "fs-extra";
import { z } from "zod";
import type { PackManifest, RegistryPackSummary } from "../registry/registrySchema.js";

export const LOCK_PATH = ".contextforge/lock.json";

const LockSchema = z.object({
  registry: z.string(),
  resolvedAt: z.string(),
  packs: z.record(
    z.string(),
    z.object({
      title: z.string().optional(),
      version: z.string(),
      topic: z.string().optional(),
      classification: z.string().optional(),
      path: z.string(),
      source: z.string(),
      files: z.array(z.string()).optional()
    })
  )
});

export type ContextForgeLock = z.infer<typeof LockSchema>;

export async function loadLock(root: string): Promise<ContextForgeLock | null> {
  const lockPath = path.join(root, LOCK_PATH);

  if (!(await fs.pathExists(lockPath))) {
    return null;
  }

  return LockSchema.parse(await fs.readJson(lockPath));
}

export async function saveLock(root: string, lock: ContextForgeLock): Promise<void> {
  const lockPath = path.join(root, LOCK_PATH);
  await fs.ensureDir(path.dirname(lockPath));
  await fs.writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

export async function updateContextForgeLock(
  root: string,
  registry: string,
  installed: Array<{ manifest: PackManifest; summary?: RegistryPackSummary; packUrl?: string }>
): Promise<ContextForgeLock> {
  const lock: ContextForgeLock = {
    registry,
    resolvedAt: new Date().toISOString(),
    packs: {}
  };

  for (const pack of installed) {
    lock.packs[pack.manifest.name] = {
      title: pack.manifest.title,
      version: pack.manifest.version,
      topic: pack.manifest.topic,
      classification: pack.manifest.classification,
      path: pack.summary?.path ?? `packs/${pack.manifest.name}/pack.json`,
      source: pack.packUrl ?? "",
      files: pack.manifest.files.map((file) => file.type)
    };
  }

  await saveLock(root, lock);
  return lock;
}
