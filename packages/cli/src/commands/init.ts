import { checkbox } from "@inquirer/prompts";
import {
  DEFAULT_TOOLS,
  cacheRemotePacks,
  createConfig,
  detectProject,
  loadRegistry,
  recommendPacks,
  saveConfig,
  syncProject,
  type AITool,
  type LoadedPack
} from "@contextforge/core";
import ora from "ora";
import pc from "picocolors";
import { formatAnalysis, formatGeneratedFiles } from "../format.js";
import { resolveRegistrySources, type RegistryCommandOptions } from "../registryOptions.js";

const TOOL_LABELS: Record<AITool, string> = {
  codex: "Codex",
  claude: "Claude Code",
  cursor: "Cursor",
  copilot: "GitHub Copilot"
};

function canPrompt(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function selectTools(): Promise<AITool[]> {
  if (!canPrompt()) {
    return DEFAULT_TOOLS;
  }

  return checkbox<AITool>({
    message: "Which AI tools should ContextForge configure?",
    required: true,
    choices: DEFAULT_TOOLS.map((tool) => ({
      name: TOOL_LABELS[tool],
      value: tool,
      checked: true
    }))
  });
}

async function selectPacks(registry: LoadedPack[], recommended: LoadedPack[]): Promise<LoadedPack[]> {
  if (registry.length === 0) {
    return [];
  }

  if (!canPrompt()) {
    return recommended;
  }

  const recommendedNames = new Set(recommended.map((pack) => pack.name));
  const selectedNames = await checkbox<string>({
    message: "Which instruction packs should be installed?",
    required: true,
    choices: registry.map((pack) => ({
      name: `${pack.title} (${pack.name})`,
      value: pack.name,
      description: pack.description,
      checked: recommendedNames.has(pack.name)
    }))
  });

  return registry.filter((pack) => selectedNames.includes(pack.name));
}

export async function initCommand(options: RegistryCommandOptions = {}): Promise<void> {
  const root = process.cwd();
  const registrySources = resolveRegistrySources(undefined, options);
  const spinner = ora("Detecting project").start();
  const [analysis, registry] = await Promise.all([
    detectProject(root),
    loadRegistry({ root, sources: registrySources })
  ]);
  const recommended = await recommendPacks(analysis, registry);

  spinner.succeed("Project detected");
  console.log(formatAnalysis(analysis));

  if (recommended.length > 0) {
    console.log(pc.bold("Recommended packs:"));
    for (const pack of recommended) {
      console.log(`${pc.green("OK")} ${pack.name}`);
    }
    console.log("");
  } else if (registry.length === 0) {
    console.log(
      pc.yellow("No packs were available from the official registry. Check your network or run with a private --registry URL.")
    );
    console.log("");
  }

  const tools = await selectTools();
  const packs = await selectPacks(registry, recommended);

  await cacheRemotePacks(root, packs);

  const initialConfig = createConfig(analysis, packs, tools, registrySources);

  await saveConfig(root, initialConfig);

  const result = await syncProject(root, initialConfig);

  console.log(pc.green("ContextForge initialized."));
  console.log(formatGeneratedFiles(result.generatedFiles));
}
