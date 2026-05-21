import path from "node:path";
import type { GeneratedFile } from "../types.js";
import { safeWriteFile } from "../fs/safeWriteFile.js";
import { cleanupStaleGeneratedFiles } from "./cleanupGeneratedFiles.js";

export async function writeGeneratedFiles(
  root: string,
  outputs: GeneratedFile[],
  previousFiles: string[] = []
): Promise<string[]> {
  const currentFiles = outputs.map((output) => output.path);

  for (const output of outputs) {
    await safeWriteFile(path.join(root, output.path), output.content);
  }

  await cleanupStaleGeneratedFiles(root, previousFiles, currentFiles);

  return currentFiles;
}
