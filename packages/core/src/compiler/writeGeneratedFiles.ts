import path from "node:path";
import type { GeneratedFile } from "../types.js";
import { safeWriteFile } from "../fs/safeWriteFile.js";

export async function writeGeneratedFiles(root: string, outputs: GeneratedFile[]): Promise<string[]> {
  for (const output of outputs) {
    await safeWriteFile(path.join(root, output.path), output.content);
  }

  return outputs.map((output) => output.path);
}
