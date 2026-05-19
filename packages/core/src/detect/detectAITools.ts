import path from "node:path";
import fg from "fast-glob";
import fs from "fs-extra";

export async function detectAITools(root: string) {
  const cursorRules = await fg(".cursor/rules/**/*.{mdc,md}", {
    cwd: root,
    onlyFiles: true,
    dot: true
  });

  const copilotInstructions = await fg(".github/instructions/*.instructions.md", {
    cwd: root,
    onlyFiles: true,
    dot: true
  });

  return {
    agentsMd: await fs.pathExists(path.join(root, "AGENTS.md")),
    claudeMd:
      (await fs.pathExists(path.join(root, "CLAUDE.md"))) ||
      (await fs.pathExists(path.join(root, ".claude/CLAUDE.md"))),
    cursorRules: cursorRules.length > 0 || (await fs.pathExists(path.join(root, ".cursor/rules"))),
    copilotInstructions:
      (await fs.pathExists(path.join(root, ".github/copilot-instructions.md"))) ||
      copilotInstructions.length > 0
  };
}
