import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRegistry } from "../registry/loadRegistry.js";
import { makeTempProject, writeFile, writeJson } from "./helpers.js";

describe("loadRegistry", () => {
  it("loads and validates a local registry directory", async () => {
    const registryRoot = await makeTempProject("registry-valid");
    const packRoot = path.join(registryRoot, "supabase");

    await writeJson(path.join(packRoot, "pack.json"), {
      name: "supabase",
      title: "Supabase",
      description: "Rules for Supabase projects.",
      category: "database",
      outputs: {
        globalRules: true,
        skill: true,
        cursorRule: true,
        copilotInstruction: true
      }
    });
    await writeFile(path.join(packRoot, "rules.md"), "# Supabase Rules");

    const packs = await loadRegistry(registryRoot);

    expect(packs.map((pack) => pack.name)).toEqual(["supabase"]);
    expect(packs[0]?.source).toBe("local");
    expect(packs[0]?.outputs.skill).toBe(true);
  });

  it("rejects invalid pack metadata", async () => {
    const registryRoot = await makeTempProject("registry");
    const packRoot = path.join(registryRoot, "broken");

    await writeJson(path.join(packRoot, "pack.json"), {
      name: "broken",
      title: "Broken",
      description: "Invalid category",
      category: "nope",
      outputs: {
        globalRules: true,
        skill: false,
        cursorRule: true,
        copilotInstruction: true
      }
    });
    await writeFile(path.join(packRoot, "rules.md"), "# Broken");

    await expect(loadRegistry(registryRoot)).rejects.toThrow();
  });
});
