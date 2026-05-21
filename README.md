# ContextForge

Website: https://contextforge.org

ContextForge is a registry-powered CLI that installs curated AI-agent instruction packs into existing codebases.

```bash
npx @contextforge/cli init
```

## Product Promise

Make any repo AI-agent ready.

ContextForge is not an MCP gateway, tool proxy, API gateway, or replacement for skills.sh. It is a repo-level AI-agent instruction installer.

It fetches curated instruction packs from the official registry and installs them into the user's project under `.contextforge`.

## Links

- Main repo: https://github.com/Alone-Y154/ContextForge
- Registry repo: https://github.com/Alone-Y154/ContextForge-registry
- Website repo: https://github.com/Alone-Y154/Contextforge-web
- npm CLI: https://www.npmjs.com/package/@contextforge/cli
- npm Core: https://www.npmjs.com/package/@contextforge/core
- Registry: https://registry.contextforge.org/index.json

## How It Works

```txt
Remote registry
https://registry.contextforge.org/index.json
        |
        v
ContextForge CLI
npx @contextforge/cli init
        |
        v
User repo
.contextforge/
  config.json
  lock.json
  agents/
  skills/
        |
        v
Tiny root pointers
AGENTS.md
CLAUDE.md
```

The registry is public and static. The CLI fetches packs from the registry. The user repo stores installed instructions under `.contextforge`. Root files only point to `.contextforge`.

## Quick Start

Run inside an existing project:

```bash
npx @contextforge/cli init
```

Add extra packs:

```bash
npx @contextforge/cli add supabase
npx @contextforge/cli add nextjs-best-practices
npx @contextforge/cli add system-design
```

Sync installed packs:

```bash
npx @contextforge/cli sync
```

Check health:

```bash
npx @contextforge/cli doctor
```

List and search the registry:

```bash
npx @contextforge/cli list
npx @contextforge/cli search react
```

## Generated Structure

ContextForge uses `.contextforge` as the local source of truth:

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

Root `AGENTS.md` and `CLAUDE.md` are tiny pointer files for agent auto-discovery. They tell the agent to read `.contextforge` instead of copying pack content into the root file.

## Commands

```bash
npx @contextforge/cli init
npx @contextforge/cli add <pack>
npx @contextforge/cli sync
npx @contextforge/cli doctor
npx @contextforge/cli list
npx @contextforge/cli search <query>
```

For registry testing, registry-backed commands support:

```bash
--registry https://example.com/index.json
```

Normal users do not need to pass a registry URL.

## Safety

ContextForge preserves user-written root file content. It only updates generated blocks between:

```md
<!-- contextforge:start -->
<!-- contextforge:end -->
```

## Development

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

Packages:

- `@contextforge/cli`: the npm CLI users run with `npx`.
- `@contextforge/core`: detection, registry fetching, config, sync, doctor, and generation logic.

## License

MIT
