import { describe, expect, it } from "vitest";
import { addPackToConfig } from "../config/saveConfig.js";
import type { ContextForgeConfig } from "../config/configSchema.js";

describe("config helpers", () => {
  it("adds packs idempotently", () => {
    const config: ContextForgeConfig = {
      version: "0.1.0",
      registries: ["official"],
      tools: ["codex"],
      packs: ["env-secrets"],
      packageManager: "pnpm",
      generatedFiles: []
    };

    expect(addPackToConfig(config, "env-secrets").packs).toEqual(["env-secrets"]);
    expect(addPackToConfig(config, "prisma-migrations").packs).toEqual([
      "env-secrets",
      "prisma-migrations"
    ]);
  });
});
