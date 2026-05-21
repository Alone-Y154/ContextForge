import path from "node:path";
import fs from "fs-extra";
import { describe, expect, it } from "vitest";
import { compileOutputs } from "../compiler/compileOutputs.js";
import { writeGeneratedFiles } from "../compiler/writeGeneratedFiles.js";
import { safeWriteFile } from "../fs/safeWriteFile.js";
import { updateGeneratedBlock } from "../fs/updateGeneratedBlock.js";
import type { ContextForgeConfig } from "../config/configSchema.js";
import type { InstalledPack } from "../registry/registrySchema.js";
import type { ProjectAnalysis } from "../types.js";
import { makeTempProject, writeFile } from "./helpers.js";

const analysis: ProjectAnalysis = {
  root: "/tmp/project",
  packageManager: "pnpm",
  framework: "next-app-router",
  language: "typescript",
  styling: {
    tailwind: true,
    shadcn: false
  },
  database: {
    prisma: true,
    drizzle: false
  },
  services: {
    supabase: false
  },
  testing: {
    vitest: true,
    jest: false,
    playwright: false
  },
  aiTools: {
    agentsMd: false,
    claudeMd: false,
    cursorRules: false,
    copilotInstructions: false
  }
};

const prismaPack: InstalledPack = {
  manifest: {
    name: "prisma-migrations",
    title: "Prisma Migration Workflow",
    version: "1.0.0",
    topic: "database",
    description: "Rules for Prisma migrations.",
    classification: "task-triggered",
    files: [
      {
        type: "agents",
        path: "agents.md",
        output: ".contextforge/instructions/agents/prisma-migrations.md"
      },
      {
        type: "claude",
        path: "claude.md",
        output: ".contextforge/instructions/claude/prisma-migrations.md"
      },
      {
        type: "skill",
        path: "skill.md",
        output: ".agents/skills/prisma-migrations/SKILL.md"
      },
      {
        type: "cursor",
        path: "cursor.mdc",
        output: ".cursor/rules/prisma-migrations.mdc"
      },
      {
        type: "copilot",
        path: "copilot.md",
        output: ".github/instructions/prisma-migrations.instructions.md"
      }
    ],
    outputs: {
      globalRules: true,
      agentsInstruction: true,
      claudeInstruction: true,
      skill: true,
      cursorRule: true,
      copilotInstruction: true
    }
  },
  files: {
    agents: "# Prisma Agent Summary",
    claude: "# Prisma Claude Summary",
    skill: "# Prisma Skill",
    cursor: "# Prisma Cursor",
    copilot: "# Prisma Copilot"
  }
};

