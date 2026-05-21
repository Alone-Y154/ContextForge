import { doctorProject } from "@contextforge/core";
import { formatDoctorReport } from "../format.js";
import { type RegistryCommandOptions } from "../registryOptions.js";

export async function doctorCommand(options: RegistryCommandOptions = {}): Promise<void> {
  const registry = options.registry?.at(-1);
  const report = await doctorProject(process.cwd(), registry ? { registry } : undefined);
  console.log(formatDoctorReport(report));

  if (report.issues.some((issue) => issue.level === "error")) {
    process.exitCode = 1;
  }
}
