import path from "node:path";
import fs from "fs-extra";
import { LOCK_PATH, loadLock } from "../config/lockFile.js";
import { CONFIG_PATH, loadConfig } from "../config/loadConfig.js";
import { detectProject } from "../detect/detectProject.js";
import { getGeneratedBlock } from "../fs/updateGeneratedBlock.js";
import { hasScript, readPackageJson } from "../project/packageJson.js";
import { fetchRegistry } from "../registry/remoteRegistry.js";
import { recommendPackNames } from "../registry/resolvePack.js";

export type DoctorIssue = {
  level: "error" | "warning";
  message: string;
};

export type DoctorReport = {
  checks: string[];
  issues: DoctorIssue[];
};

export type DoctorOptions = {
  registry?: string;
};

async function fileExists(root: string, relativePath: string): Promise<boolean> {
  return fs.pathExists(path.join(root, relativePath));
}

async function readIfExists(root: string, relativePath: string): Promise<string | null> {
  const filePath = path.join(root, relativePath);

  if (!(await fs.pathExists(filePath))) {
    return null;
  }

  return fs.readFile(filePath, "utf8");
}

function hasContextForgeBlock(content: string | null): boolean {
  return Boolean(content && getGeneratedBlock(content));
}

function tooLarge(content: string | null): boolean {
  return Boolean(content && content.length > 20_000);
}

function expectedGeneratedOutputs(packName: string, tools: string[]): string[] {
  const outputs: string[] = [];

  if (tools.length > 0) {
    outputs.push(`.contextforge/skills/${packName}/SKILL.md`);
  }

  if (tools.includes("codex")) {
    outputs.push(`.contextforge/agents/codex/${packName}.md`);
  }

  if (tools.includes("claude")) {
    outputs.push(`.contextforge/agents/claude/${packName}.md`);
  }

  if (tools.includes("cursor")) {
    outputs.push(`.contextforge/agents/cursor/${packName}.md`);
  }

  if (tools.includes("copilot")) {
    outputs.push(`.contextforge/agents/copilot/${packName}.md`);
  }

  return outputs;
}

export async function doctorProject(
  root: string,
  options: DoctorOptions = {}
): Promise<DoctorReport> {
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
  const registryUrl = options.registry ?? config.registry;
  const [analysis, packageJson, lock] = await Promise.all([
    detectProject(resolvedRoot),
    readPackageJson(resolvedRoot),
    loadLock(resolvedRoot)
  ]);

  let registryPacks = new Set<string>();

  try {
    const registry = await fetchRegistry(registryUrl);
    registryPacks = new Set(registry.packs.map((pack) => pack.name));
    checks.push("Registry reachable");
  } catch (error) {
    issues.push({
      level: "error",
      message: `Registry ${registryUrl} is not reachable: ${error instanceof Error ? error.message : String(error)}`
    });
  }

  if (lock) {
    checks.push("Lock file found");
  } else {
    issues.push({
      level: "warning",
      message: `${LOCK_PATH} is missing. Run \`npx @contextforge/cli sync\`.`
    });
  }

  for (const packName of config.installedPacks) {
    if (registryPacks.size > 0 && !registryPacks.has(packName)) {
      issues.push({
        level: "error",
        message: `${packName} is installed in config, but no longer exists in the registry.`
      });
    }

    if (lock && !lock.packs[packName]) {
      issues.push({
        level: "warning",
        message: `${packName} is installed in config, but missing from ${LOCK_PATH}. Run \`npx @contextforge/cli sync\`.`
      });
    }

    for (const output of expectedGeneratedOutputs(packName, config.tools)) {
      if (!(await fileExists(resolvedRoot, output))) {
        issues.push({
          level: "error",
          message: `${output} is missing. Run \`npx @contextforge/cli sync\`.`
        });
      }
    }
  }

  const agentsMd = await readIfExists(resolvedRoot, "AGENTS.md");
  const claudeMd = await readIfExists(resolvedRoot, "CLAUDE.md");

  if (config.tools.includes("codex")) {
    if (hasContextForgeBlock(agentsMd)) {
      checks.push("AGENTS.md ContextForge block found");
    } else {
      issues.push({
        level: "error",
        message: "AGENTS.md is missing a ContextForge generated block. Run `npx @contextforge/cli sync`."
      });
    }
  }

  if (config.tools.includes("claude")) {
    if (hasContextForgeBlock(claudeMd)) {
      checks.push("CLAUDE.md ContextForge block found");
    } else {
      issues.push({
        level: "error",
        message: "CLAUDE.md is missing a ContextForge generated block. Run `npx @contextforge/cli sync`."
      });
    }
  }

  if (tooLarge(agentsMd)) {
    issues.push({
      level: "warning",
      message: "AGENTS.md is large. Root instructions should stay concise; detailed content belongs in pack files and skills."
    });
  }

  if (tooLarge(claudeMd)) {
    issues.push({
      level: "warning",
      message: "CLAUDE.md is large. Root instructions should stay concise; detailed content belongs in pack files."
    });
  }

  if (config.installedPacks.includes("git-workflow")) {
    const generatedGitFiles = await Promise.all(
      ["codex", "claude", "cursor", "copilot"].map((tool) =>
        readIfExists(resolvedRoot, `.contextforge/agents/${tool}/git-workflow.md`)
      )
    );
    const gitSummary = [
      ...generatedGitFiles,
      agentsMd,
      claudeMd
    ]
      .filter((content): content is string => Boolean(content))
      .join("\n")
      .toLowerCase();

    if (
      !gitSummary.includes("do not commit") ||
      !gitSummary.includes("push") ||
      !gitSummary.includes("explicitly")
    ) {
      issues.push({
        level: "warning",
        message: "git-workflow is installed, but the expected explicit-permission git safety warning was not found."
      });
    }
  }

  if (config.installedPacks.includes("test-driven-development") && !hasScript(packageJson, "test")) {
    issues.push({
      level: "warning",
      message: "test-driven-development is installed, but package.json has no test script."
    });
  }

  for (const recommendedPack of recommendPackNames(analysis)) {
    if (!config.installedPacks.includes(recommendedPack) && registryPacks.has(recommendedPack)) {
      issues.push({
        level: "warning",
        message: `${recommendedPack} matches the detected stack but is not installed. Run \`npx @contextforge/cli add ${recommendedPack}\` if you want it.`
      });
    }
  }

  return { checks, issues };
}
