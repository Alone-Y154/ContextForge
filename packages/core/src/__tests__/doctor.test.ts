import path from "node:path";
import { describe, expect, it } from "vitest";
import { saveConfig } from "../config/saveConfig.js";
import { doctorProject } from "../doctor/doctorProject.js";
import { makeTempProject, writeFile, writeJson } from "./helpers.js";

async function writeCachedPack(root: string, packName: string, category = "database"): Promise<void> {
  const packRoot = path.join(root, ".contextforge/packs", packName);

  await writeJson(path.join(packRoot, "pack.json"), {
    name: packName,
    title: packName,
    description: `${packName} rules.`,
    category,
    detect: packName === "prisma-migrations" ? { files: ["prisma/schema.prisma"] } : undefined,
    outputs: {
      globalRules: true,
      skill: true,
      cursorRule: true,
      copilotInstruction: true
    }
  });
  await writeFile(path.join(packRoot, "rules.md"), `# ${packName}`);
}

describe("doctorProject", () => {
  it("reports missing generated files and mismatched project state", async () => {
    const root = await makeTempProject("doctor");

    await Promise.all([
      writeFile(path.join(root, "pnpm-lock.yaml")),
      writeJson(path.join(root, "package.json"), {
        scripts: {}
      }),
      writeCachedPack(root, "prisma-migrations"),
      writeCachedPack(root, "testing-workflow", "testing")
    ]);
    await saveConfig(root, {
      version: "0.1.0",
      registries: [],
      tools: ["codex", "claude", "cursor", "copilot"],
      packs: ["prisma-migrations", "testing-workflow"],
      packageManager: "npm",
      generatedFiles: ["AGENTS.md"]
    });

    const report = await doctorProject(root);
    const messages = report.issues.map((issue) => issue.message);

    expect(messages).toContain("AGENTS.md is missing. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain("CLAUDE.md is missing. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain(".cursor/rules is missing. Run `npx @contextforge/cli sync`.");
    expect(messages).toContain(
      ".github/copilot-instructions.md is missing. Run `npx @contextforge/cli sync`."
    );
    expect(messages).toContain(
      "Config says package manager is npm, but pnpm was detected."
    );
    expect(messages).toContain("testing-workflow is installed, but package.json has no test script.");
    expect(messages.some((message) => message.includes("prisma-migrations pack is installed"))).toBe(
      true
    );
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
