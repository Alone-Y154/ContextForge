# ContextForge TODO

## Phase 1: Repo Scaffold
- [x] Initialize git repo.
- [x] Create pnpm monorepo structure.
- [x] Add root `package.json`, `pnpm-workspace.yaml`, and `tsconfig.base.json`.
- [x] Create `packages/cli` and `packages/core`.
- [x] Add TypeScript, tsup, Vitest, and workspace scripts.

## Phase 2: CLI Skeleton
- [x] Add Commander entrypoint with `#!/usr/bin/env node`.
- [x] Implement placeholder `init`, `add`, `sync`, and `doctor` commands.
- [x] Configure `bin.contextforge`.
- [x] Verify `pnpm build` and local CLI execution work.

## Phase 3: Project Detection
- [x] Implement `ProjectAnalysis` type.
- [x] Detect package manager.
- [x] Detect Next.js App Router, Pages Router, and Vite.
- [x] Detect TypeScript, Tailwind, shadcn/ui, Prisma, Drizzle, Vitest, Jest, Playwright.
- [x] Detect existing Codex, Claude, Cursor, and Copilot instruction files.
- [x] Add detector fixture tests.

## Phase 4: Registry
- [x] Implement Zod pack schema.
- [x] Implement remote registry loader.
- [x] Implement project pack cache loader.
- [x] Add registry validation tests.

## Phase 5: Compiler
- [x] Implement generated block replacement.
- [x] Implement safe file writes that preserve user content.
- [x] Compile `AGENTS.md`.
- [x] Compile `CLAUDE.md`.
- [x] Compile Cursor `.mdc` rules.
- [x] Compile Copilot instructions.
- [x] Compile Codex skills into `.agents/skills/<pack>/SKILL.md`.
- [x] Add compiler tests.

## Phase 6: Init and Sync
- [x] Implement `.contextforge/config.json` schema.
- [x] Implement config load/save.
- [x] Build `init` flow: detect, prompt, recommend packs, save config, generate files.
- [x] Build `sync` flow: load config, re-detect, compile, write outputs.
- [x] Verify repeated sync is stable.

## Phase 7: Add Command
- [x] Load existing config.
- [x] Validate requested pack exists.
- [x] Add pack idempotently.
- [x] Re-run sync after add.
- [x] Print generated file summary.

## Phase 8: Doctor
- [x] Check config exists.
- [x] Check enabled tool files exist.
- [x] Warn when installed packs no longer match detected repo.
- [x] Warn when configured package manager differs from lockfiles.
- [x] Warn when testing workflow is installed but no test script exists.
- [x] Add doctor tests.

## Phase 9: Real Project Validation
- [ ] Test fresh Next.js app.
- [ ] Test Next.js + Prisma app.
- [ ] Test Next.js + Drizzle app.
- [ ] Test Vite React app.
- [ ] Test repo with existing `AGENTS.md`.
- [ ] Test JavaScript-only repo.

## Phase 10: Publish Prep
- [x] Run `pnpm build`.
- [x] Run `pnpm test`.
- [x] Run `npm publish --dry-run`.
- [x] Confirm generated package includes executable `dist/index.js`.

## Phase 11: Static Remote Registry
- [x] Add static remote `index.json` registry loading.
- [x] Add `--registry <url>` support for `init`, `add`, and `sync`.
- [x] Add `CONTEXTFORGE_REGISTRY_URL` support.
- [x] Cache selected remote packs into `.contextforge/packs/<pack-name>`.
- [x] Write `.contextforge/installed-packs.json`.
- [x] Add remote registry tests.
- [x] Document the static registry format.
- [x] Remove bundled prompt packs from the npm package design.
