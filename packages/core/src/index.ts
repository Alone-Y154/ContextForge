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
  PackFileSchema,
  PackFileTypeSchema,
  PackManifestSchema,
  PackSchema,
  type Pack,
  type PackFile,
  type PackFileType,
  type PackManifest,
  type InstalledPack,
  type LoadedPack,
  RegistryIndexSchema,
  RegistryPackSourceSchema,
  RegistryPackSummarySchema,
  type RegistryIndex,
  type RegistryPackSummary
} from "./registry/registrySchema.js";
export {
  DEFAULT_REGISTRY_SOURCES,
  OFFICIAL_REGISTRY_SOURCE,
  OFFICIAL_REGISTRY_URL,
  PROJECT_PACK_CACHE,
  loadProjectPacks,
  loadRegistry,
  loadRemotePack,
  registrySourceToUrl
} from "./registry/loadRegistry.js";
export {
  fetchPackFile,
  fetchPackManifest,
  fetchRegistry,
  fetchText,
  findPackSummary,
  listRegistryPacks,
  resolvePackFileUrl,
  resolvePackUrl,
  searchRegistryPacks
} from "./registry/remoteRegistry.js";
export {
  findPack,
  mandatoryCorePacks,
  manifestMatchesProject,
  missingMandatoryCorePacks,
  packageManagerLabel,
  packMatchesProject,
  recommendPackNames,
  recommendPacks,
  resolvePacks
} from "./registry/resolvePack.js";
export {
  ConfigSchema,
  DEFAULT_CORE_PACKS,
  DEFAULT_TOOLS,
  ToolSchema,
  normalizeConfig,
  type ContextForgeConfig
} from "./config/configSchema.js";
export { createConfig } from "./config/defaultConfig.js";
export { LOCK_PATH, loadLock, saveLock, updateContextForgeLock, type ContextForgeLock } from "./config/lockFile.js";
export { CONFIG_PATH, loadConfig } from "./config/loadConfig.js";
export { addPackToConfig, saveConfig } from "./config/saveConfig.js";
export { hasPackage, hasScript, readPackageJson, type PackageJson } from "./project/packageJson.js";
export {
  downloadPackToContextForge,
  installPack,
  type InstallPackOptions,
  type InstallPackResult
} from "./registry/installPacks.js";
export { compileOutputs } from "./compiler/compileOutputs.js";
export { compileAgentsMd } from "./compiler/compileAgentsMd.js";
export { compileClaudeMd } from "./compiler/compileClaudeMd.js";
export { generateToolOutputs } from "./compiler/generateToolOutputs.js";
export { writeGeneratedFiles } from "./compiler/writeGeneratedFiles.js";
export { safeWriteFile } from "./fs/safeWriteFile.js";
export {
  GENERATED_BLOCK_END,
  GENERATED_BLOCK_START,
  getGeneratedBlock,
  removeGeneratedBlock,
  updateGeneratedBlock,
  wrapGeneratedBlock
} from "./fs/updateGeneratedBlock.js";
export {
  installPackAndSync,
  pathExists,
  readInstalledPacks,
  syncInstalledPacks,
  syncProject,
  updateContextForgeConfig,
  type InstallAndSyncOptions,
  type SyncResult
} from "./sync.js";
export { doctorProject, type DoctorIssue, type DoctorReport } from "./doctor/doctorProject.js";
