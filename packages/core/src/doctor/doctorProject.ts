import path from "node:path";
import fs from "fs-extra";
import { CONFIG_PATH, loadConfig } from "../config/loadConfig.js";
import { detectProject } from "../detect/detectProject.js";
import { readPackageJson, hasScript } from "../project/packageJson.js";
import { loadRegistry } from "../registry/loadRegistry.js";
import { packMatchesProject, resolvePacks } from "../registry/resolvePack.js";

export type DoctorIssue = {
  level: "error" | "warning";
  message: string;
};

export type DoctorReport = {
  checks: string[];
  issues: DoctorIssue[];
};

async function fileExists(root: string, relativePath: string): Promise<boolean> {
  return fs.pathExists(path.join(root, relativePath));
}

export async function doctorProject(root: string): Promise<DoctorReport> {
  const checks: string[] = [];
  const issues: DoctorIssue[] = [];
  const resolvedRoot = path.resolve(root);

  if (!(await fileExists(resolvedRoot, CONFIG_PATH))) {
    return {
      checks,
      issues: [
        {
          level: "error",
          message: "ContextForge config was not found. Run `npx @contextforge/cli init`."
        }
      ]
    };
  }

  checks.push("Config found");

  const config = await loadConfig(resolvedRoot);
  const [analysis, registry, packageJson] = await Promise.all([
    detectProject(resolvedRoot),
    loadRegistry({ root: resolvedRoot, sources: config.registries }),
    readPackageJson(resolvedRoot)
  ]);
  const packs = resolvePacks(config.packs, registry);

  const requiredFiles: Array<[boolean, string, string]> = [
    [config.tools.includes("codex"), "AGENTS.md", "Codex instructions found"],
    [config.tools.includes("claude"), "CLAUDE.md", "Claude instructions found"],
    [config.tools.includes("cursor"), ".cursor/rules", "Cursor rules found"],
    [config.tools.includes("copilot"), ".github/copilot-instructions.md", "Copilot instructions found"]
  ];

  for (const [enabled, relativePath, okMessage] of requiredFiles) {
    if (!enabled) {
      continue;
    }

    if (await fileExists(resolvedRoot, relativePath)) {
      checks.push(okMessage);
    } else {
      issues.push({
        level: "error",
        message: `${relativePath} is missing. Run \`npx @contextforge/cli sync\`.`
      });
    }
  }

  for (const generatedFile of config.generatedFiles) {
    if (!(await fileExists(resolvedRoot, generatedFile))) {
      issues.push({
        level: "warning",
        message: `Previously generated file ${generatedFile} is missing.`
      });
    }
  }

  for (const pack of packs) {
    if (!(await packMatchesProject(pack, resolvedRoot, packageJson))) {
      issues.push({
        level: "warning",
        message: `${pack.name} pack is installed, but its detection hints do not match this project.`
      });
    }
  }

  if (
    config.packageManager !== "unknown" &&
    analysis.packageManager !== "unknown" &&
    config.packageManager !== analysis.packageManager
  ) {
    issues.push({
      level: "warning",
      message: `Config says package manager is ${config.packageManager}, but ${analysis.packageManager} was detected.`
    });
  }

  if (config.packs.includes("testing-workflow") && !hasScript(packageJson, "test")) {
    issues.push({
      level: "warning",
      message: "testing-workflow is installed, but package.json has no test script."
    });
  }

  return { checks, issues };
}
