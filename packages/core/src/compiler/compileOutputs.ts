import type { ContextForgeConfig } from "../config/configSchema.js";
import { GENERATED_BLOCK_END, GENERATED_BLOCK_START } from "../fs/updateGeneratedBlock.js";
import type { InstalledPack, PackFileType } from "../registry/registrySchema.js";
import type { GeneratedFile, ProjectAnalysis } from "../types.js";

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

function compileRootAgents(packs: InstalledPack[], analysis: ProjectAnalysis): string {
  return [
    "# Project Agent Instructions",
    "",
    GENERATED_BLOCK_START,
    "ContextForge is installed for this repo.",
    "",
    "Before working, read the relevant instruction files in:",
    "",
    "- `.contextforge/agents/codex/`",
    "- `.contextforge/skills/`",
    "",
    "Follow the installed packs listed in `.contextforge/config.json`.",
    "Do not copy these instructions into this file.",
    GENERATED_BLOCK_END
  ].join("\n");
}

function compileRootClaude(packs: InstalledPack[]): string {
  return [
    "# Claude Code Instructions",
    "",
    GENERATED_BLOCK_START,
    "ContextForge is installed for this repo.",
    "",
    "Before working, read the relevant instruction files in:",
    "",
    "- `.contextforge/agents/claude/`",
    "- `.contextforge/skills/`",
    "",
    "Follow the installed packs listed in `.contextforge/config.json`.",
    "Do not copy these instructions into this file.",
    GENERATED_BLOCK_END
  ].join("\n");
}

export function compileOutputs(
  config: ContextForgeConfig,
  packs: InstalledPack[],
  analysis: ProjectAnalysis
): GeneratedFile[] {
  const outputs: GeneratedFile[] = [];

  for (const pack of packs) {
    for (const file of pack.manifest.files) {
      if (!shouldGenerateFile(file.type, config.tools)) {
        continue;
      }

      const content = pack.files[file.type];
      const outputPath = defaultOutput(pack.manifest.name, file.type);

      if (!content || !outputPath) {
        continue;
      }

      outputs.push({
        path: normalizeOutputPath(outputPath),
        content: withContextForgePreamble(pack, file.type, content)
      });
    }
  }

  if (config.tools.includes("codex")) {
    outputs.push({ path: "AGENTS.md", content: compileRootAgents(packs, analysis) });
  }

  if (config.tools.includes("claude")) {
    outputs.push({ path: "CLAUDE.md", content: compileRootClaude(packs) });
  }

  return outputs;
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
