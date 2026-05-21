import pc from "picocolors";
import type { DoctorReport, ProjectAnalysis } from "@contextforge/core";

function yesNo(value: boolean): string {
  return value ? pc.green("yes") : pc.dim("no");
}

export function formatAnalysis(analysis: ProjectAnalysis): string {
  const testing = [
    analysis.testing.vitest && "Vitest",
    analysis.testing.jest && "Jest",
    analysis.testing.playwright && "Playwright"
  ]
    .filter(Boolean)
    .join(", ");

  return [
    pc.bold("ContextForge detected:"),
    "",
    `Framework: ${analysis.framework}`,
    `Language: ${analysis.language}`,
    `Package manager: ${analysis.packageManager}`,
    `Tailwind CSS: ${yesNo(analysis.styling.tailwind)}`,
    `shadcn/ui: ${yesNo(analysis.styling.shadcn)}`,
    `Prisma: ${yesNo(analysis.database.prisma)}`,
    `Drizzle: ${yesNo(analysis.database.drizzle)}`,
    `Testing: ${testing || "not detected"}`,
    ""
  ].join("\n");
}

export function formatGeneratedFiles(files: string[]): string {
  if (files.length === 0) {
    return pc.dim("No files generated.");
  }

  return ["Generated:", ...files.map((file) => `${pc.green("OK")} ${file}`)].join("\n");
}

export function formatDoctorReport(report: DoctorReport): string {
  const lines = [pc.bold("ContextForge Doctor"), ""];

  for (const check of report.checks) {
    lines.push(`${pc.green("OK")} ${check}`);
  }

  if (report.issues.length === 0) {
    lines.push("", pc.green("No issues found."));
    return lines.join("\n");
  }

  lines.push("", pc.bold("Issues:"));

  for (const issue of report.issues) {
    const marker = issue.level === "error" ? pc.red("ERR") : pc.yellow("WARN");
    lines.push(`${marker} ${issue.message}`);
  }

  lines.push("", "Run:", "npx @contextforge/cli sync");

  return lines.join("\n");
}
