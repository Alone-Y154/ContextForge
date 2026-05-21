#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";
import { addCommand } from "./commands/add.js";
import { doctorCommand } from "./commands/doctor.js";
import { initCommand } from "./commands/init.js";
import { syncCommand } from "./commands/sync.js";
import { collectRegistryOption } from "./registryOptions.js";

const program = new Command();

program
  .name("contextforge")
  .description("Make existing codebases AI-agent ready")
  .version("0.1.1");

program
  .command("init")
  .description("Initialize AI-agent instructions")
  .option("--registry <url>", "Static remote registry index URL", collectRegistryOption, [])
  .action(initCommand);

program
  .command("add")
  .argument("<pack>")
  .description("Add an instruction pack")
  .option("--registry <url>", "Static remote registry index URL", collectRegistryOption, [])
  .action(addCommand);

program
  .command("sync")
  .description("Sync generated AI instruction files")
  .option("--registry <url>", "Static remote registry index URL", collectRegistryOption, [])
  .action(syncCommand);

program.command("doctor").description("Check whether AI instructions match the repo").action(doctorCommand);

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(`Error: ${message}`));
  process.exitCode = 1;
});