describe("compiler", () => {
  it("preserves user content when replacing generated blocks", () => {
    const first = updateGeneratedBlock("# Notes\n\nmanual", "generated v1");
    const second = updateGeneratedBlock(first, "generated v2");

    expect(second).toContain("# Notes");
    expect(second).toContain("manual");
    expect(second).toContain("generated v2");
    expect(second).not.toContain("generated v1");
  });

  it("writes generated blocks without overwriting existing files", async () => {
    const root = await makeTempProject("safe-write");
    const filePath = path.join(root, "AGENTS.md");

    await writeFile(filePath, "# Existing\n\nKeep this.");
    await safeWriteFile(filePath, "Generated content");

    const content = await fs.readFile(filePath, "utf8");
    expect(content).toContain("Keep this.");
    expect(content).toContain("<!-- contextforge:start -->");
    expect(content).toContain("Generated content");
  });

  it("cleans stale generated files while preserving user-authored content", async () => {
    const root = await makeTempProject("stale-cleanup");
    const agentsPath = path.join(root, "AGENTS.md");
    const skillPath = path.join(root, ".agents/skills/prisma-migrations/SKILL.md");

    await writeFile(
      agentsPath,
      [
        "# Existing agent notes",
        "",
        "Keep this guidance.",
        "",
        "<!-- contextforge:start -->",
        "Old generated content",
        "<!-- contextforge:end -->"
      ].join("\n")
    );
    await writeFile(
      skillPath,
      [
        "---",
        "name: prisma-migrations",
        "---",
        "",
        "<!-- contextforge:start -->",
        "Old skill content",
        "<!-- contextforge:end -->"
      ].join("\n")
    );

    await writeGeneratedFiles(
      root,
      [{ path: "CLAUDE.md", content: "# Claude content" }],
      ["AGENTS.md", ".agents/skills/prisma-migrations/SKILL.md"]
    );

    const agentsContent = await fs.readFile(agentsPath, "utf8");
    expect(agentsContent).toContain("Keep this guidance.");
    expect(agentsContent).not.toContain("Old generated content");
    expect(await fs.pathExists(skillPath)).toBe(false);
    expect(await fs.pathExists(path.join(root, "CLAUDE.md"))).toBe(true);
  });

  it("only compiles outputs for enabled tools", async () => {
    const packs: InstalledPack[] = [prismaPack];
    const config: ContextForgeConfig = {
      version: "0.1.0",
      registry: "https://registry.contextforge.org/index.json",
      tools: ["codex", "cursor"],
      installedPacks: ["prisma-migrations"],
      defaultCorePacks: [],
      generatedFiles: []
    };

    const outputs = compileOutputs(config, packs, analysis).map((output) => output.path);

    expect(outputs).toContain("AGENTS.md");
    expect(outputs).toContain(".contextforge/agents/codex/prisma-migrations.md");
    expect(outputs).toContain(".contextforge/skills/prisma-migrations/SKILL.md");
    expect(outputs).toContain(".contextforge/agents/cursor/prisma-migrations.md");
    expect(outputs).not.toContain("CLAUDE.md");
    expect(outputs).not.toContain(".agents/skills/prisma-migrations/SKILL.md");
    expect(outputs).not.toContain(".cursor/rules/prisma-migrations.mdc");
    expect(outputs).not.toContain(".github/instructions/prisma-migrations.instructions.md");
  });

  it("compiles Claude instructions and skills when only Claude is enabled", async () => {
    const config: ContextForgeConfig = {
      version: "0.1.0",
      registry: "https://registry.contextforge.org/index.json",
      tools: ["claude"],
      installedPacks: ["prisma-migrations"],
      defaultCorePacks: [],
      generatedFiles: []
    };

    const outputs = compileOutputs(config, [prismaPack], analysis).map((output) => output.path);

    expect(outputs).toEqual([
      ".contextforge/agents/claude/prisma-migrations.md",
      ".contextforge/skills/prisma-migrations/SKILL.md",
      "CLAUDE.md"
    ]);
  });

  it("compiles Copilot instructions and skills without GitHub outputs", async () => {
    const config: ContextForgeConfig = {
      version: "0.1.0",
      registry: "https://registry.contextforge.org/index.json",
      tools: ["copilot"],
      installedPacks: ["prisma-migrations"],
      defaultCorePacks: [],
      generatedFiles: []
    };

    const outputs = compileOutputs(config, [prismaPack], analysis).map((output) => output.path);

    expect(outputs).toEqual([
      ".contextforge/skills/prisma-migrations/SKILL.md",
      ".contextforge/agents/copilot/prisma-migrations.md"
    ]);
  });

  it("compiles all agent-specific files when all tools are enabled", async () => {
    const config: ContextForgeConfig = {
      version: "0.1.0",
      registry: "https://registry.contextforge.org/index.json",
      tools: ["codex", "claude", "cursor", "copilot"],
      installedPacks: ["prisma-migrations"],
      defaultCorePacks: [],
      generatedFiles: []
    };

    const outputs = compileOutputs(config, [prismaPack], analysis);
    const paths = outputs.map((output) => output.path);
    const agentsContent = outputs.find((output) => output.path === "AGENTS.md")?.content;

    expect(paths).toContain("AGENTS.md");
    expect(paths).toContain("CLAUDE.md");
    expect(paths).toContain(".contextforge/agents/codex/prisma-migrations.md");
    expect(paths).toContain(".contextforge/agents/claude/prisma-migrations.md");
    expect(paths).toContain(".contextforge/agents/cursor/prisma-migrations.md");
    expect(paths).toContain(".contextforge/agents/copilot/prisma-migrations.md");
    expect(paths).toContain(".contextforge/skills/prisma-migrations/SKILL.md");
    expect(paths).not.toContain(".agents/skills/prisma-migrations/SKILL.md");
    expect(paths).not.toContain(".cursor/rules/prisma-migrations.mdc");
    expect(paths).not.toContain(".github/instructions/prisma-migrations.instructions.md");
    expect(agentsContent).toContain(".contextforge/agents/codex/");
    expect(agentsContent).not.toContain("Prisma Agent Summary");
  });
});
