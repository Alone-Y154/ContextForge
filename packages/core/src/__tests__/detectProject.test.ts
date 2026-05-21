import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectProject } from "../detect/detectProject.js";
import { makeTempProject, writeFile, writeJson } from "./helpers.js";

describe("detectProject", () => {
  it("detects a Next.js App Router TypeScript project with common tooling", async () => {
    const root = await makeTempProject("next-app");

    await Promise.all([
      writeJson(path.join(root, "package.json"), {
        dependencies: { next: "latest", prisma: "latest", "@prisma/client": "latest" },
        devDependencies: { tailwindcss: "latest", vitest: "latest", "@playwright/test": "latest" }
      }),
      writeFile(path.join(root, "pnpm-lock.yaml")),
      writeFile(path.join(root, "tsconfig.json"), "{}"),
      writeFile(path.join(root, "app/page.tsx")),
      writeFile(path.join(root, "components.json"), "{}"),
      writeFile(path.join(root, "prisma/schema.prisma")),
      writeFile(path.join(root, "AGENTS.md")),
      writeFile(path.join(root, "CLAUDE.md")),
      writeFile(path.join(root, ".cursor/rules/project.mdc")),
      writeFile(path.join(root, ".github/copilot-instructions.md"))
    ]);

    const analysis = await detectProject(root);

    expect(analysis.packageManager).toBe("pnpm");
    expect(analysis.framework).toBe("next-app-router");
    expect(analysis.language).toBe("typescript");
    expect(analysis.styling).toEqual({ tailwind: true, shadcn: true });
    expect(analysis.database).toEqual({ prisma: true, drizzle: false });
    expect(analysis.testing).toEqual({ vitest: true, jest: false, playwright: true });
    expect(analysis.aiTools).toEqual({
      agentsMd: true,
      claudeMd: true,
      cursorRules: true,
      copilotInstructions: true
    });
  });

  it("detects Pages Router, Vite, Drizzle, Jest, and JavaScript defaults", async () => {
    const pagesRoot = await makeTempProject("pages");
    await Promise.all([
      writeFile(path.join(pagesRoot, "package-lock.json")),
      writeFile(path.join(pagesRoot, "src/pages/index.jsx")),
      writeFile(path.join(pagesRoot, "jest.config.js")),
      writeFile(path.join(pagesRoot, "drizzle.config.ts"))
    ]);

    const pagesAnalysis = await detectProject(pagesRoot);
    expect(pagesAnalysis.packageManager).toBe("npm");
    expect(pagesAnalysis.framework).toBe("next-pages-router");
    expect(pagesAnalysis.language).toBe("javascript");
    expect(pagesAnalysis.database.drizzle).toBe(true);
    expect(pagesAnalysis.testing.jest).toBe(true);

    const viteRoot = await makeTempProject("vite");
    await writeFile(path.join(viteRoot, "vite.config.ts"));

    const viteAnalysis = await detectProject(viteRoot);
    expect(viteAnalysis.framework).toBe("vite-react");
  });

  it("detects Tailwind v4 and shadcn from package dependencies", async () => {
    const root = await makeTempProject("tailwind-v4");

    await writeJson(path.join(root, "package.json"), {
      dependencies: {
        next: "16.2.6",
        shadcn: "^4.7.0"
      },
      devDependencies: {
        tailwindcss: "^4",
        "@tailwindcss/postcss": "^4",
        typescript: "^5"
      }
    });
    await writeFile(path.join(root, "package-lock.json"));
    await writeFile(path.join(root, "tsconfig.json"), "{}");
    await writeFile(path.join(root, "app/page.tsx"));

    const analysis = await detectProject(root);

    expect(analysis.framework).toBe("next-app-router");
    expect(analysis.styling).toEqual({ tailwind: true, shadcn: true });
  });
});
