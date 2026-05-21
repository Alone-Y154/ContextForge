import path from "node:path";
import fs from "fs-extra";
import { getGeneratedBlock, removeGeneratedBlock } from "../fs/updateGeneratedBlock.js";

function isGeneratedOnlyPath(relativePath: string): boolean {
  return (
    relativePath.startsWith(".agents/skills/") ||
    relativePath.startsWith(".cursor/rules/") ||
    relativePath.startsWith(".github/instructions/") ||
    relativePath.startsWith(".contextforge/instructions/") ||
    relativePath.startsWith(".contextforge/agents/") ||
    relativePath.startsWith(".contextforge/skills/")
  );
}

async function cleanupFile(root: string, relativePath: string): Promise<void> {
  const filePath = path.join(root, relativePath);

  if (!(await fs.pathExists(filePath))) {
    return;
  }

  if (isGeneratedOnlyPath(relativePath)) {
    await fs.remove(filePath);
    return;
  }

  const content = await fs.readFile(filePath, "utf8");

  if (!getGeneratedBlock(content)) {
    return;
  }

  const nextContent = removeGeneratedBlock(content);

  if (nextContent.trim().length === 0) {
    await fs.remove(filePath);
    return;
  }

  await fs.writeFile(filePath, `${nextContent}\n`);
}

export async function cleanupStaleGeneratedFiles(
  root: string,
  previousFiles: string[],
  currentFiles: string[]
): Promise<void> {
  const current = new Set(currentFiles);
  const staleFiles = [...new Set(previousFiles)].filter((file) => !current.has(file));

  for (const staleFile of staleFiles) {
    await cleanupFile(root, staleFile);
  }
}
