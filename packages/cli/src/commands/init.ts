import { checkbox } from "@inquirer/prompts";
import {
  DEFAULT_CORE_PACKS,
  DEFAULT_TOOLS,
  createConfig,
  detectProject,
  fetchRegistry,
  installPack,
  missingMandatoryCorePacks,
  recommendPacks,
  syncProject,
  type AITool,
  type RegistryPackSummary
} from "@contextforge/core";
import ora from "ora";
import pc from "picocolors";
import { formatAnalysis, formatGeneratedFiles } from "../format.js";
import { resolveRegistryUrl, type RegistryCommandOptions } from "../registryOptions.js";

const TOOL_LABELS: Record<AITool, string> = {
  codex: "Codex",
  claude: "Claude Code",
  cursor: "Cursor",
  copilot: "GitHub Copilot"
};

type ToolSelection = AITool | "all";

function canPrompt(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function selectTools(): Promise<AITool[]> {
  if (!canPrompt()) {
    return DEFAULT_TOOLS;
  }

  const selected = await checkbox<ToolSelection>({
    message: "Which AI tools should ContextForge configure?",
    required: true,
    choices: [
      { name: "All agents", value: "all", checked: true },
      ...DEFAULT_TOOLS.map((tool) => ({
        name: TOOL_LABELS[tool],
        value: tool,
        checked: false
      }))
    ]
  });

  return selected.includes("all")
    ? DEFAULT_TOOLS
    : selected.filter((tool): tool is AITool => tool !== "all");
}

function printRecommendedAddCommands(recommended: RegistryPackSummary[]): void {
  if (recommended.length === 0) {
    return;
  }

  console.log("");
  console.log(pc.bold("Recommended packs:"));
  for (const pack of recommended) {
    console.log(`npx @contextforge/cli add ${pack.name}`);
  }
}

export async function initCommand(options: RegistryCommandOptions = {}): Promise<void> {
  const root = process.cwd();
  const registryUrl = resolveRegistryUrl(undefined, options);
  const spinner = ora("Detecting project and fetching registry").start();
  const [analysis, registry] = await Promise.all([detectProject(root), fetchRegistry(registryUrl)]);
  const recommended = await recommendPacks(analysis, registry);
  const missingMandatory = missingMandatoryCorePacks(registry);

  spinner.succeed("Project detected");
  console.log(formatAnalysis(analysis));

  if (missingMandatory.length > 0) {
    console.log(pc.yellow(`Mandatory packs missing from registry: ${missingMandatory.join(", ")}`));
    console.log("");
  }

  const tools = await selectTools();
  const packNames = [
    ...new Set([
      ...DEFAULT_CORE_PACKS.filter((packName) => registry.packs.some((pack) => pack.name === packName))
    ])
  ];

  for (const packName of packNames) {
    await installPack(root, registryUrl, packName, { force: true });
  }

  const initialConfig = createConfig(
    analysis,
    packNames.map((name) => ({ name })),
    tools,
    registryUrl
  );
  const result = await syncProject(root, initialConfig);

  console.log(pc.green("ContextForge initialized."));
  console.log(formatGeneratedFiles(result.generatedFiles));
  printRecommendedAddCommands(recommended);
}
