import { GENERATED_BLOCK_END, GENERATED_BLOCK_START } from "../fs/updateGeneratedBlock.js";

export async function compileClaudeMd(): Promise<string> {
  return [
    "# Claude Code Instructions",
    "",
    GENERATED_BLOCK_START,
    "ContextForge is installed for this repo.",
    "",
    "Before working, read the relevant instruction files in:",
    "",
    "- `.contextforge/agents/claude/`",
    "- `.contextforge/skills/`",
    "",
    "Follow the installed packs listed in `.contextforge/config.json`.",
    "Do not copy these instructions into this file.",
    GENERATED_BLOCK_END
  ].join("\n");
}
