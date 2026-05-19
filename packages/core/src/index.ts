export type {
  AITool,
  GeneratedFile,
  PackageManager,
  ProjectAnalysis,
  ProjectFramework,
  ProjectLanguage
} from "./types.js";
export { detectProject } from "./detect/detectProject.js";
export { detectPackageManager } from "./detect/detectPackageManager.js";
export {
  PackSchema,
  RemotePackEntrySchema,
  RemotePackFilesSchema,
  RemoteRegistryIndexSchema,
  type Pack,
  type LoadedPack,
  type RemoteRegistryIndex
} from "./registry/registrySchema.js";
export {
  DEFAULT_REGISTRY_SOURCES,
  OFFICIAL_REGISTRY_SOURCE,
  OFFICIAL_REGISTRY_URL,
  PROJECT_PACK_CACHE,
  loadRegistry
} from "./registry/loadRegistry.js";
export {
  findPack,
  packageManagerLabel,
  packMatchesProject,
  recommendPacks,
  resolvePacks
} from "./registry/resolvePack.js";
export { ConfigSchema, type ContextForgeConfig } from "./config/configSchema.js";
export { DEFAULT_TOOLS, createConfig } from "./config/defaultConfig.js";
export { CONFIG_PATH, loadConfig } from "./config/loadConfig.js";
export { addPackToConfig, saveConfig } from "./config/saveConfig.js";
export { hasPackage, hasScript, readPackageJson, type PackageJson } from "./project/packageJson.js";
export { cacheRemotePacks, saveInstalledPacks } from "./registry/installPacks.js";
export { compileOutputs } from "./compiler/compileOutputs.js";
export { writeGeneratedFiles } from "./compiler/writeGeneratedFiles.js";
export { safeWriteFile } from "./fs/safeWriteFile.js";
export {
  GENERATED_BLOCK_END,
  GENERATED_BLOCK_START,
  getGeneratedBlock,
  updateGeneratedBlock,
  wrapGeneratedBlock
} from "./fs/updateGeneratedBlock.js";
export { syncProject, type SyncResult } from "./sync.js";
export { doctorProject, type DoctorIssue, type DoctorReport } from "./doctor/doctorProject.js";
