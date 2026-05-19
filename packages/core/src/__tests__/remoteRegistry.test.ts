import http from "node:http";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { cacheRemotePacks } from "../registry/installPacks.js";
import { loadRegistry } from "../registry/loadRegistry.js";
import { makeTempProject, writeFile, writeJson } from "./helpers.js";

const servers: http.Server[] = [];

async function createStaticServer(root: string): Promise<string> {
  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const filePath = path.join(root, decodeURIComponent(requestUrl.pathname));

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
  it("loads a static remote registry and caches selected packs into the project", async () => {
    const registryRoot = await makeTempProject("remote-registry");
    const packRoot = path.join(registryRoot, "packs/analytics-fundamentals");
    const projectRoot = await makeTempProject("remote-project");

    await writeJson(path.join(registryRoot, "index.json"), {
      version: "1",
      packs: [
        {
          name: "analytics-fundamentals",
          version: "1.0.0",
          baseUrl: "./packs/analytics-fundamentals/"
        }
      ]
    });
    await writeJson(path.join(packRoot, "pack.json"), {
      name: "analytics-fundamentals",
      version: "1.0.0",
      title: "Analytics Fundamentals",
      description: "Rules for analytics instrumentation and event quality.",
      category: "workflow",
      outputs: {
        globalRules: true,
        skill: true,
        cursorRule: true,
        copilotInstruction: true
      }
    });
    await writeFile(path.join(packRoot, "rules.md"), "# Analytics Rules");
    await writeFile(path.join(packRoot, "skill.md"), "# Analytics Skill");

    const registryUrl = await createStaticServer(registryRoot);
    const packs = await loadRegistry({ root: projectRoot, sources: [registryUrl] });
    const remotePack = packs.find((pack) => pack.name === "analytics-fundamentals");

    expect(remotePack?.source).toBe("remote");
    expect(remotePack?.version).toBe("1.0.0");
    expect(remotePack?.files.rules).toContain("Analytics Rules");

    await cacheRemotePacks(projectRoot, remotePack ? [remotePack] : []);

    const cachedPacks = await loadRegistry({ root: projectRoot, sources: [] });
    const cachedPack = cachedPacks.find((pack) => pack.name === "analytics-fundamentals");

    expect(cachedPack?.source).toBe("project-cache");
    expect(cachedPack?.files.skill).toContain("Analytics Skill");
  });
});
