import http from "node:http";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { downloadPackToContextForge, installPack } from "../registry/installPacks.js";
import { fetchRegistry } from "../registry/remoteRegistry.js";
import { makeTempProject, writeFile, writeJson } from "./helpers.js";

const servers: http.Server[] = [];

async function createStaticServer(root: string): Promise<string> {
  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/u, "");
    const filePath = path.join(root, relativePath);

    if (!(await fs.pathExists(filePath))) {
      response.statusCode = 404;
      response.end("not found");
      return;
    }

    response.end(await fs.readFile(filePath));
  });

  servers.push(server);

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Could not start static registry test server.");
      }

      resolve(`http://127.0.0.1:${address.port}/index.json`);
    });
  });
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

describe("remote registry", () => {
  it("loads a static remote registry and downloads selected pack files without writing a pack cache", async () => {
    const registryRoot = await makeTempProject("remote-registry");
    const packRoot = path.join(registryRoot, "packs/analytics-fundamentals");
    const projectRoot = await makeTempProject("remote-project");

    await writeJson(path.join(registryRoot, "index.json"), {
      version: "1",
      topics: ["analytics"],
      packs: [
        {
          name: "analytics-fundamentals",
          title: "Analytics Fundamentals",
          topic: "analytics",
          description: "Rules for analytics instrumentation and event quality.",
          path: "packs/analytics-fundamentals/pack.json",
          source: {
            provider: "contextforge",
            license: "MIT"
          }
        }
      ]
    });
    await writeJson(path.join(packRoot, "pack.json"), {
      name: "analytics-fundamentals",
      version: "1.0.0",
      title: "Analytics Fundamentals",
      topic: "analytics",
      description: "Rules for analytics instrumentation and event quality.",
      classification: "task-triggered",
      files: [
        { type: "rules", path: "rules.md" },
        {
          type: "agents",
          path: "agents.md",
          output: ".contextforge/instructions/agents/analytics-fundamentals.md"
        },
        {
          type: "skill",
          path: "skill.md",
          output: ".agents/skills/analytics-fundamentals/SKILL.md"
        }
      ],
      outputs: {
        globalRules: true,
        agentsInstruction: true,
        claudeInstruction: true,
        skill: true,
        cursorRule: true,
        copilotInstruction: true
      }
    });
    await writeFile(path.join(packRoot, "rules.md"), "# Analytics Rules");
    await writeFile(path.join(packRoot, "agents.md"), "# Analytics Agent Summary");
    await writeFile(path.join(packRoot, "skill.md"), "# Analytics Skill");

    const registryUrl = await createStaticServer(registryRoot);
    const registry = await fetchRegistry(registryUrl);

    expect(registry.packs.map((pack) => pack.name)).toEqual(["analytics-fundamentals"]);

    const result = await installPack(projectRoot, registryUrl, "analytics-fundamentals", {
      force: true
    });

    expect(result.manifest?.version).toBe("1.0.0");

    const installedPack = await downloadPackToContextForge(
      projectRoot,
      "analytics-fundamentals",
      result.manifest!,
      result.packUrl!
    );

    expect(installedPack.files.rules).toContain("Analytics Rules");
    expect(installedPack.files.skill).toContain("Analytics Skill");
    expect(await fs.pathExists(path.join(projectRoot, ".contextforge/packs"))).toBe(false);
  });
});
