import path from "node:path";
import { describe, expect, it } from "vitest";
import { saveConfig } from "../config/saveConfig.js";
import { doctorProject } from "../doctor/doctorProject.js";
import { makeTempProject, writeFile, writeJson } from "./helpers.js";

function registryDataUrl(packNames: string[]): string {
  const registry = {
    version: "0.1.0",
    topics: ["database", "testing"],
    packs: packNames.map((packName) => ({
      name: packName,
      title: packName,
      topic: packName === "prisma-migrations" ? "database" : "testing",
      description: `${packName} rules.`,
      path: `packs/${packName}/pack.json`,
      source: {
        provider: "contextforge",
        license: "MIT"
      }
    }))
  };

  return `data:application/json,${encodeURIComponent(JSON.stringify(registry))}`;
}

async function writeCachedPack(root: string, packName: string, topic = "database"): Promise<void> {
  const packRoot = path.join(root, ".contextforge/packs", packName);

  await writeJson(path.join(packRoot, "pack.json"), {
    name: packName,
    title: packName,
    version: "0.1.0",
    topic,
    description: `${packName} rules.`,
    classification: "task-triggered",
    detect: packName === "prisma-migrations" ? { files: ["prisma/schema.prisma"] } : undefined,
    files: [
      {
        type: "agents",
        path: "agents.md",
        output: `.contextforge/instructions/agents/${packName}.md`
      },
      {
        type: "claude",
        path: "claude.md",
        output: `.contextforge/instructions/claude/${packName}.md`
      },
      {
        type: "skill",
        path: "skill.md",
        output: `.agents/skills/${packName}/SKILL.md`
      },
      {
        type: "cursor",
        path: "cursor.mdc",
        output: `.cursor/rules/${packName}.mdc`
      },
      {
        type: "copilot",
        path: "copilot.md",
        output: `.github/instructions/${packName}.instructions.md`
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
  });
  await writeFile(path.join(packRoot, "agents.md"), `# ${packName} agents`);
  await writeFile(path.join(packRoot, "claude.md"), `# ${packName} claude`);
  await writeFile(path.join(packRoot, "skill.md"), `# ${packName} skill`);
  await writeFile(path.join(packRoot, "cursor.mdc"), `# ${packName} cursor`);
  await writeFile(path.join(packRoot, "copilot.md"), `# ${packName} copilot`);
}

describe("doctorProject", () => {
  it("reports missing generated files and mismatched project state", async () => {
    const root = await makeTempProject("doctor");
    const packs = ["prisma-migrations", "test-driven-development"];

    await Promise.all([
      writeFile(path.join(root, "pnpm-lock.yaml")),
      writeJson(path.join(root, "package.json"), {
        scripts: {}
      }),
      writeCachedPack(root, "prisma-migrations"),
      writeCachedPack(root, "test-driven-development", "testing")
    ]);
    await saveConfig(root, {
      version: "0.1.0",
      registry: registryDataUrl(packs),
      tools: ["codex", "claude", "cursor", "copilot"],
      installedPacks: packs,
      defaultCorePacks: [],
      generatedFiles: ["AGENTS.md"]
    });

    const report = await doctorProject(root);
    const messages = report.issues.map((issue) => issue.message);

    expect(messages).toContain("AGENTS.md is missing a ContextForge generated block. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain("CLAUDE.md is missing a ContextForge generated block. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain(".contextforge/skills/prisma-migrations/SKILL.md is missing. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain(".contextforge/agents/codex/prisma-migrations.md is missing. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain(".contextforge/agents/claude/prisma-migrations.md is missing. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain(".contextforge/agents/cursor/prisma-migrations.md is missing. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain(".contextforge/agents/copilot/prisma-migrations.md is missing. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain("test-driven-development is installed, but package.json has no test script.");
    expect(messages.some((message) => message.includes("prisma-migrations is installed"))).toBe(true);
  });

  it("returns an error when config is missing", async () => {
    const root = await makeTempProject("doctor-no-config");
    const report = await doctorProject(root);

    expect(report.issues).toEqual([
      {
        level: "error",
        message: "ContextForge config was not found. Run `npx @contextforge/cli init`."
      }
    ]);
  });
});
