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
  ".contextforge/agents/",
  ".contextforge/skills/"
];

function normalizeOutputPath(outputPath: string): string {
  return outputPath.split(/[\\/]/u).join("/");
}

function defaultOutput(packName: string, type: PackFileType): string | null {
  const defaults: Record<PackFileType, string | null> = {
    rules: null,
    agents: `.contextforge/agents/codex/${packName}.md`,
    claude: `.contextforge/agents/claude/${packName}.md`,
    skill: `.contextforge/skills/${packName}/SKILL.md`,
    cursor: `.contextforge/agents/cursor/${packName}.md`,
    copilot: `.contextforge/agents/copilot/${packName}.md`
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
    return tools.length > 0;
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
  const outputPath = defaultOutput(pack.manifest.name, file.type);

  if (!content || !outputPath) {
    return null;
  }

  return {
    path: normalizeOutputPath(outputPath),
    content: withContextForgePreamble(pack, file.type, content)
  };
}

function withContextForgePreamble(
  pack: InstalledPack,
  type: PackFileType,
  content: string
): string {
  if (
    pack.manifest.name !== "git-workflow" ||
    !["agents", "claude", "cursor", "copilot"].includes(type)
  ) {
    return content;
  }

  const warning =
    "Do not commit, push, merge, rebase, reset, delete branches, or rewrite history unless explicitly requested by the user.";

  if (content.includes(warning)) {
    return content;
  }

  return ["# ContextForge Git Safety", "", warning, "", content.trim()].join("\n");
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
    rootOutputs.push({ path: "AGENTS.md", content: await compileAgentsMd() });
  }

  if (config.tools.includes("claude")) {
    rootOutputs.push({ path: "CLAUDE.md", content: await compileClaudeMd() });
  }

  for (const output of rootOutputs) {
    await safeWriteFile(path.join(root, output.path), output.content);
  }

  const currentFiles = [...packGeneratedOutputs, ...rootOutputs].map((output) => output.path);

  await cleanupStaleGeneratedFiles(root, previousFiles, currentFiles);

  return currentFiles;
}
