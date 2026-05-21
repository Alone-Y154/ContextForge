import path from "node:path";
import fs from "fs-extra";
import type { ContextForgeConfig } from "../config/configSchema.js";
import { safeWriteFile } from "../fs/safeWriteFile.js";
import type { GeneratedFile } from "../types.js";
import type { InstalledPack, PackFile, PackFileType } from "../registry/registrySchema.js";
import { cleanupStaleGeneratedFiles } from "./cleanupGeneratedFiles.js";
import { compileAgentsMd } from "./compileAgentsMd.js";
import { compileClaudeMd } from "./compileClaudeMd.js";

const GENERATED_ONLY_PREFIXES = [
  ".agents/skills/",
  ".cursor/rules/",
  ".github/instructions/",
  ".contextforge/instructions/"
];

function normalizeOutputPath(outputPath: string): string {
  return outputPath.split(/[\\/]/u).join("/");
}

function defaultOutput(packName: string, type: PackFileType): string | null {
  const defaults: Record<PackFileType, string | null> = {
    rules: null,
    agents: `.contextforge/instructions/agents/${packName}.md`,
    claude: `.contextforge/instructions/claude/${packName}.md`,
    skill: `.agents/skills/${packName}/SKILL.md`,
    cursor: `.cursor/rules/${packName}.mdc`,
    copilot: `.github/instructions/${packName}.instructions.md`
  };

  return defaults[type];
}

function shouldGenerateFile(type: PackFileType, tools: ContextForgeConfig["tools"]): boolean {
  if (type === "agents") {
    return tools.includes("codex");
  }

  if (type === "claude") {
    return tools.includes("claude");
  }

  if (type === "skill") {
    return tools.includes("codex") || tools.includes("claude");
  }

  if (type === "cursor") {
    return tools.includes("cursor");
  }

  if (type === "copilot") {
    return tools.includes("copilot");
  }

  return false;
}

function generatedFileFromPack(pack: InstalledPack, file: PackFile): GeneratedFile | null {
  const content = pack.files[file.type];
  const outputPath = file.output ?? defaultOutput(pack.manifest.name, file.type);

  if (!content || !outputPath) {
    return null;
  }

  return {
    path: normalizeOutputPath(outputPath),
    content
  };
}

async function writeGeneratedOnlyFile(root: string, output: GeneratedFile): Promise<void> {
  const filePath = path.join(root, output.path);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, output.content.endsWith("\n") ? output.content : `${output.content}\n`);
}

function packOutputs(pack: InstalledPack, tools: ContextForgeConfig["tools"]): GeneratedFile[] {
  return pack.manifest.files
    .filter((file) => shouldGenerateFile(file.type, tools))
    .map((file) => generatedFileFromPack(pack, file))
    .filter((file): file is GeneratedFile => Boolean(file));
}

export async function generateToolOutputs(
  root: string,
  packs: InstalledPack[],
  config: ContextForgeConfig,
  previousFiles: string[] = []
): Promise<string[]> {
  const packGeneratedOutputs = packs.flatMap((pack) => packOutputs(pack, config.tools));

  for (const output of packGeneratedOutputs) {
    const isGeneratedOnly = GENERATED_ONLY_PREFIXES.some((prefix) => output.path.startsWith(prefix));

    if (isGeneratedOnly) {
      await writeGeneratedOnlyFile(root, output);
    } else {
      await safeWriteFile(path.join(root, output.path), output.content);
    }
  }

  const rootOutputs: GeneratedFile[] = [];

  if (config.tools.includes("codex")) {
    rootOutputs.push({ path: "AGENTS.md", content: await compileAgentsMd(root, packs) });
  }

  if (config.tools.includes("claude")) {
    rootOutputs.push({ path: "CLAUDE.md", content: await compileClaudeMd(root, packs) });
  }

  for (const output of rootOutputs) {
    await safeWriteFile(path.join(root, output.path), output.content);
  }

  const currentFiles = [...packGeneratedOutputs, ...rootOutputs].map((output) => output.path);

  await cleanupStaleGeneratedFiles(root, previousFiles, currentFiles);

  return currentFiles;
}
