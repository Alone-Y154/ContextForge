import { checkbox, confirm } from "@inquirer/prompts";
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

const CAPABILITY_PACKS = [
  "system-design",
  "frontend-system-design",
  "api-design",
  "test-driven-development"
];

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

async function selectRecommendedPacks(recommended: RegistryPackSummary[]): Promise<RegistryPackSummary[]> {
  if (recommended.length === 0) {
    return [];
  }

  if (!canPrompt()) {
    return [];
  }

  const wantsRecommendations = await confirm({
    message: "Install recommended stack-specific packs?",
    default: true
  });

  if (!wantsRecommendations) {
    return [];
  }

  const selected = await checkbox<string>({
    message: "Select recommended packs to install",
    choices: recommended.map((pack) => ({
      name: `${pack.title} (${pack.name})`,
      value: pack.name,
      description: pack.description,
      checked: true
    }))
  });

  return recommended.filter((pack) => selected.includes(pack.name));
}

async function selectCapabilityPacks(registryPacks: RegistryPackSummary[]): Promise<RegistryPackSummary[]> {
  if (!canPrompt()) {
    return [];
  }

  const available = CAPABILITY_PACKS.map((packName) =>
    registryPacks.find((pack) => pack.name === packName)
  ).filter((pack): pack is RegistryPackSummary => Boolean(pack));

  if (available.length === 0) {
    return [];
  }

  const selected = await checkbox<string>({
    message: "Add optional architecture or testing packs?",
    choices: available.map((pack) => ({
      name: `${pack.title} (${pack.name})`,
      value: pack.name,
      description: pack.description,
      checked: false
    }))
  });

  return available.filter((pack) => selected.includes(pack.name));
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

  if (recommended.length > 0) {
    console.log(pc.bold("Recommended optional packs:"));
    for (const pack of recommended) {
      console.log(`${pc.green("OK")} ${pack.name}`);
    }
    console.log("");
  }

  const tools = await selectTools();
  const optionalPacks = await selectRecommendedPacks(recommended);
  const capabilityPacks = await selectCapabilityPacks(registry.packs);
  const packNames = [
    ...new Set([
      ...DEFAULT_CORE_PACKS.filter((packName) => registry.packs.some((pack) => pack.name === packName)),
      ...optionalPacks.map((pack) => pack.name),
      ...capabilityPacks.map((pack) => pack.name)
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
}
