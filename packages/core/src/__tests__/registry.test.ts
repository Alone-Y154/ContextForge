import { describe, expect, it } from "vitest";
import { PackManifestSchema, RegistryIndexSchema } from "../registry/registrySchema.js";

describe("registry schemas", () => {
  it("validates remote registry index summaries", () => {
    const registry = RegistryIndexSchema.parse({
      name: "contextforge-registry",
      version: "0.1.0",
      topics: ["database"],
      packs: [
        {
          name: "supabase",
          title: "Supabase",
          topic: "database",
          description: "Rules for Supabase projects.",
          path: "packs/supabase/pack.json",
          source: {
            provider: "contextforge",
            license: "MIT"
          }
        }
      ]
    });

    expect(registry.packs.map((pack) => pack.name)).toEqual(["supabase"]);
  });

  it("rejects invalid pack metadata", () => {
    expect(() =>
      PackManifestSchema.parse({
        name: "broken",
        title: "Broken",
        description: "Missing topic",
        files: []
      })
    ).toThrow();
  });
});
