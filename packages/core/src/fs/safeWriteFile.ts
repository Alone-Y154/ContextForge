import path from "node:path";
import fs from "fs-extra";
import { updateGeneratedBlock } from "./updateGeneratedBlock.js";

export async function safeWriteFile(filePath: string, generatedContent: string): Promise<void> {
  const existingContent = (await fs.pathExists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : null;

  const nextContent = updateGeneratedBlock(existingContent, generatedContent);

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, nextContent);
}
