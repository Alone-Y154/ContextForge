import path from "node:path";
import fs from "fs-extra";
import { describe, expect, it } from "vitest";
import { compileOutputs } from "../compiler/compileOutputs.js";
import { safeWriteFile } from "../fs/safeWriteFile.js";
import { updateGeneratedBlock } from "../fs/updateGeneratedBlock.js";
import type { ContextForgeConfig } from "../config/configSchema.js";
import type { LoadedPack } from "../registry/registrySchema.js";
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

  it("only compiles outputs for enabled tools", async () => {
    const packs: LoadedPack[] = [
      {
        name: "prisma-migrations",
        title: "Prisma Migration Workflow",
        description: "Rules for Prisma migrations.",
        category: "database",
        directory: "/registry/prisma-migrations",
        source: "remote",
        outputs: {
          globalRules: true,
          skill: true,
          cursorRule: true,
          copilotInstruction: true
        },
        files: {
          rules: "# Prisma Rules",
          skill: "# Prisma Skill",
          cursor: "# Prisma Cursor",
          copilot: "# Prisma Copilot"
        }
      }
    ];
    const config: ContextForgeConfig = {
      version: "0.1.0",
      registries: ["official"],
      tools: ["codex", "cursor"],
      packs: ["prisma-migrations"],
      packageManager: "pnpm",
      generatedFiles: []
    };

    const outputs = compileOutputs(config, packs, analysis).map((output) => output.path);

    expect(outputs).toContain("AGENTS.md");
    expect(outputs).toContain(".agents/skills/prisma-migrations/SKILL.md");
    expect(outputs).toContain(".cursor/rules/contextforge.mdc");
    expect(outputs).toContain(".cursor/rules/prisma-migrations.mdc");
    expect(outputs).not.toContain("CLAUDE.md");
    expect(outputs).not.toContain(".github/copilot-instructions.md");
  });
});
