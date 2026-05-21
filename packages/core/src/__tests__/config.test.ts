import { describe, expect, it } from "vitest";
import { addPackToConfig } from "../config/saveConfig.js";
import type { ContextForgeConfig } from "../config/configSchema.js";

describe("config helpers", () => {
  it("adds packs idempotently", () => {
    const config: ContextForgeConfig = {
      version: "0.1.0",
      registry: "https://registry.contextforge.org/index.json",
      tools: ["codex"],
      installedPacks: ["env-secrets"],
      defaultCorePacks: [],
      generatedFiles: []
    };

    expect(addPackToConfig(config, "env-secrets").installedPacks).toEqual(["env-secrets"]);
    expect(addPackToConfig(config, "prisma-migrations").installedPacks).toEqual([
      "env-secrets",
      "prisma-migrations"
    ]);
  });
});
