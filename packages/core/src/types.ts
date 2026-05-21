export type PackageManager = "pnpm" | "npm" | "yarn" | "bun" | "unknown";

export type ProjectFramework =
  | "next-app-router"
  | "next-pages-router"
  | "vite-react"
  | "unknown";

export type ProjectLanguage = "typescript" | "javascript";

export type AITool = "codex" | "claude" | "cursor" | "copilot";

export type ProjectAnalysis = {
  root: string;
  packageManager: PackageManager;
  framework: ProjectFramework;
  language: ProjectLanguage;
  styling: {
    tailwind: boolean;
    shadcn: boolean;
  };
  database: {
    prisma: boolean;
    drizzle: boolean;
  };
  services: {
    supabase: boolean;
  };
  testing: {
    vitest: boolean;
    jest: boolean;
    playwright: boolean;
  };
  aiTools: {
    agentsMd: boolean;
    claudeMd: boolean;
    cursorRules: boolean;
    copilotInstructions: boolean;
  };
};

export type GeneratedFile = {
  path: string;
  content: string;
};
