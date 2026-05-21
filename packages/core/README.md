# ContextForge Core

Website: https://contextforge.org

`@contextforge/core` contains the detection, registry, sync, doctor, config, lockfile, and generation logic used by the ContextForge CLI.

Most users should run the CLI:

```bash
npx @contextforge/cli init
```

## What Core Handles

- Detects project stacks such as Next.js, TypeScript, Tailwind, shadcn/ui, Prisma, Drizzle, Vitest, Jest, and Playwright.
- Fetches the official remote registry.
- Resolves pack manifests and pack files.
- Installs instruction content under `.contextforge`.
- Writes and migrates `.contextforge/config.json`.
- Writes `.contextforge/lock.json`.
- Generates small root pointer files for `AGENTS.md` and `CLAUDE.md`.
- Runs `doctor` checks for missing files, stale packs, and mismatched project state.

## Official Registry

```txt
https://registry.contextforge.org/index.json
```

## Generated Layout

Core writes prompt content under `.contextforge`:

```txt
.contextforge/
  config.json
  lock.json
  agents/
    codex/<pack>.md
    claude/<pack>.md
    cursor/<pack>.md
    copilot/<pack>.md
  skills/
    <pack>/SKILL.md
```

Root `AGENTS.md` and `CLAUDE.md` files are pointer files only. They tell agents to read `.contextforge`.

## Links

- Website: https://contextforge.org
- Main repo: https://github.com/Alone-Y154/ContextForge
- Registry repo: https://github.com/Alone-Y154/ContextForge-registry
- npm CLI: https://www.npmjs.com/package/@contextforge/cli
- npm Core: https://www.npmjs.com/package/@contextforge/core
- Registry: https://registry.contextforge.org/index.json

## License

MIT
