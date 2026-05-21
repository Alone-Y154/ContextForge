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

describe("doctorProject", () => {
  it("reports missing generated files and mismatched project state", async () => {
    const root = await makeTempProject("doctor");
    const packs = ["prisma-migrations", "test-driven-development"];

    await Promise.all([
      writeFile(path.join(root, "pnpm-lock.yaml")),
      writeJson(path.join(root, "package.json"), {
        scripts: {}
      })
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
    expect(messages).toContain(".contextforge/lock.json is missing. Run `npx @contextforge/cli sync`.");
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
