import os from "node:os";
import path from "node:path";
import fs from "fs-extra";

export async function makeTempProject(name: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), `contextforge-${name}-`));
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, value, { spaces: 2 });
}

export async function writeFile(filePath: string, value = ""): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, value);
}
