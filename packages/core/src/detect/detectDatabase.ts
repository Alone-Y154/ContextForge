import path from "node:path";
import fg from "fast-glob";
import fs from "fs-extra";

export async function detectDatabase(root: string): Promise<{ prisma: boolean; drizzle: boolean }> {
  const prisma = await fs.pathExists(path.join(root, "prisma/schema.prisma"));
  const drizzleConfigs = await fg("drizzle.config.{js,ts,mjs,mts,cjs,cts}", {
    cwd: root,
    onlyFiles: true,
    dot: true
  });

  return {
    prisma,
    drizzle: drizzleConfigs.length > 0
  };
}
