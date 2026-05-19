import { doctorProject } from "@contextforge/core";
import { formatDoctorReport } from "../format.js";

export async function doctorCommand(): Promise<void> {
  const report = await doctorProject(process.cwd());
  console.log(formatDoctorReport(report));

  if (report.issues.some((issue) => issue.level === "error")) {
    process.exitCode = 1;
  }
}
